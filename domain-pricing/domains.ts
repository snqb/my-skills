#!/usr/bin/env -S deno run --allow-net --allow-run --allow-env
// Domain pricing via tldes.com API
// Usage: ./domains.ts <command> [args] [flags]

const BASE = "https://tldes.com/v1";

async function getKey(): Promise<string | null> {
  try {
    const p = new Deno.Command("pass", { args: ["show", "api/tldes"], stdout: "piped", stderr: "null" });
    const out = await p.output();
    if (out.success) return new TextDecoder().decode(out.stdout).trim();
  } catch { /* no pass */ }
  return Deno.env.get("TLDES_API_KEY") ?? null;
}

async function api(data: string, needsKey = false): Promise<any> {
  const key = await getKey();
  if (needsKey && !key) {
    console.error("❌ API key required. Store with: pass insert api/tldes");
    Deno.exit(1);
  }
  const url = key ? `${BASE}?data=${data}&key=${key}` : `${BASE}?data=${data}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) { console.error(`❌ ${json.error}`); Deno.exit(1); }
  return json;
}

// Cache for exchange rates
let ratesCache: Record<string, number> | null = null;

async function getRates(): Promise<Record<string, number>> {
  if (ratesCache) return ratesCache;
  try {
    const meta = await api("meta", true);
    const rates: Record<string, number> = { USD: 1 };
    if (meta.currencies?.rates) {
      for (const [code, info] of Object.entries(meta.currencies.rates as Record<string, { rate: number }>)) {
        rates[code] = info.rate;
      }
    }
    ratesCache = rates;
    return rates;
  } catch {
    return { USD: 1 };
  }
}

function toUSD(price: string, currency: string, rates: Record<string, number>): number {
  const p = parseFloat(price);
  if (isNaN(p) || currency === "USD") return p;
  const rate = rates[currency];
  if (!rate) return p; // can't convert, return as-is
  return p / rate; // rate is "1 USD = X foreign", so foreign/rate = USD
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

// ── Commands ──

async function cheapest(tld: string, flags: Set<string>) {
  const type = flags.has("--transfer") ? "transfer" : flags.has("--renew") ? "renewal" : "registration";
  const idx = type === "registration" ? 1 : type === "renewal" ? 2 : 3;

  const data = await api("prices", true);
  const rates = await getRates();

  type Entry = { registrar: string; price: number; raw: string; currency: string; icann: number };
  const entries: Entry[] = [];

  for (const reg of data.registrars) {
    const row = reg.prices.find((p: string[]) => p[0] === tld);
    if (!row) continue;
    const usd = toUSD(row[idx], reg.currency, rates);
    const icann = toUSD(reg.ICANNfee, reg.currency, rates);
    if (isNaN(usd)) continue;
    entries.push({ registrar: reg.name, price: usd + icann, raw: row[idx], currency: reg.currency, icann });
  }

  // Include promos if flagged
  if (flags.has("--promos")) {
    try {
      const promoData = await api("promos", true);
      const typeMap: Record<string, number> = { registration: 0, renewal: 1, transfer: 2 };
      const wantType = typeMap[type];

      for (const [regName, regData] of Object.entries(promoData.registrars as Record<string, any>)) {
        for (const p of regData.promos) {
          if (p[0] === wantType && p[1] === tld) {
            const usd = toUSD(p[2], regData.currency, rates);
            const icann = toUSD(regData.ICANNfee, regData.currency, rates);
            const label = p[3] ? `${regName} [${p[3]}]` : `${regName} [promo]`;
            entries.push({ registrar: label, price: usd + icann, raw: p[2], currency: regData.currency, icann });
          }
        }
      }
    } catch { /* promos failed, skip */ }
  }

  entries.sort((a, b) => a.price - b.price);
  const top = entries.slice(0, 15);

  console.log(`\n🏷️  Cheapest .${tld} ${type} (${entries.length} registrars)\n`);
  console.log(`${pad("Registrar", 40)} ${pad("Price (USD)", 14)} ${pad("Original", 16)}`);
  console.log("─".repeat(70));
  for (const e of top) {
    const orig = e.currency !== "USD" ? `${e.raw} ${e.currency}` : "";
    const icannNote = e.icann > 0 ? ` +${fmt(e.icann)} ICANN` : "";
    console.log(`${pad(e.registrar, 40)} ${pad(fmt(e.price), 14)} ${orig}${icannNote}`);
  }
}

async function compare(tld: string) {
  const data = await api("prices", true);
  const rates = await getRates();

  type Row = { registrar: string; reg: number; renew: number; transfer: number; currency: string };
  const rows: Row[] = [];

  for (const r of data.registrars) {
    const row = r.prices.find((p: string[]) => p[0] === tld);
    if (!row) continue;
    const icann = toUSD(r.ICANNfee, r.currency, rates);
    rows.push({
      registrar: r.name,
      reg: toUSD(row[1], r.currency, rates) + icann,
      renew: toUSD(row[2], r.currency, rates) + icann,
      transfer: toUSD(row[3], r.currency, rates) + icann,
      currency: r.currency,
    });
  }

  rows.sort((a, b) => a.reg - b.reg);
  const top = rows.slice(0, 20);

  console.log(`\n📊 .${tld} price comparison (${rows.length} registrars, top 20)\n`);
  console.log(`${pad("Registrar", 35)} ${pad("Register", 12)} ${pad("Renew", 12)} ${pad("Transfer", 12)} ${pad("Cur", 5)}`);
  console.log("─".repeat(76));
  for (const r of top) {
    console.log(`${pad(r.registrar, 35)} ${pad(fmt(r.reg), 12)} ${pad(fmt(r.renew), 12)} ${pad(fmt(r.transfer), 12)} ${pad(r.currency, 5)}`);
  }
}

async function promos(tld?: string) {
  const data = await api("promos", true);
  const rates = await getRates();
  const typeNames = ["register", "renew", "transfer"];

  console.log(`\n🎫 Active promo codes${tld ? ` for .${tld}` : ""}\n`);
  console.log(`${pad("Registrar", 30)} ${pad("TLD", 8)} ${pad("Type", 10)} ${pad("Price", 10)} ${pad("Code", 20)} ${pad("Notes", 20)}`);
  console.log("─".repeat(98));

  let count = 0;
  for (const [regName, regData] of Object.entries(data.registrars as Record<string, any>)) {
    for (const p of regData.promos) {
      if (tld && p[1] !== tld) continue;
      const usd = toUSD(p[2], regData.currency, rates);
      const notes = [p[4] > 0 ? `limit:${p[4]}` : "", p[5] ? "new users" : ""].filter(Boolean).join(", ");
      console.log(
        `${pad(regName, 30)} ${pad("." + p[1], 8)} ${pad(typeNames[p[0]], 10)} ${pad(fmt(usd), 10)} ${pad(p[3] || "(auto)", 20)} ${pad(notes, 20)}`
      );
      count++;
    }
  }
  console.log(`\n${count} promos found`);
}

async function deals() {
  // Get regular prices and promos, compute discount %
  const [prices, promoData] = await Promise.all([api("prices", true), api("promos", true)]);
  const rates = await getRates();

  // Build lookup: registrar -> tld -> [reg, renew, transfer]
  const priceLookup: Record<string, Record<string, number[]>> = {};
  for (const r of prices.registrars) {
    priceLookup[r.name] = {};
    const icann = toUSD(r.ICANNfee, r.currency, rates);
    for (const p of r.prices) {
      priceLookup[r.name][p[0]] = [
        toUSD(p[1], r.currency, rates) + icann,
        toUSD(p[2], r.currency, rates) + icann,
        toUSD(p[3], r.currency, rates) + icann,
      ];
    }
  }

  type Deal = { registrar: string; tld: string; type: string; promo: number; regular: number; discount: number; code: string };
  const dealList: Deal[] = [];
  const typeNames = ["register", "renew", "transfer"];

  for (const [regName, regData] of Object.entries(promoData.registrars as Record<string, any>)) {
    const icann = toUSD(regData.ICANNfee, regData.currency, rates);
    for (const p of regData.promos) {
      const promoUsd = toUSD(p[2], regData.currency, rates) + icann;
      const regular = priceLookup[regName]?.[p[1]]?.[p[0]];
      if (!regular || regular <= 0) continue;
      const discount = ((regular - promoUsd) / regular) * 100;
      if (discount <= 0) continue;
      dealList.push({ registrar: regName, tld: p[1], type: typeNames[p[0]], promo: promoUsd, regular, discount, code: p[3] || "(auto)" });
    }
  }

  dealList.sort((a, b) => b.discount - a.discount);
  const top = dealList.slice(0, 30);

  console.log(`\n🔥 Best domain deals (${dealList.length} active promos)\n`);
  console.log(`${pad("Registrar", 28)} ${pad("TLD", 8)} ${pad("Type", 10)} ${pad("Promo", 10)} ${pad("Regular", 10)} ${pad("Save", 8)} ${pad("Code", 18)}`);
  console.log("─".repeat(102));
  for (const d of top) {
    console.log(
      `${pad(d.registrar, 28)} ${pad("." + d.tld, 8)} ${pad(d.type, 10)} ${pad(fmt(d.promo), 10)} ${pad(fmt(d.regular), 10)} ${pad(d.discount.toFixed(0) + "%", 8)} ${pad(d.code, 18)}`
    );
  }
}

async function meta(registrar: string) {
  const data = await api("meta", true);
  const info = data.registrars[registrar];
  if (!info) {
    // Try fuzzy match
    const keys = Object.keys(data.registrars);
    const match = keys.find(k => k.includes(registrar) || registrar.includes(k));
    if (match) {
      console.log(`(matched: ${match})\n`);
      return printMeta(match, data.registrars[match], data.currencies);
    }
    console.error(`❌ Registrar "${registrar}" not found. Use 'registrars' to list all.`);
    Deno.exit(1);
  }
  printMeta(registrar, info, data.currencies);
}

function printMeta(name: string, info: any, _currencies: any) {
  console.log(`\n📋 ${name}\n`);
  if (info.trustpilot) {
    console.log(`⭐ Trustpilot: ${info.trustpilot.rating}/5 "${info.trustpilot.ratingText}" (${info.trustpilot.reviews.toLocaleString()} reviews)`);
  }
  if (info.whoisPrivacy) {
    const price = parseFloat(info.whoisPrivacy.price);
    console.log(`🔒 WHOIS Privacy: ${price === 0 ? "FREE" : `${info.whoisPrivacy.price} ${info.whoisPrivacy.currency}`}`);
  }
  if (info.similarweb) {
    console.log(`👥 Traffic: ${info.similarweb.visitors} monthly visitors (${info.similarweb.date})`);
  }
  if (info.payment) {
    console.log(`💳 Payment: ${info.payment.replace(/<[^>]*>/g, "")}`);
  }
  if (info.iana) {
    console.log(`🏛️  IANA #${info.iana.number} — ${info.iana.country}`);
    if (info.iana.gtld) {
      console.log(`📦 Domains under management: ${info.iana.gtld.domains} (${info.iana.gtld.date})`);
    }
  }
}

