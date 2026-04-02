---
name: domain-pricing
description: Find cheapest domain registration, renewal, or transfer across 150+ registrars via tldes.com API. Use for domain price checks, promo codes, registrar comparison.
---

# Domain Pricing — tldes.com API

Find the cheapest domain registration, renewal, or transfer across 150+ registrars. Includes promo codes, coupon deals, registrar metadata (Trustpilot, WHOIS privacy cost, payment methods). Data updated hourly.

**Use when:** "cheapest .com", "domain price check", "find promo codes for .dev", "compare registrars", "where to register X", "domain deals", "cheapest transfer".

## Quick Start

```bash
# Check if a domain is available (+ show cheapest prices if it is)
~/.pi/agent/skills/domain-pricing/domains.ts avail yoyoyo.md

# Find cheapest registration for a TLD
~/.pi/agent/skills/domain-pricing/domains.ts cheapest com

# Find cheapest with promos included
~/.pi/agent/skills/domain-pricing/domains.ts cheapest com --promos

# Compare top registrars for a TLD
~/.pi/agent/skills/domain-pricing/domains.ts compare com

# List active promo codes for a TLD
~/.pi/agent/skills/domain-pricing/domains.ts promos com

# All promos (any TLD) — find deals
~/.pi/agent/skills/domain-pricing/domains.ts deals

# Registrar metadata (Trustpilot, WHOIS privacy, etc.)
~/.pi/agent/skills/domain-pricing/domains.ts meta porkbun.com

# Check a specific registrar's price for a TLD
~/.pi/agent/skills/domain-pricing/domains.ts price porkbun.com com

# List all registrars
~/.pi/agent/skills/domain-pricing/domains.ts registrars
```

## API Key

Full data requires a paid key ($50/mo or $300/yr from api@tldes.com).

Store in pass:
```bash
pass insert api/tldes
```

Without a key: `registrars`, `demo`, and `status` endpoints work. The tool auto-detects.

## Subcommands

| Command | Key? | Description |
|---------|------|-------------|
| `avail <domain>` | No* | RDAP/WHOIS availability check → auto-shows cheapest prices if available (*key needed for pricing) |
| `cheapest <tld>` | Yes | Top 10 cheapest registrars for registration (add `--renew` or `--transfer`, `--promos` to include deals) |
| `compare <tld>` | Yes | Side-by-side reg/renew/transfer prices, sorted by registration price |
| `promos [tld]` | Yes | Active promo codes, optionally filtered by TLD |
| `deals` | Yes | Best promo deals across all TLDs, sorted by discount % |
| `meta <registrar>` | Yes | Trustpilot rating, WHOIS privacy cost, traffic, payment methods |
| `price <registrar> <tld>` | Yes | Specific registrar price for a TLD |
| `registrars` | No | List all 150+ registrars |
| `status` | No | Last data update time |

## Notes

- Prices shown as-is from registrar websites — may exclude taxes
- ICANNfee field: "0.00" = included in price, else add it
- Currency varies by registrar — tool normalizes to USD using API's exchange rates
- Complements `porkbun` skill: find cheapest → register via Porkbun if it wins
