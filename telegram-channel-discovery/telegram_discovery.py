#!/usr/bin/env python3
"""
Telegram Channel Discovery & Scraping

Uses Telethon MTProto API to:
1. Discover public channels via global search
2. Spider from seed channels
3. Extract messages for real estate parsing

Requires: pip install telethon
Credentials: pass telegram/api_id, pass telegram/api_hash
"""

import asyncio
import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from telethon import TelegramClient
    from telethon.tl.functions.channels import SearchPostsRequest
    from telethon.tl.types import Channel, InputPeerEmpty
    from telethon.errors import FloodWaitError, ChannelPrivateError
except ImportError:
    raise ImportError("Install telethon: uv pip install telethon")


# ============================================================================
# Configuration
# ============================================================================

# Session stored in fixed location (already authenticated)
SESSION_DIR = Path.home() / ".pi" / "agent" / "skills" / "telegram-channel-discovery"

# Real estate keywords by country
REAL_ESTATE_QUERIES = {
    "kg": [
        "#недвижимость", "#квартира", "#аренда",
        "сдается квартира Бишкек", "продается квартира Бишкек",
        "аренда Ош", "квартира Джалал-Абад"
    ],
    "uz": [
        "#kvartira", "#tashkent", "#arenda", "#nedvijimost",
        "квартира Ташкент", "аренда Самарканд", "продается Бухара"
    ],
    "az": [
        "#baki", "#menzil", "#kiraye", "#satilir",
        "kirayə mənzil Bakı", "satılır ev Bakı"
    ],
    "ge": [
        "#tbilisi", "#apartment", "#rent",
        "ქირავდება ბინა", "იყიდება ბინა თბილისი"
    ],
}

# Known real estate channels (discovered Feb 2026)
SEED_CHANNELS = {
    "kg": [
        "Kvartira_BishkekKg",        # 197K members - BIGGEST
        "Bishkek_kvartira_chaty",    # 23K
        "BishkekHouse24",            # 14K
        "bishkekarendakv",           # 13K
        "bishkek_Nedvijimost",       # 13K
        "bishkek1arenda",            # 6K
        "arendabishkek312kg",        # 6K
        "tabyshmak_ru",              # 5K
        "kyrgyzstan_oshtyk",         # 4K
    ],
    "uz": [
        "arentash",                  # 17K members - BIGGEST
        "rent_v_tashkente",          # 4K
        "mnogo_nedvijimosti_Tashkent", # 1.6K
        "kvartiri_doma_tashkenta",   # 1.2K
        "uylar_estate",              # 558
    ],
    "az": [
        "baku_obyavlenia",           # 2.7K
        "bakutinarieltor",           # 2.1K
        "nedvijimost_baku",          # 1.1K
        "baku_kvartiri",             # 439
        "invest_in_baku",            # 156
    ],
}

TELEGRAM_LINK_PATTERN = re.compile(
    r"(?:https?://)?(?:t\.me|telegram\.me)/(?:joinchat/)?([a-zA-Z0-9_]+)",
    re.IGNORECASE
)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class DiscoveredChannel:
    username: str
    title: str
    id: int
    participants_count: Optional[int] = None
    description: Optional[str] = None
    discovered_via: str = "search"  # search | spider | seed


@dataclass 
class TelegramMessage:
    channel_username: str
    message_id: int
    text: str
    date: datetime
    views: int = 0
    forwards: int = 0
    has_photo: bool = False
    photo_bytes: Optional[bytes] = None
    
    @property
    def url(self) -> str:
        return f"https://t.me/{self.channel_username}/{self.message_id}"
    
    @property
    def source_id(self) -> str:
        return f"tg_{self.channel_username}_{self.message_id}"


# ============================================================================
# Client Management
# ============================================================================