async function price(registrar: string, tld: string) {
  const data = await api("prices", true);
  const rates = await getRates();

  const reg = data.registrars.find((r: any) =>
    r.name === registrar || r.name.includes(registrar) || registrar.includes(r.name)
  );
  if (!reg) {
    console.error(`❌ Registrar "${registrar}" not found.`);
    Deno.exit(1);
  }

  const row = reg.prices.find((p: string[]) => p[0] === tld);
  if (!row) {
    console.error(`❌ ${reg.name} doesn't list .${tld}`);
    Deno.exit(1);
  }

  const icann = toUSD(reg.ICANNfee, reg.currency, rates);
  const regP = toUSD(row[1], reg.currency, rates) + icann;
  const renP = toUSD(row[2], reg.currency, rates) + icann;
  const trP = toUSD(row[3], reg.currency, rates) + icann;

  console.log(`\n💰 ${reg.name} — .${tld} (${reg.currency})\n`);
  console.log(`  Register: ${fmt(regP)}${reg.currency !== "USD" ? ` (${row[1]} ${reg.currency})` : ""}`);
  console.log(`  Renew:    ${fmt(renP)}${reg.currency !== "USD" ? ` (${row[2]} ${reg.currency})` : ""}`);
  console.log(`  Transfer: ${fmt(trP)}${reg.currency !== "USD" ? ` (${row[3]} ${reg.currency})` : ""}`);
  if (icann > 0) console.log(`  ICANN fee: ${fmt(icann)} (included above)`);
}

