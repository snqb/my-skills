#!/usr/bin/env python3
"""
Crypto wallet scanner: find BIP39 seeds, derive addresses, check balances.
Async parallel balance checking across 10+ chains.

Usage:
    python3 scanner.py scan-telegram [--json]
    python3 scanner.py check-seed "word1 word2 ... word12" [--json]
    python3 scanner.py check-file seeds.txt [--json]
"""

import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import aiohttp
from mnemonic import Mnemonic
from bip_utils import (
    Bip39SeedGenerator, Bip44, Bip44Coins, Bip44Changes,
    Bip84, Bip84Coins,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
TELEGRAM_SESSION = (
    Path.home() / ".pi/agent/skills/telegram-channel-discovery/.pi_telegram_session"
)
MAX_CONCURRENT = 20  # semaphore limit for HTTP requests
HTTP_TIMEOUT = 15

BIP39_M = Mnemonic("english")
BIP39_WORDS = set(BIP39_M.wordlist)
SEED_LENGTHS = (12, 15, 18, 21, 24)

# ---------------------------------------------------------------------------
# EVM chain definitions
# ---------------------------------------------------------------------------
EVM_CHAINS = [
    {"name": "Ethereum",  "rpc": "https://eth.llamarpc.com",              "unit": "ETH",   "id": 1},
    {"name": "BSC",       "rpc": "https://bsc-dataseed.binance.org",      "unit": "BNB",   "id": 56},
    {"name": "Polygon",   "rpc": "https://polygon-rpc.com",               "unit": "MATIC", "id": 137},
    {"name": "Arbitrum",  "rpc": "https://arb1.arbitrum.io/rpc",          "unit": "ETH",   "id": 42161},
    {"name": "Optimism",  "rpc": "https://mainnet.optimism.io",           "unit": "ETH",   "id": 10},
    {"name": "Base",      "rpc": "https://mainnet.base.org",              "unit": "ETH",   "id": 8453},
    {"name": "Avalanche", "rpc": "https://api.avax.network/ext/bc/C/rpc", "unit": "AVAX",  "id": 43114},
]

# ERC-20 token contracts per chain  {chain_name: {symbol: (address, decimals)}}
ERC20_TOKENS: dict[str, dict[str, tuple[str, int]]] = {
    "Ethereum": {
        "USDT": ("0xdAC17F958D2ee523a2206206994597C13D831ec7", 6),
        "USDC": ("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6),
        "DAI":  ("0x6B175474E89094C44Da98b954EedeAC495271d0F", 18),
    },
    "BSC": {
        "USDT": ("0x55d398326f99059fF775485246999027B3197955", 18),
        "USDC": ("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18),
    },
    "Polygon": {
        "USDT": ("0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6),
        "USDC": ("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 6),
        "DAI":  ("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", 18),
    },
    "Arbitrum": {
        "USDT": ("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", 6),
        "USDC": ("0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 6),
        "DAI":  ("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", 18),
    },
    "Optimism": {
        "USDT": ("0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", 6),
        "USDC": ("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", 6),
        "DAI":  ("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", 18),
    },
    "Base": {
        "USDC": ("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6),
    },
    "Avalanche": {
        "USDT": ("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", 6),
        "USDC": ("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 6),
    },
}


# ============================= Seed Extraction =============================

def extract_seeds(text: str) -> list[str]:
    """Sliding-window BIP39 extraction with checksum validation."""
    if not text:
        return []
    clean = re.sub(r"[\n\r\t,;:]+", " ", text.lower())
    words = clean.split()
    seen: set[str] = set()
    results: list[str] = []
    for length in SEED_LENGTHS:
        if len(words) < length:
            continue
        for i in range(len(words) - length + 1):
            window = words[i : i + length]
            if all(w in BIP39_WORDS for w in window):
                phrase = " ".join(window)
                if phrase not in seen and BIP39_M.check(phrase):
                    seen.add(phrase)
                    results.append(phrase)
    return results


def _fmt_bal(val: float, unit: str) -> str:
    """Smart format: avoid showing 0.000000 for tiny values."""
    if val >= 0.01:
        return f"{val:.4f} {unit}"
    elif val >= 1e-6:
        return f"{val:.8f} {unit}"
    else:
        return f"{val:.2e} {unit}"


def mask_seed(phrase: str) -> str:
    w = phrase.split()
    return f"{w[0]} {w[1]} ... {w[-2]} {w[-1]} ({len(w)}w)"


# =========================== Address Derivation ============================

def derive_addresses(seed_phrase: str) -> dict[str, str]:
    """Derive addresses for all supported chain families."""
    seed = Bip39SeedGenerator(seed_phrase).Generate()
    addrs: dict[str, str] = {}

    # EVM (shared address for all EVM chains)
    try:
        eth = Bip44.FromSeed(seed, Bip44Coins.ETHEREUM)
        acc = eth.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["evm"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    # BTC segwit (bip84)
    try:
        btc = Bip84.FromSeed(seed, Bip84Coins.BITCOIN)
        acc = btc.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["btc_segwit"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    # BTC legacy (bip44)
    try:
        btc44 = Bip44.FromSeed(seed, Bip44Coins.BITCOIN)
        acc = btc44.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["btc_legacy"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    # Solana
    try:
        sol = Bip44.FromSeed(seed, Bip44Coins.SOLANA)
        acc = sol.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["sol"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    # TRON
    try:
        trx = Bip44.FromSeed(seed, Bip44Coins.TRON)
        acc = trx.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["tron"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    # Litecoin segwit
    try:
        ltc = Bip84.FromSeed(seed, Bip84Coins.LITECOIN)
        acc = ltc.Purpose().Coin().Account(0).Change(Bip44Changes.CHAIN_EXT).AddressIndex(0)
        addrs["ltc"] = acc.PublicKey().ToAddress()
    except Exception:
        pass

    return addrs


# ========================== Async HTTP Helpers ============================

async def _json_get(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore, url: str
) -> dict | None:
    async with sem:
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=HTTP_TIMEOUT)) as r:
                return await r.json(content_type=None)
        except Exception:
            return None


async def _json_post(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore, url: str, payload: dict
) -> dict | None:
    async with sem:
        try:
            async with session.post(
                url, json=payload, timeout=aiohttp.ClientTimeout(total=HTTP_TIMEOUT)
            ) as r:
                return await r.json(content_type=None)
        except Exception:
            return None


# ========================= Balance Checkers ================================

async def check_evm_chain(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore,
    chain: dict, evm_addr: str,
) -> dict:
    """Check native balance + ERC-20 tokens on one EVM chain, all in parallel."""
    name = chain["name"]
    rpc = chain["rpc"]
    unit = chain["unit"]

    # Build all RPC calls for this chain
    tasks = {}

    # Native balance
    tasks["native"] = _json_post(session, sem, rpc, {
        "jsonrpc": "2.0", "method": "eth_getBalance",
        "params": [evm_addr, "latest"], "id": 1,
    })

    # ERC-20 tokens
    tokens_cfg = ERC20_TOKENS.get(name, {})
    padded_addr = evm_addr.lower().replace("0x", "").zfill(64)
    call_data = "0x70a08231" + padded_addr

    for symbol, (contract, _decimals) in tokens_cfg.items():
        tasks[symbol] = _json_post(session, sem, rpc, {
            "jsonrpc": "2.0", "method": "eth_call",
            "params": [{"to": contract, "data": call_data}, "latest"], "id": 1,
        })

    # Fire all in parallel
    keys = list(tasks.keys())
    results = await asyncio.gather(*[tasks[k] for k in keys], return_exceptions=True)

    balances: dict[str, float] = {}

    for key, res in zip(keys, results):
        if isinstance(res, Exception) or res is None:
            continue
        hex_val = (res or {}).get("result", "0x0")
        if not hex_val or hex_val in ("0x", "0x0"):
            continue
        try:
            raw = int(hex_val, 16)
        except (ValueError, TypeError):
            continue

        if key == "native":
            bal = raw / 1e18
            if bal > 1e-9:  # ignore sub-gwei dust
                balances[unit] = bal
        else:
            _contract, decimals = tokens_cfg[key]
            bal = raw / (10 ** decimals)
            if bal > 0.001:
                balances[key] = bal

    return {"chain": name, "address": evm_addr, "balances": balances}


async def check_btc(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore,
    address: str, label: str,
) -> dict:
    data = await _json_get(session, sem, f"https://blockstream.info/api/address/{address}")
    bal = 0.0
    if data:
        stats = data.get("chain_stats", {})
        bal = (stats.get("funded_txo_sum", 0) - stats.get("spent_txo_sum", 0)) / 1e8
    return {"chain": label, "address": address, "balances": {"BTC": bal} if bal > 0 else {}}


async def check_sol(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore, address: str,
) -> dict:
    data = await _json_post(session, sem, "https://api.mainnet-beta.solana.com", {
        "jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [address],
    })
    bal = 0.0
    if data:
        bal = (data.get("result") or {}).get("value", 0) / 1e9
    return {"chain": "Solana", "address": address, "balances": {"SOL": bal} if bal > 0 else {}}


async def check_tron(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore, address: str,
) -> dict:
    data = await _json_get(
        session, sem,
        f"https://apilist.tronscanapi.com/api/accountv2?address={address}",
    )
    balances: dict[str, float] = {}
    if data:
        trx = data.get("balance", 0) / 1e6
        if trx > 0:
            balances["TRX"] = trx
        for tok in data.get("withPriceTokens", []):
            abbr = tok.get("tokenAbbr", "")
            if abbr in ("USDT", "USDC", "USDD"):
                dec = int(tok.get("tokenDecimal", 6))
                tb = float(tok.get("balance", "0")) / (10 ** dec)
                if tb > 0.001:
                    balances[abbr] = tb
    return {"chain": "TRON", "address": address, "balances": balances}


async def check_ltc(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore, address: str,
) -> dict:
    data = await _json_get(
        session, sem, f"https://api.blockcypher.com/v1/ltc/main/addrs/{address}/balance",
    )
    bal = 0.0
    if data:
        bal = data.get("balance", 0) / 1e8
    return {"chain": "Litecoin", "address": address, "balances": {"LTC": bal} if bal > 0 else {}}


# ====================== Scan One Seed (All Chains) =========================

async def scan_seed(
    session: aiohttp.ClientSession, sem: asyncio.Semaphore,
    seed_phrase: str, idx: int, quiet: bool = False,
) -> list[dict]:
    """Scan all chains for one seed. Returns list of findings with balances > 0."""
    masked = mask_seed(seed_phrase)
    addrs = derive_addresses(seed_phrase)

    if not quiet:
        print(f"\n{'─'*60}")
        print(f"🔑 Seed #{idx}: {masked}")
        for k, v in addrs.items():
            print(f"   {k}: {v}")

    if not addrs:
        return []

    # Build all chain-check tasks
    tasks: list[asyncio.Task] = []
    evm_addr = addrs.get("evm")
    if evm_addr:
        for chain in EVM_CHAINS:
            tasks.append(check_evm_chain(session, sem, chain, evm_addr))

    if addrs.get("btc_segwit"):
        tasks.append(check_btc(session, sem, addrs["btc_segwit"], "BTC-segwit"))
    if addrs.get("btc_legacy"):
        tasks.append(check_btc(session, sem, addrs["btc_legacy"], "BTC-legacy"))
    if addrs.get("sol"):
        tasks.append(check_sol(session, sem, addrs["sol"]))
    if addrs.get("tron"):
        tasks.append(check_tron(session, sem, addrs["tron"]))
    if addrs.get("ltc"):
        tasks.append(check_ltc(session, sem, addrs["ltc"]))

    # Fire ALL chain checks in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)

    findings: list[dict] = []
    for res in results:
        if isinstance(res, Exception):
            continue
        bals = res.get("balances", {})
        chain_name = res["chain"]
        if bals:
            if not quiet:
                parts = [_fmt_bal(v, k) for k, v in bals.items()]
                print(f"   💰 {chain_name}: {' | '.join(parts)}")
            findings.append({
                "seed_masked": masked,
                "chain": chain_name,
                "address": res["address"],
                "balances": bals,
            })
        elif not quiet:
            print(f"   ∅  {chain_name}")

    return findings


# ========================= Input Sources ===================================

def _get_pass(key: str) -> str:
    return subprocess.check_output(["pass", key], text=True).strip()


async def seeds_from_telegram() -> list[str]:
    """Scan Telegram Saved Messages for BIP39 seeds."""
    from telethon import TelegramClient  # noqa: deferred import

    api_id = int(_get_pass("telegram/me/api_id"))
    api_hash = _get_pass("telegram/me/api_hash")

    print("🔌 Connecting to Telegram...")
    client = TelegramClient(str(TELEGRAM_SESSION), api_id, api_hash)
    await client.start()
    me = await client.get_me()
    print(f"✅ Logged in as {me.first_name} (@{me.username})")

    print("📨 Scanning Saved Messages...")
    seeds: set[str] = set()
    count = 0
    async for msg in client.iter_messages("me", limit=None):
        count += 1
        if count % 500 == 0:
            print(f"   ...{count} messages", flush=True)
        for s in extract_seeds(msg.text or ""):
            seeds.add(s)

    await client.disconnect()
    print(f"   Scanned {count} messages → {len(seeds)} seed(s)")
    return sorted(seeds)


def seeds_from_file(path: str) -> list[str]:
    """Read seeds from a file (one per line, blank lines ignored)."""
    seeds: list[str] = []
    for line in Path(path).read_text().strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if BIP39_M.check(line.lower()):
            seeds.append(line.lower())
        else:
            # Try extracting from the line
            found = extract_seeds(line)
            seeds.extend(found)
            if not found:
                print(f"⚠️  Invalid seed skipped: {line[:40]}...")
    return seeds


def seeds_from_arg(phrase: str) -> list[str]:
    """Validate and return a single seed from CLI argument."""
    phrase = phrase.strip().lower()
    if BIP39_M.check(phrase):
        return [phrase]
    # Try extracting
    found = extract_seeds(phrase)
    if found:
        return found
    print(f"❌ Invalid BIP39 seed phrase (bad checksum or words)")
    sys.exit(1)


# ============================== Main =======================================

async def run_scan(seeds: list[str], json_output: bool = False):
    """Scan all seeds across all chains."""
    if not seeds:
        print("No valid seeds to scan.")
        return

    print(f"\n🔍 Scanning {len(seeds)} seed(s) across {len(EVM_CHAINS)} EVM + BTC + SOL + TRON + LTC...")
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    all_findings: list[dict] = []

    async with aiohttp.ClientSession(
        headers={"User-Agent": "Mozilla/5.0"}
    ) as session:
        for i, seed in enumerate(seeds, 1):
            findings = await scan_seed(session, sem, seed, i, quiet=json_output)
            all_findings.extend(findings)

    # Output
    if json_output:
        print(json.dumps(all_findings, indent=2))
    else:
        print(f"\n{'═'*60}")
        print(f"📋 SUMMARY — {len(seeds)} seeds, {len(all_findings)} finding(s)")
        print(f"{'═'*60}")
        if all_findings:
            for f in all_findings:
                parts = [_fmt_bal(v, k) for k, v in f["balances"].items()]
                print(f"  💰 [{f['chain']}] {' | '.join(parts)}")
                print(f"     Seed: {f['seed_masked']}")
                print(f"     Addr: {f['address']}")
        else:
            print("  No funds found on any chain.")

    # Save JSON report
    report = Path("/tmp/crypto_scan_results.json")
    report.write_text(json.dumps(all_findings, indent=2, default=str))
    if not json_output:
        print(f"\n📄 Results saved: {report}")


def usage():
    print(__doc__)
    sys.exit(1)


def main():
    args = sys.argv[1:]
    if not args:
        usage()

    cmd = args[0]
    json_out = "--json" in args

    if cmd == "scan-telegram":
        seeds = asyncio.run(seeds_from_telegram())
        asyncio.run(run_scan(seeds, json_out))

    elif cmd == "check-seed":
        if len(args) < 2:
            print("Usage: scanner.py check-seed \"word1 word2 ... word12\"")
            sys.exit(1)
        phrase = args[1]
        seeds = seeds_from_arg(phrase)
        asyncio.run(run_scan(seeds, json_out))

    elif cmd == "check-file":
        if len(args) < 2:
            print("Usage: scanner.py check-file /path/to/seeds.txt")
            sys.exit(1)
        seeds = seeds_from_file(args[1])
        asyncio.run(run_scan(seeds, json_out))

    else:
        usage()


if __name__ == "__main__":
    main()
