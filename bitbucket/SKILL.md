---
name: bitbucket
description: "Bitbucket Cloud: API tokens (replacing app passwords), REST API, git auth, repo/workspace management. Use for cloning, API access, CI/CD, managing Bitbucket repos."
---

# Bitbucket Cloud (2025+)

## Auth: API Tokens (replaced App Passwords)

App passwords **deprecated Sept 9, 2025**, disabled June 9, 2026. Use **API tokens with scopes** instead.

### Three token types

| Type | Created at | Scope | Username for git | API header |
|------|-----------|-------|-----------------|------------|
| **API Token** (user) | Atlassian Account → Security → API tokens | User-level, custom scopes | `{bitbucket_username}` or `x-bitbucket-api-token-auth` | `Authorization: Bearer <token>` |
| **Repository Access Token** | Repo Settings → Access tokens | Single repo only | `x-token-auth` | `Authorization: Bearer <token>` |
| **Workspace Access Token** | Workspace Settings → Access tokens | All repos in workspace | `x-token-auth` | `Authorization: Bearer <token>` |

### Creating an API Token (user-level, recommended)

1. Go to: **Atlassian Account** → **Security** → **Create and manage API tokens**
   URL: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token with scopes**
3. Name it, set expiry
4. Select **Bitbucket** as app
5. Select scopes (see below)
6. Copy token — **shown only once**

### Scopes reference

| Category | Scope | API scope string | What it does |
|----------|-------|-----------------|-------------|
| **Repositories** | Read | `read:repository:bitbucket` | View repos, source code, file browser |
| | Write | `write:repository:bitbucket` | Modify repos, push code |
| | Admin | `admin:repository:bitbucket` | Create repos, manage settings |
| | Delete | `delete:repository:bitbucket` | Delete repos |
| **Pull Requests** | Read | `read:pullrequest:bitbucket` | View PRs, comment |
| | Write | `write:pullrequest:bitbucket` | Create, approve, merge PRs |
| **Workspaces** | Read | `read:workspace:bitbucket` | View workspace data |
| | Admin | `admin:workspace:bitbucket` | Manage workspace |
| **Projects** | Read | `read:project:bitbucket` | View projects |
| | Admin | `admin:project:bitbucket` | Create/delete projects |
| **Pipelines** | Read | `read:pipeline:bitbucket` | View pipeline info |
| | Write | `write:pipeline:bitbucket` | Start/stop pipelines |
| | Admin | `admin:pipeline:bitbucket` | Manage pipeline variables |
| **Webhooks** | Read/Write/Delete | `read/write/delete:webhook:bitbucket` | Manage webhooks |
| **SSH Keys** | Read/Write/Delete | `read/write/delete:ssh-key:bitbucket` | Manage SSH/deploy keys |
| **User** | Read | `read:user:bitbucket` | View current user data |

**Note:** Scopes don't cascade. `write:repository` does NOT include `read:repository`. Request both.

## Git operations

### Clone with API token (user-level)
```bash
# Interactive prompt (token as password)
git clone https://{bitbucket_username}@bitbucket.org/{workspace}/{repo}.git

# Or with static username
git clone https://x-bitbucket-api-token-auth@bitbucket.org/{workspace}/{repo}.git

# Token in URL (CI/CD only, don't store in plain text)
git clone https://x-bitbucket-api-token-auth:{api_token}@bitbucket.org/{workspace}/{repo}.git
```

### Clone with Repository/Workspace Access Token
```bash
# Interactive
git clone https://x-token-auth@bitbucket.org/{workspace}/{repo}.git

# Token in URL
git clone https://x-token-auth:{access_token}@bitbucket.org/{workspace}/{repo}.git
```

### Update existing remote
```bash
git remote set-url origin https://x-bitbucket-api-token-auth@bitbucket.org/{workspace}/{repo}.git
```