async function registrars() {
  const data = await api("registrars");
  console.log(`\n📋 ${data.length} registrars:\n`);
  // Print in columns
  const cols = 3;
  const colWidth = 35;
  for (let i = 0; i < data.length; i += cols) {
    const line = data.slice(i, i + cols).map((r: string) => pad(r, colWidth)).join("");
    console.log(line);
  }
}

async function avail(domain: string) {
  const dot = domain.indexOf(".");
  if (dot === -1) {
    console.error("❌ Provide full domain: avail example.com");
    Deno.exit(1);
  }
  const name = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);

  // RDAP first (modern, structured), fallback to WHOIS
  let available: boolean | null = null;
  let owner: string | null = null;
  let expiry: string | null = null;

  // Try RDAP via rdap.org (auto-routes to correct RDAP server)
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) {
      available = true;
    } else if (res.ok) {
      available = false;
      const data = await res.json();
      // Extract registrant/registrar
      for (const entity of data.entities ?? []) {
        if (entity.roles?.includes("registrar")) {
          const vcard = entity.vcardArray?.[1];
          const fn = vcard?.find((v: any) => v[0] === "fn");
          if (fn) owner = fn[3];
        }
      }
      // Expiry
      for (const ev of data.events ?? []) {
        if (ev.eventAction === "expiration") expiry = ev.eventDate?.slice(0, 10);
      }
    }
  } catch { /* RDAP failed, try WHOIS */ }

  // Fallback: WHOIS
  if (available === null) {
    try {
      const p = new Deno.Command("whois", { args: [domain], stdout: "piped", stderr: "piped" });
      const out = await p.output();
      const text = new TextDecoder().decode(out.stdout).toLowerCase();
      // Common "not found" patterns across registries
      const freePatterns = [
        "no match", "not found", "no entries found", "no data found",
        "status: free", "status: available", "domain not found",
        "no information available", "is available for",
      ];
      const takenPatterns = [
        "domain name:", "registrar:", "creation date:", "registry domain id:",
        "nserver:", "name server:",
      ];
      if (freePatterns.some(p => text.includes(p))) {
        available = true;
      } else if (takenPatterns.some(p => text.includes(p))) {
        available = false;
        // Try to extract registrar
        const regMatch = text.match(/registrar:\s*(.+)/);
        if (regMatch) owner = regMatch[1].trim();
        const expMatch = text.match(/(?:expir|paid-till|registry expiry)[^:]*:\s*(.+)/);
        if (expMatch) expiry = expMatch[1].trim().slice(0, 10);
      }
    } catch { /* whois not available */ }
  }

  if (available === null) {
    console.log(`\n❓ ${domain} — couldn't determine availability (RDAP + WHOIS both failed for .${tld})`);
    console.log("   Try checking manually at a registrar.");
  } else if (available) {
    console.log(`\n✅ ${domain} is AVAILABLE`);
    // Show cheapest prices if we have a key
    const key = await getKey();
    if (key) {
      console.log("");
      await cheapest(tld, new Set(["--promos"]));
    } else {
      console.log(`\n   Check pricing: domains.ts cheapest ${tld}`);
    }
  } else {
    console.log(`\n❌ ${domain} is TAKEN`);
    if (owner) console.log(`   Registrar: ${owner}`);
    if (expiry) console.log(`   Expires: ${expiry}`);
  }
}