def get_credentials() -> tuple[int, str]:
    """Get Telegram API credentials from pass."""
    try:
        api_id = int(subprocess.getoutput("pass telegram/me/api_id").strip())
        api_hash = subprocess.getoutput("pass telegram/me/api_hash").strip()
        return api_id, api_hash
    except (ValueError, subprocess.SubprocessError) as e:
        raise RuntimeError(
            "Telegram credentials not found. Run:\n"
            "  pass insert telegram/me/api_id\n"
            "  pass insert telegram/me/api_hash\n"
            f"Error: {e}"
        )


def get_client(session_name: str = ".pi_telegram_session") -> TelegramClient:
    """Get authenticated Telegram client."""
    api_id, api_hash = get_credentials()
    session_path = SESSION_DIR / session_name
    return TelegramClient(str(session_path), api_id, api_hash)


async def ensure_connected(client: TelegramClient) -> bool:
    """Connect and verify authorization without prompting."""
    await client.connect()
    if not await client.is_user_authorized():
        raise RuntimeError(
            "Session not authorized. Run authentication first:\n"
            "  cd ~/.pi/agent/skills/telegram-channel-discovery\n"
            "  python3 -c 'from telegram_discovery import *; import asyncio; asyncio.run(authenticate())'"
        )
    return True


async def authenticate():
    """Interactive authentication - run once to create session."""
    import subprocess
    api_id, api_hash = get_credentials()
    phone = subprocess.getoutput('pass telegram/me/phone').strip()
    
    client = TelegramClient(str(SESSION_DIR / ".pi_telegram_session"), api_id, api_hash)
    await client.start(phone=phone)
    me = await client.get_me()
    print(f"✓ Authenticated as {me.first_name} (@{me.username})")
    await client.disconnect()


# ============================================================================
# Discovery Functions
# ============================================================================

async def search_channels(
    query: str,
    limit: int = 100,
    session_name: str = ".pi_telegram_session"
) -> tuple[list[DiscoveredChannel], list[TelegramMessage]]:
    """
    Search public channels globally by query or hashtag.
    
    Uses channels.searchPosts MTProto method.
    """
    client = get_client(session_name)
    channels = []
    messages = []
    
    try:
        await ensure_connected(client)
        
        # Determine if hashtag or text search
        is_hashtag = query.startswith("#")
        
        result = await client(SearchPostsRequest(
            hashtag=query[1:] if is_hashtag else "",  # Remove # prefix
            offset_rate=0,
            offset_peer=InputPeerEmpty(),
            offset_id=0,
            limit=limit
        ))
        
        # Extract unique channels
        seen_ids = set()
        for chat in result.chats:
            if chat.id in seen_ids:
                continue
            seen_ids.add(chat.id)
            
            if isinstance(chat, Channel) and hasattr(chat, 'username') and chat.username:
                channels.append(DiscoveredChannel(
                    username=chat.username,
                    title=chat.title,
                    id=chat.id,
                    participants_count=getattr(chat, 'participants_count', None),
                    discovered_via="search"
                ))
        
        # Extract messages
        for msg in result.messages:
            if hasattr(msg, 'message') and msg.message:
                # Find channel for this message
                channel_username = None
                for chat in result.chats:
                    if hasattr(chat, 'id') and chat.id == getattr(msg.peer_id, 'channel_id', None):
                        channel_username = getattr(chat, 'username', None)
                        break
                
                if channel_username:
                    messages.append(TelegramMessage(
                        channel_username=channel_username,
                        message_id=msg.id,
                        text=msg.message,
                        date=msg.date,
                        views=getattr(msg, 'views', 0) or 0,
                        forwards=getattr(msg, 'forwards', 0) or 0,
                        has_photo=msg.photo is not None
                    ))
    
    except FloodWaitError as e:
        print(f"⚠️ Rate limited, wait {e.seconds}s")
        raise
    finally:
        await client.disconnect()
    
    return channels, messages


