---
name: crypto-wallet-scanner
description: Check crypto balances by public address or BIP39 seed phrase. Supports BTC, ETH, all EVM L2s, SOL, TRON, LTC. Also scans Telegram saved messages for seed phrases. Async parallel checking via free public RPCs.
---

# Crypto Wallet Scanner

Find BIP39 seed phrases, derive HD wallet addresses across 10+ chains, check balances in parallel.

## Quick Start

```bash
cd ~/.pi/agent/skills/crypto-wallet-scanner

# First run: install dependencies into local venv
./setup.sh

# Check balance of a public address (auto-detects chain)
python3 scanner.py check-address 0x1234...abcd
python3 scanner.py check-address bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

# Multiple addresses at once
python3 scanner.py check-address 0xABC... TRX... bc1q...

# Addresses from file (one per line)
python3 scanner.py check-addresses /path/to/addresses.txt

# Scan Telegram saved messages for seeds → check all chains
python3 scanner.py scan-telegram

# Check a specific seed phrase
python3 scanner.py check-seed "word1 word2 ... word12"

# Check seeds from a file (one per line)
python3 scanner.py check-file /path/to/seeds.txt

# JSON output (works with all commands)
python3 scanner.py check-address 0x... --json
```

## Address Detection

| Format | Detected as |
|--------|-------------|
| `0x` + 40 hex chars | EVM (checks all 7 chains) |
| `bc1...` / `1...` / `3...` | Bitcoin |
| `T` + 33 base58 | TRON |
| `L...` / `M...` / `ltc1...` | Litecoin |
| 32-44 base58 chars | Solana |

## Chains & Tokens Checked

| Chain | Native | Tokens | RPC |
|-------|--------|--------|-----|
| **Bitcoin** | BTC (segwit + legacy) | — | blockstream.info |
| **Ethereum** | ETH | USDT, USDC, DAI | eth.llamarpc.com |
| **BSC** | BNB | USDT, USDC | bsc-dataseed.binance.org |
| **Polygon** | MATIC | USDT, USDC, DAI | polygon-rpc.com |
| **Arbitrum** | ETH | USDT, USDC, DAI | arb1.arbitrum.io |
| **Optimism** | ETH | USDT, USDC, DAI | mainnet.optimism.io |
| **Base** | ETH | USDC | mainnet.base.org |
| **Avalanche** | AVAX | USDT, USDC | api.avax.network |
| **Solana** | SOL | — | api.mainnet-beta.solana.com |
| **TRON** | TRX | USDT, USDC (via tronscan) | apilist.tronscanapi.com |
| **Litecoin** | LTC | — | blockcypher.com |

## Performance

- **Async parallel**: all chain checks run concurrently per seed (aiohttp + asyncio.gather)
- **Semaphore**: max 20 concurrent requests to avoid rate limits
- **~2s per seed** across all chains (was 30s+ sequential per seed)
- **16 seeds × 11 chains**: ~30s total (was 600s+ sequential, timing out)

## Architecture

```
scanner.py
├── Seed extraction: sliding window over BIP39 wordlist + checksum validation
├── Address derivation: bip_utils (Bip44/Bip84) for BTC/ETH/SOL/TRON/LTC
├── Balance checking: aiohttp parallel requests
│   ├── EVM chains: eth_getBalance + eth_call(balanceOf) for ERC-20
│   ├── BTC: blockstream REST API
│   ├── SOL: JSON-RPC getBalance
│   ├── TRON: tronscan REST API
│   └── LTC: blockcypher REST API
└── Output: human-readable + optional JSON
```

## Telegram Authentication

Reuses pre-authenticated session from telegram-channel-discovery skill:
```
~/.pi/agent/skills/telegram-channel-discovery/.pi_telegram_session.session
```

Credentials in `pass`:
- `pass telegram/me/api_id`
- `pass telegram/me/api_hash`
- `pass telegram/me/phone`

## Output

Findings are printed inline and summarized at the end. Use `--json` for machine-readable output to stdout. Results also saved to `/tmp/crypto_scan_results.json`.

## Dependencies

Managed via local venv (`./setup.sh`):
- `telethon` — Telegram MTProto client
- `mnemonic` — BIP39 wordlist + checksum
- `bip_utils` — HD wallet derivation
- `aiohttp` — async HTTP for parallel balance checks