async function status() {
  const data = await api("status");
  const d = new Date(data.updated);
  const ago = Math.round((Date.now() - d.getTime()) / 60000);
  console.log(`\n🕐 Last update: ${data.updated} (${ago} min ago)`);
}

// ── CLI ──

const args = Deno.args;
const cmd = args[0];
const flags = new Set(args.filter(a => a.startsWith("--")));
const positional = args.filter(a => !a.startsWith("--")).slice(1);

switch (cmd) {
  case "cheapest": await cheapest(positional[0]?.replace(/^\./, ""), flags); break;
  case "compare": await compare(positional[0]?.replace(/^\./, "")); break;
  case "promos": await promos(positional[0]?.replace(/^\./, "")); break;
  case "deals": await deals(); break;
  case "meta": await meta(positional[0]); break;
  case "price": await price(positional[0], positional[1]?.replace(/^\./, "")); break;
  case "avail": await avail(positional[0]); break;
  case "registrars": await registrars(); break;
  case "status": await status(); break;
  default:
    console.log(`
Domain Pricing — tldes.com API

Usage: domains.ts <command> [args] [flags]

Commands:
  avail <domain>                                    Check availability + show prices
  cheapest <tld> [--renew|--transfer] [--promos]  Top registrars by price
  compare <tld>                                     Side-by-side comparison
  promos [tld]                                      Active promo codes
  deals                                             Best deals by discount %
  meta <registrar>                                  Registrar info & ratings
  price <registrar> <tld>                           Specific price lookup
  registrars                                        List all registrars
  status                                            Last update time
`);
}