async def spider_from_seeds(
    seed_channels: list[str],
    depth: int = 2,
    messages_per_channel: int = 200,
    session_name: str = ".pi_telegram_session"
) -> list[DiscoveredChannel]:
    """
    Spider outward from seed channels, following shared Telegram links.
    
    Rate limit: ~25 new channel joins per hour.
    """
    client = get_client(session_name)
    discovered: dict[str, DiscoveredChannel] = {}
    to_process = set(seed_channels)
    processed = set()
    
    try:
        await ensure_connected(client)
        
        for current_depth in range(depth):
            batch = list(to_process - processed)[:25]  # Rate limit
            print(f"Depth {current_depth + 1}: Processing {len(batch)} channels")
            
            for username in batch:
                processed.add(username)
                
                try:
                    entity = await client.get_entity(username)
                    
                    if not isinstance(entity, Channel):
                        continue
                    
                    discovered[username] = DiscoveredChannel(
                        username=username,
                        title=entity.title,
                        id=entity.id,
                        participants_count=getattr(entity, 'participants_count', None),
                        discovered_via="seed" if current_depth == 0 else "spider"
                    )
                    
                    # Extract links from messages
                    async for message in client.iter_messages(entity, limit=messages_per_channel):
                        if message.text:
                            for match in TELEGRAM_LINK_PATTERN.finditer(message.text):
                                link = match.group(1)
                                if link and link.lower() not in processed and link.lower() != username.lower():
                                    to_process.add(link)
                
                except ChannelPrivateError:
                    print(f"  ⚠️ {username} is private")
                except FloodWaitError as e:
                    print(f"  ⚠️ Rate limited, waiting {e.seconds}s")
                    await asyncio.sleep(e.seconds)
                except Exception as e:
                    print(f"  ❌ Error with {username}: {e}")
                
                # Small delay between channels
                await asyncio.sleep(1)
    finally:
        await client.disconnect()
    
    return list(discovered.values())


async def list_subscribed_channels(session_name: str = ".pi_telegram_session") -> list[DiscoveredChannel]:
    """List all channels the user is subscribed to."""
    client = get_client(session_name)
    channels = []
    
    try:
        await ensure_connected(client)
        
        async for dialog in client.iter_dialogs():
            if isinstance(dialog.entity, Channel):
                channels.append(DiscoveredChannel(
                    username=getattr(dialog.entity, 'username', None) or str(dialog.id),
                    title=dialog.name,
                    id=dialog.id,
                    participants_count=getattr(dialog.entity, 'participants_count', None),
                    discovered_via="subscribed"
                ))
    finally:
        await client.disconnect()
    
    return channels


# ============================================================================
# Message Extraction
# ============================================================================

async def extract_messages(
    channel: str,
    limit: int = 100,
    filter_real_estate: bool = True,
    download_photos: bool = False,
    session_name: str = ".pi_telegram_session"
) -> list[TelegramMessage]:
    """
    Extract messages from a channel.
    
    If filter_real_estate=True, only returns messages with price patterns.
    """
    client = get_client(session_name)
    messages = []
    
    # Price pattern for filtering
    price_pattern = re.compile(
        r'\d+[\s.,]?\d*\s*(?:сом|сум|sum|som|\$|USD|KGS|UZS|AZN|GEL|манат|лари)',
        re.IGNORECASE
    )
    
    try:
        await ensure_connected(client)
        
        entity = await client.get_entity(channel)
        
        async for msg in client.iter_messages(entity, limit=limit):
            if not msg.text:
                continue
            
            # Filter for real estate if requested
            if filter_real_estate and not price_pattern.search(msg.text):
                continue
            
            photo_bytes = None
            if download_photos and msg.photo:
                photo_bytes = await client.download_media(msg.photo, bytes)
            
            messages.append(TelegramMessage(
                channel_username=channel,
                message_id=msg.id,
                text=msg.text,
                date=msg.date,
                views=msg.views or 0,
                forwards=msg.forwards or 0,
                has_photo=msg.photo is not None,
                photo_bytes=photo_bytes
            ))
    
    except ChannelPrivateError:
        print(f"Channel {channel} is private")
    except Exception as e:
        print(f"Error extracting from {channel}: {e}")
    finally:
        await client.disconnect()
    
    return messages


