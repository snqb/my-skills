#!/usr/bin/env bash
# Wrapper for notebooklm-py CLI. Auto-manages uv venv + deps.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SKILL_DIR/.venv"
MARKER="$VENV_DIR/.installed"

# --- ensure venv + deps ---
ensure_env() {
    if [[ ! -d "$VENV_DIR" ]]; then
        echo "⏳ Creating venv..."
        uv venv "$VENV_DIR"
    fi
    source "$VENV_DIR/bin/activate"

    if [[ ! -f "$MARKER" ]]; then
        echo "⏳ Installing notebooklm-py[browser]..."
        uv pip install "notebooklm-py[browser]"
        playwright install chromium 2>/dev/null || true
        touch "$MARKER"
        echo "✅ Ready"
    fi
}

# --- multi-account management ---
NB_DIR="$HOME/.notebooklm"
ACCOUNTS_DIR="$NB_DIR/accounts"

account_list() {
    mkdir -p "$ACCOUNTS_DIR"
    local current=""
    if [[ -L "$NB_DIR/storage_state.json" ]]; then
        current="$(readlink "$NB_DIR/storage_state.json")"
    fi

    echo "Accounts:"
    local found=0
    for f in "$ACCOUNTS_DIR"/*.json; do
        [[ -f "$f" ]] || continue
        found=1
        local name="$(basename "$f" .json)"
        if [[ "$f" == "$current" ]]; then
            echo "  ● $name  (active)"
        else
            echo "    $name"
        fi
    done
    if [[ $found -eq 0 ]]; then
        echo "  (none)"
        echo ""
        echo "Add one:  bash run.sh account add <name>"
    fi
}

account_add() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
        echo "Usage: bash run.sh account add <name>"
        exit 1
    fi

    mkdir -p "$ACCOUNTS_DIR"
    local target="$ACCOUNTS_DIR/$name.json"

    # Back up existing non-symlinked state
    if [[ -f "$NB_DIR/storage_state.json" && ! -L "$NB_DIR/storage_state.json" ]]; then
        cp "$NB_DIR/storage_state.json" "$ACCOUNTS_DIR/_backup_$(date +%s).json"
    fi

    rm -f "$NB_DIR/storage_state.json"
    rm -rf "$NB_DIR/browser_profile"

    echo "Login with the Google account for '$name':"
    ensure_env
    notebooklm login

    if [[ -f "$NB_DIR/storage_state.json" ]]; then
        cp "$NB_DIR/storage_state.json" "$target"
        rm -f "$NB_DIR/storage_state.json"
        ln -s "$target" "$NB_DIR/storage_state.json"
        echo "✅ Account '$name' saved and activated"
    else
        echo "❌ Login failed"
        exit 1
    fi
}

account_use() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
        echo "Usage: bash run.sh account use <name>"
        account_list
        exit 1
    fi

    local target="$ACCOUNTS_DIR/$name.json"
    if [[ ! -f "$target" ]]; then
        echo "❌ Account '$name' not found"
        account_list
        exit 1
    fi

    rm -f "$NB_DIR/storage_state.json"
    ln -s "$target" "$NB_DIR/storage_state.json"
    echo "✅ Switched to '$name'"
}

account_rm() {
    local name="${1:-}"
    if [[ -z "$name" ]]; then
        echo "Usage: bash run.sh account rm <name>"
        exit 1
    fi

    local target="$ACCOUNTS_DIR/$name.json"
    if [[ ! -f "$target" ]]; then
        echo "❌ Account '$name' not found"
        exit 1
    fi

    if [[ -L "$NB_DIR/storage_state.json" && "$(readlink "$NB_DIR/storage_state.json")" == "$target" ]]; then
        rm -f "$NB_DIR/storage_state.json"
    fi

    rm -f "$target"
    echo "✅ Removed '$name'"
}

# --- upgrade ---
upgrade() {
    ensure_env
    echo "⏳ Upgrading notebooklm-py..."
    uv pip install --upgrade "notebooklm-py[browser]"
    echo "✅ $(uv pip show notebooklm-py 2>/dev/null | grep Version)"
}

# --- main ---
if [[ $# -eq 0 ]]; then
    cat <<'USAGE'
Usage: bash run.sh <command> [args...]

Built-in:
  account list|add|use|rm   Manage multiple Google accounts
  upgrade                   Update notebooklm-py to latest

Pass-through to notebooklm CLI:
  status, login, list, create, use, ask, source, generate, download, share, ...

Examples:
  bash run.sh account add personal
  bash run.sh create "My Research"
  bash run.sh ask "What are the key themes?"
USAGE
    exit 0
fi

cmd="$1"

case "$cmd" in
    account)
        subcmd="${2:-list}"
        case "$subcmd" in
            list) account_list ;;
            add)  account_add "${3:-}" ;;
            use)  account_use "${3:-}" ;;
            rm)   account_rm "${3:-}" ;;
            *)    echo "Unknown: account $subcmd"; exit 1 ;;
        esac
        ;;
    upgrade)
        upgrade
        ;;
    *)
        ensure_env
        exec notebooklm "$@"
        ;;
esac
