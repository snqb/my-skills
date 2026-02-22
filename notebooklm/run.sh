#!/usr/bin/env bash
# Wrapper for notebooklm-py CLI. Auto-manages venv + deps.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SKILL_DIR/.venv"
MARKER="$VENV_DIR/.installed"

# --- ensure venv + deps ---
ensure_env() {
    if [[ ! -d "$VENV_DIR" ]]; then
        echo "⏳ Creating venv..."
        python3 -m venv "$VENV_DIR"
    fi
    source "$VENV_DIR/bin/activate"

    if [[ ! -f "$MARKER" ]]; then
        echo "⏳ Installing notebooklm-py[browser]..."
        pip install -q "notebooklm-py[browser]"
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
        echo "Example: bash run.sh account add work"
        exit 1
    fi
    
    mkdir -p "$ACCOUNTS_DIR"
    local target="$ACCOUNTS_DIR/$name.json"
    
    # If there's a current non-symlinked storage_state, back it up first
    if [[ -f "$NB_DIR/storage_state.json" && ! -L "$NB_DIR/storage_state.json" ]]; then
        local backup="$ACCOUNTS_DIR/_backup_$(date +%s).json"
        cp "$NB_DIR/storage_state.json" "$backup"
        echo "Backed up current auth → $backup"
    fi
    
    # Remove current state so login starts fresh
    rm -f "$NB_DIR/storage_state.json"
    rm -rf "$NB_DIR/browser_profile"
    
    echo "Login with the Google account you want to name '$name':"
    ensure_env
    notebooklm login
    
    if [[ -f "$NB_DIR/storage_state.json" ]]; then
        cp "$NB_DIR/storage_state.json" "$target"
        # Make active state a symlink
        rm -f "$NB_DIR/storage_state.json"
        ln -s "$target" "$NB_DIR/storage_state.json"
        echo "✅ Account '$name' saved and activated"
    else
        echo "❌ Login failed — no storage_state.json created"
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
    echo "✅ Switched to account '$name'"
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
    
    # Check if active
    if [[ -L "$NB_DIR/storage_state.json" && "$(readlink "$NB_DIR/storage_state.json")" == "$target" ]]; then
        rm -f "$NB_DIR/storage_state.json"
        echo "Deactivated '$name'"
    fi
    
    rm -f "$target"
    echo "✅ Removed account '$name'"
}

# --- auth migration from old notebooklm skill ---
migrate_auth() {
    local old_state="$HOME/.pi/agent/skills/notebooklm-old/data/browser_state/state.json"
    local new_dir="$HOME/.notebooklm"
    local new_state="$new_dir/storage_state.json"

    if [[ ! -f "$old_state" ]]; then
        echo "❌ Old skill state not found: $old_state"
        exit 1
    fi

    mkdir -p "$new_dir"

    if [[ -f "$new_state" ]]; then
        echo "⚠️  $new_state already exists. Overwrite? [y/N]"
        read -r ans
        [[ "$ans" =~ ^[yY] ]] || { echo "Skipped."; exit 0; }
    fi

    cp "$old_state" "$new_state"
    echo "✅ Migrated cookies: $old_state → $new_state"
    echo "   Run 'bash run.sh status' to verify."
}

# --- upgrade notebooklm-py ---
upgrade() {
    ensure_env
    echo "⏳ Upgrading notebooklm-py..."
    pip install -q --upgrade "notebooklm-py[browser]"
    echo "✅ Upgraded to $(pip show notebooklm-py 2>/dev/null | grep Version)"
}

# --- main ---
if [[ $# -eq 0 ]]; then
    echo "Usage: bash run.sh <command> [args...]"
    echo ""
    echo "Built-in commands:"
    echo "  account list          Show all accounts"
    echo "  account add <name>    Login + save as named account"
    echo "  account use <name>    Switch to account"
    echo "  account rm <name>     Remove account"
    echo "  migrate-auth          Copy cookies from old notebooklm skill"
    echo "  upgrade               Update notebooklm-py to latest version"
    echo ""
    echo "All other commands pass through to 'notebooklm' CLI:"
    echo "  status, login, list, create, use, ask, source, generate, download, ..."
    echo ""
    echo "Examples:"
    echo "  bash run.sh account add personal"
    echo "  bash run.sh account add work"
    echo "  bash run.sh account use work"
    echo "  bash run.sh ask \"What are the key themes?\""
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
    migrate-auth)
        ensure_env
        migrate_auth
        ;;
    upgrade)
        upgrade
        ;;
    *)
        ensure_env
        exec notebooklm "$@"
        ;;
esac
