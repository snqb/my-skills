---
name: telegram-channel-discovery
description: Discover and scrape Telegram public channels for real estate listings. Uses Telethon MTProto API. Pre-configured with 50+ real estate channels for KG, UZ, AZ markets.
---

# Telegram Channel Discovery Skill

Discover public Telegram channels and extract real estate listings using Telegram's MTProto API via Telethon.

## Quick Start

```bash
cd ~/.pi/agent/skills/telegram-channel-discovery

# Fetch real estate listings from KG channels
python3 telegram_discovery.py fetch kg

# Fetch from UZ
python3 telegram_discovery.py fetch uz

# Fetch from AZ  
python3 telegram_discovery.py fetch az
```

## Pre-Configured Channels (Feb 2026)

| Country | Channels | Top by Members |
|---------|----------|----------------|
| **KG** 🇰🇬 | 9 | @Kvartira_BishkekKg (197K), @Bishkek_kvartira_chaty (23K) |
| **UZ** 🇺🇿 | 5 | @arentash (17K), @rent_v_tashkente (4K) |
| **AZ** 🇦🇿 | 5 | @baku_obyavlenia (2.7K), @bakutinarieltor (2.1K) |

## CLI Commands

```bash
# List your subscribed channels
python3 telegram_discovery.py list

# Search for new channels globally
python3 telegram_discovery.py search "недвижимость бишкек"
python3 telegram_discovery.py search "#аренда"

# Spider from seed channels (follow links)
python3 telegram_discovery.py spider kg

# Extract listings from a specific channel
python3 telegram_discovery.py extract Kvartira_BishkekKg 50

# Fetch listings for a country (ready for LLM extraction)
python3 telegram_discovery.py fetch kg
```

## Output Format

The `fetch` command returns data ready for simple_runner's LLM extraction:

```python
{
    '_source_url': 'https://t.me/channel/12345',
    '_source_id': 'tg_channel_12345',
    '_raw_text': 'Сдается 2-комн квартира...',
    '_photos': [<bytes>],  # Photo data if download_photos=True
    '_platform': 'telegram',
    '_scraped_at': '2026-02-09T06:00:00',
    '_views': 1234,
    '_forwards': 56,
    '_channel': 'Kvartira_BishkekKg',
    '_message_date': '2026-02-09T05:30:00'
}
```

## Programmatic Usage

```python
import asyncio
from telegram_discovery import (
    fetch_listings_for_country,
    search_channels,
    extract_messages,
    SEED_CHANNELS
)

# Fetch ready-for-LLM listings
listings = asyncio.run(fetch_listings_for_country("kg"))
print(f"Got {len(listings)} listings")

# Search for new channels
channels, messages = asyncio.run(search_channels("недвижимость ташкент"))
for ch in channels:
    print(f"@{ch.username} - {ch.title} ({ch.participants_count} members)")

# Extract from specific channel
msgs = asyncio.run(extract_messages("arentash", limit=100))
for msg in msgs:
    print(f"{msg.date}: {msg.text[:100]}...")
```

## Authentication

Session is pre-authenticated and stored at:
```
~/.pi/agent/skills/telegram-channel-discovery/.pi_telegram_session.session
```

If you need to re-authenticate:
```bash
cd ~/.pi/agent/skills/telegram-channel-discovery
python3 -c "
import asyncio
from telegram_discovery import authenticate
asyncio.run(authenticate())
"
```

Credentials stored in pass:
- `pass telegram/me/api_id`
- `pass telegram/me/api_hash`
- `pass telegram/me/phone`

## Rate Limits

| Action | Limit | Notes |
|--------|-------|-------|
| Global search | ~100/day | Cache results |
| Channel joins | ~25/hour | For spidering |
| Message fetch | ~500/channel | Pagination supported |

## Adding New Channels

Edit `SEED_CHANNELS` in `telegram_discovery.py`:

```python
SEED_CHANNELS = {
    "kg": [
        "Kvartira_BishkekKg",        # 197K members
        "new_channel_username",       # Add here
    ],
    # ...
}
```

Or discover new channels:
```bash
python3 telegram_discovery.py search "аренда ош"
```

## Integration with simple_runner

```python
# In countries/kg/telegram.py
from skills.telegram_discovery import fetch_listings_for_country

async def get_telegram_listings():
    return await fetch_listings_for_country("kg", messages_per_channel=100)
```

## Listing Quality

Sample KG listing format:
```
🚨 СРОЧНО!
🏠 Сдаётся комната с подселением для порядочных парней
📍 Район: Технопарк
✅ Благоустроенная квартира
📲 Тел.: 0990 09 07 59
```

Sample UZ listing format:
```
Местонахождение: улица Ходжентская (Яккасарайский район)
Количество комнат: 2в3
Общая площадь: 55 кв.м
Этаж: 1/5
Цена: 9 600 000сум (800)
Номер: +998 95-242-06-66
```
