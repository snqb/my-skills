---
name: railway
description: "Railway CLI deployment and management: deploy, logs, databases, domains, environment config, templates. Use for railway up, deploy, debug, manage Railway services."
---

# Railway — CLI Deployment & Management

Complete guide for deploying and managing applications on Railway.

## Prerequisites

```bash
# Install CLI
npm install -g @railway/cli
# or
brew install railway

# Authenticate
railway login

# Check auth
railway whoami --json

# Link project
railway link
```

---

## Part 1: Deploy

### Deploy Code

```bash
# Deploy with commit message (always use -m)
railway up --detach -m "Add user authentication"

# Watch build logs (for debugging)
railway up --ci -m "Fix memory leak"

# Deploy specific service
railway up --detach --service backend -m "Update API"

# Deploy to unlinked project
railway up --project PROJECT_ID --environment production --detach -m "Deploy"
```

| Flag | Description |
|------|-------------|
| `-m, --message` | Commit message (always use) |
| `-d, --detach` | Don't attach to logs (default) |
| `-c, --ci` | Stream build logs until done |
| `-s, --service` | Target service |
| `-e, --environment` | Target environment |

---

## Part 2: Deployments & Logs

### List Deployments

```bash
railway deployment list --limit 10 --json
railway deployment list --service backend --limit 10 --json
```

### View Logs

```bash
# Deploy logs (last 100 lines)
railway logs --lines 100 --json

# Build logs
railway logs --build --lines 100 --json

# Latest deployment (including failed)
railway logs --latest --lines 100 --json

# Filter errors
railway logs --lines 50 --filter "@level:error" --json

# Text search
railway logs --lines 50 --filter "connection refused" --json

# Time-based
railway logs --since 1h --lines 100 --json
railway logs --since 30m --until 10m --lines 100 --json
```

### Logs from Specific Deployment

```bash
# Get deployment ID first
railway deployment list --json

# Then fetch logs
railway logs DEPLOYMENT_ID --lines 100 --json
railway logs --build DEPLOYMENT_ID --lines 100 --json
```

---

## Part 3: Status & Config

### Check Status

```bash
railway status --json
```

Returns: project, environment, services, active deployments, domains.

### Environment Config

```bash
# Full config (source, build, deploy, variables)
railway environment config --json

# Rendered variable values
railway variables --json
```

### Switch Environment

```bash
railway environment staging
railway environment production
```

### Create Environment

```bash
# New empty environment
railway environment new staging

# Duplicate existing
railway environment new staging --duplicate production
```

---

## Part 4: Variables

### View Variables

```bash
railway variables --json
```

### Set Variables

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set API_KEY="secret" DEBUG="false"
```

### Delete Variables

```bash
railway variables delete OLD_VAR
```

---

## Part 5: Domains

### Generate Railway Domain

```bash
railway domain --json
railway domain --json --service backend
```

### Add Custom Domain

```bash
railway domain example.com --json
```

Returns DNS records to add to your provider.

---

## Part 6: Databases

### Add Database

Use templates:

| Database | Command |
|----------|---------|
| PostgreSQL | `railway add --template postgres` |
| Redis | `railway add --template redis` |
| MySQL | `railway add --template mysql` |
| MongoDB | `railway add --template mongodb` |

### Check Existing Databases

```bash
railway status --json
```

Look for services with `postgres`, `redis`, `mysql`, `mongo` in name/image.

---

## Part 7: Services

### Create Service

```bash
# With local code
railway up --detach -m "Initial deploy"

# Empty service (then configure)
# Use GraphQL API - see templates section
```

### Service from Template

```bash
railway add --template ghost
railway add --template strapi
railway add --template n8n
railway add --template minio
railway add --template uptime-kuma
```

### Link Different Service

```bash
railway service
# Interactive selection

railway link
# Relink project/service
```

---

## Part 8: Metrics

Query via GraphQL API:

| Metric | Description |
|--------|-------------|
| `CPU_USAGE` | CPU cores used |
| `MEMORY_USAGE_GB` | Memory in GB |
| `NETWORK_RX_GB` | Network received |
| `NETWORK_TX_GB` | Network transmitted |
| `DISK_USAGE_GB` | Disk usage |

---

## Part 9: Project Management

### List Projects

```bash
railway list
```

### Link Project

```bash
railway link
# Interactive selection

railway link --project PROJECT_ID
```

### Unlink

```bash
railway unlink
```

### Stop Deployment

```bash
railway down
```

**Note:** This stops the deployment but keeps the service. To delete a service entirely, use the dashboard or API.

---

## Quick Reference

### Common Workflows

**Deploy changes:**
```bash
railway up --detach -m "Description of changes"
```

**Debug failed deploy:**
```bash
railway logs --build --latest --lines 200 --json
```

**Check what's running:**
```bash
railway status --json
```

**Add database and connect:**
```bash
railway add --template postgres
railway variables --json  # Get DATABASE_URL
```

**Add custom domain:**
```bash
railway domain mydomain.com --json
# Add DNS records shown in output
```

### CLI Cheatsheet

```bash
# Auth
railway login
railway whoami

# Project
railway link
railway status --json
railway list

# Deploy
railway up -d -m "message"
railway down

# Logs
railway logs --lines 100
railway logs --build --lines 100
railway logs --filter "@level:error"

# Config
railway environment config --json
railway variables --json
railway variables set KEY="value"

# Domains
railway domain --json
railway domain custom.com --json

# Databases
railway add --template postgres
railway add --template redis
```

### Troubleshooting

| Issue | Check |
|-------|-------|
| Deploy failed | `railway logs --build --latest --lines 200` |
| Service down | `railway status --json` |
| Missing vars | `railway variables --json` |
| Wrong env | `railway environment production` |
| Not linked | `railway link` |

---

## Resources

- **Docs:** https://docs.railway.app/
- **CLI Reference:** https://docs.railway.app/reference/cli-api
- **Templates:** https://railway.app/templates
