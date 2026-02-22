#!/usr/bin/env bash
set -e
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$SKILL_DIR/.venv"

if [ ! -d "$VENV" ]; then
    echo "Creating venv..."
    # bip_utils/coincurve needs Python ≤3.13 (3.14 breaks build)
    PY=$(command -v python3.13 || command -v python3)
    echo "Using: $PY ($($PY --version 2>&1))"
    "$PY" -m venv "$VENV"
fi

echo "Installing dependencies..."
"$VENV/bin/pip" install -q telethon mnemonic bip_utils aiohttp
echo "✅ Ready. Run: python3 scanner.py --help"
