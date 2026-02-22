---
name: pass
description: Password store (pass) integration for secure credential management. Use when dealing with API keys, tokens, or any secrets.
---

# Pass (Password Store)

Secure credential management using `pass` CLI.

## Usage

```bash
pass list                    # List all stored passwords
pass show service/key        # Get specific credential
pass insert service/key      # Store new credential
pass generate service/key 32 # Generate 32-char password
pass rm service/key          # Remove credential
```

## In Scripts

### Bash
```bash
API_KEY=$(pass show api/openai)
export GITHUB_TOKEN=$(pass show github/token)
```

### Python
```python
import subprocess

def get_secret(path):
    """Get secret from pass"""
    result = subprocess.run(
        ["pass", "show", path],
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip()

# Usage
api_key = get_secret("api/openai")
```

### Node.js
```javascript
const { execSync } = require('child_process');

function getSecret(path) {
    return execSync(`pass show ${path}`, { encoding: 'utf8' }).trim();
}

// Usage
const apiKey = getSecret('api/openai');
```

## Best Practices

1. **Never hardcode secrets** - Always use `pass show`
2. **Use hierarchical structure** - `service/environment/key`
3. **Generate passwords** - `pass generate` for secure random passwords
4. **Git integration** - Pass uses git by default for version control

## Common Patterns

```bash
# API keys
pass show api/openai
pass show api/anthropic

# Database credentials
pass show db/production/password
pass show db/staging/password

# Tokens
pass show github/token
pass show npm/token
```

## Security Notes

- Pass uses GPG encryption
- Each password is individually encrypted
- Git tracks changes but content stays encrypted
- Only accessible with your GPG key