### Git credential helper (avoid re-entering)
```bash
# Cache for 1 hour
git config --global credential.helper 'cache --timeout=3600'

# Or use macOS Keychain
git config --global credential.helper osxkeychain
```

## REST API

### Authentication

**For API calls**: use Basic auth with **email** + token:
```bash
curl -u "{email}:{api_token}" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}"
```

**For git commands**: use Basic auth with **username** + token:
```bash
git clone https://{bitbucket_username}:{api_token}@bitbucket.org/{workspace}/{repo}.git
```

**Repo/Workspace access tokens** (ATATT3xF prefix) use Bearer:
```bash
curl -H "Authorization: Bearer <access_token>" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}"
```

> **Key distinction**: Scoped API tokens use email for API, username for git. Bearer auth does NOT work with scoped API tokens — use Basic auth.

### Common endpoints
```bash
BASE="https://api.bitbucket.org/2.0"
AUTH="-H 'Authorization: Bearer TOKEN'"

# List repos in workspace
curl $AUTH "$BASE/repositories/{workspace}?pagelen=50"

# Get repo info
curl $AUTH "$BASE/repositories/{workspace}/{repo}"

# List branches
curl $AUTH "$BASE/repositories/{workspace}/{repo}/refs/branches"

# List commits
curl $AUTH "$BASE/repositories/{workspace}/{repo}/commits"

# Get file content
curl $AUTH "$BASE/repositories/{workspace}/{repo}/src/{branch}/{filepath}"

# List PRs
curl $AUTH "$BASE/repositories/{workspace}/{repo}/pullrequests?state=OPEN"

# List workspace members
curl $AUTH "$BASE/workspaces/{workspace}/members"

# List pipelines
curl $AUTH "$BASE/repositories/{workspace}/{repo}/pipelines/?pagelen=10&sort=-created_on"

# Download repo as zip
curl -L $AUTH "$BASE/repositories/{workspace}/{repo}/downloads" -o repo.zip
```

### Pagination
```bash
# Response includes: size, page, pagelen, next, previous
# Default pagelen=10, max=100
curl $AUTH "$BASE/repositories/{workspace}?pagelen=100&page=2"

# Auto-paginate all results
next_url="$BASE/repositories/{workspace}?pagelen=100"
while [ -n "$next_url" ]; do
  response=$(curl -s $AUTH "$next_url")
  echo "$response" | jq '.values[]'
  next_url=$(echo "$response" | jq -r '.next // empty')
done
```

## Token prefix identification

| Prefix | Type |
|--------|------|
| `ATATT3xF` | Repository/Workspace Access Token (old format) |
| `ATCTT3xF` | OAuth 2.0 access token |
| No prefix | User API token (new format, 2025+) |

## Store tokens in pass

```bash
# Store
pass insert bitbucket/{project}/api-token
pass insert bitbucket/{project}/username

# Use in scripts
BB_TOKEN=$(pass show bitbucket/{project}/api-token)
BB_USER=$(pass show bitbucket/{project}/username)
git clone "https://${BB_USER}:${BB_TOKEN}@bitbucket.org/{workspace}/{repo}.git"
```

## CI/CD (Bitbucket Pipelines)

```yaml
# bitbucket-pipelines.yml
image: python:3.11

pipelines:
  default:
    - step:
        name: Deploy
        script:
          - pip install -r requirements.txt
          - python manage.py test
        # Access token auto-available as BITBUCKET_TOKEN in pipelines
```

## Migration checklist (app passwords → API tokens)

1. Create API token at https://id.atlassian.com/manage-profile/security/api-tokens
2. Select **Bitbucket** app, choose needed scopes
3. Replace app password in all scripts/CI configs
4. Update git remotes: username stays same, password = new API token
5. For repo-level tokens: create at Repo Settings → Access tokens
6. Test: `curl -u "username:api_token" https://api.bitbucket.org/2.0/user`
7. Delete old app password before June 9, 2026 deadline