# ============================================================================
# simple_runner Integration
# ============================================================================

def to_raw_listing(msg: TelegramMessage) -> dict:
    """Convert TelegramMessage to simple_runner raw listing format."""
    return {
        '_source_url': msg.url,
        '_source_id': msg.source_id,
        '_raw_text': msg.text,
        '_photos': [msg.photo_bytes] if msg.photo_bytes else [],
        '_platform': 'telegram',
        '_scraped_at': datetime.utcnow().isoformat(),
        '_views': msg.views,
        '_forwards': msg.forwards,
        '_channel': msg.channel_username,
        '_message_date': msg.date.isoformat(),
    }


async def fetch_listings_for_country(
    country_code: str,
    channels: Optional[list[str]] = None,
    messages_per_channel: int = 50,
    session_name: str = ".pi_telegram_session"
) -> list[dict]:
    """
    Fetch raw listings from Telegram channels for a country.
    
    Returns list of dicts ready for LLM extraction.
    """
    if channels is None:
        channels = SEED_CHANNELS.get(country_code.lower(), [])
    
    if not channels:
        print(f"No seed channels for {country_code}")
        return []
    
    raw_listings = []
    
    for channel in channels:
        messages = await extract_messages(
            channel,
            limit=messages_per_channel,
            filter_real_estate=True,
            download_photos=True,
            session_name=session_name
        )
        
        for msg in messages:
            raw_listings.append(to_raw_listing(msg))
        
        print(f"  {channel}: {len(messages)} listings")
    
    return raw_listings


# ============================================================================
# CLI
# ============================================================================

async def main():
    import sys
    
    if len(sys.argv) < 2:
        print("""
Telegram Channel Discovery

Usage:
  python telegram_discovery.py search "#недвижимость"
  python telegram_discovery.py spider kg
  python telegram_discovery.py list
  python telegram_discovery.py extract <channel> [limit]
  python telegram_discovery.py fetch <country_code>
""")
        return
    
    command = sys.argv[1]
    
    if command == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else "#недвижимость"
        print(f"Searching for: {query}")
        channels, messages = await search_channels(query, limit=50)
        print(f"\nFound {len(channels)} channels:")
        for ch in channels[:20]:
            print(f"  @{ch.username} - {ch.title} ({ch.participants_count or '?'} members)")
        print(f"\nFound {len(messages)} messages")
    
    elif command == "spider":
        country = sys.argv[2] if len(sys.argv) > 2 else "kg"
        seeds = SEED_CHANNELS.get(country, [])
        if not seeds:
            print(f"No seeds for {country}. Available: {list(SEED_CHANNELS.keys())}")
            return
        print(f"Spidering from {len(seeds)} seed channels for {country.upper()}")
        channels = await spider_from_seeds(seeds, depth=2)
        print(f"\nDiscovered {len(channels)} channels:")
        for ch in channels:
            print(f"  @{ch.username} - {ch.title} [{ch.discovered_via}]")
    
    elif command == "list":
        print("Listing subscribed channels...")
        channels = await list_subscribed_channels()
        print(f"\nSubscribed to {len(channels)} channels:")
        for ch in channels:
            print(f"  @{ch.username} - {ch.title}")
    
    elif command == "extract":
        channel = sys.argv[2] if len(sys.argv) > 2 else "test"
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        print(f"Extracting from @{channel} (limit={limit})")
        messages = await extract_messages(channel, limit=limit, filter_real_estate=True)
        print(f"\nFound {len(messages)} real estate messages:")
        for msg in messages[:10]:
            preview = msg.text[:100].replace('\n', ' ')
            print(f"  [{msg.date.date()}] {preview}...")
    
    elif command == "fetch":
        country = sys.argv[2] if len(sys.argv) > 2 else "kg"
        print(f"Fetching listings for {country.upper()}")
        listings = await fetch_listings_for_country(country)
        print(f"\nFetched {len(listings)} raw listings")
        if listings:
            print(f"Sample: {listings[0]['_source_url']}")
    
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())
