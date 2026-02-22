---
name: railway
description: "Railway CLI deployment and management: deploy, logs, databases, domains, environment config, templates. Use for railway up, deploy, debug, manage Railway services."
---

<!-- Updated: 2026-02-20 -->

# Railway — CLI Deployment & Management

## Prerequisites

```bash
brew install railway    # or: npm install -g @railway/cli
railway login
railway whoami --json
```

---

## Gotchas

- **No `-m` flag on `railway up`** — current CLI has no `--message`.
- **No `--lines`/`--tail` on `railway logs`** — it streams forever. Wrap with `timeout 10 railway logs 2>&1` or pipe to `tail`.
- **`railway init`/`railway link` ALWAYS need TTY** — there are NO `--name`, `--workspace`, `--project` flags that bypass interactive prompts. The supposed non-interactive flags don't exist. **Use the GraphQL API instead** (see recipe below).
- **Nginx port: hardcode `8080` is fine** — Railway auto-detects from `EXPOSE`. The `${PORT}` envsubst template trick is only needed if you skip EXPOSE. Hardcoding `listen 8080` + `EXPOSE 8080` works.
- **`railway up` uploads from CWD** — run it from the directory with `Dockerfile`/source. It won't find a linked project if you `cd` elsewhere.
- **Service auto-created by first `railway up`** — no need to create services separately. But you must add the service ID to the config before `railway logs` works.
- **Config is a JSON file** — `~/.railway/config.json` has `projects` dict keyed by **absolute filesystem path**. You can manually add/edit entries to link projects without TTY.

---

## Recipe: Full Non-Interactive Deploy (No TTY)

**`railway init`/`railway link` don't have non-interactive flags.** Use the GraphQL API + config file:

```bash
# 0. Get token from config
RAILWAY_TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.railway/config.json'))['user']['token'])")

# 1. Find your workspace ID
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { workspaces { id name } } }"}' | python3 -m json.tool

# 2. Create project via API (replace WORKSPACE_ID)
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { projectCreate(input: { name: \"my-app\", teamId: \"WORKSPACE_ID\" }) { id name } }"}' \
  | python3 -m json.tool
# → returns { "data": { "projectCreate": { "id": "PROJECT_ID", "name": "my-app" } } }

# 3. Get environment ID
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ project(id: \"PROJECT_ID\") { environments { edges { node { id name } } } } }"}' \
  | python3 -m json.tool

# 4. Link by editing ~/.railway/config.json directly
python3 -c "
import json
cfg = json.load(open('$HOME/.railway/config.json'))
cfg['projects']['/absolute/path/to/project'] = {
    'projectPath': '/absolute/path/to/project',
    'name': 'my-app',
    'project': 'PROJECT_ID',
    'environment': 'ENV_ID',
    'environmentName': 'production'
}
json.dump(cfg, open('$HOME/.railway/config.json','w'), indent=2)
"

# 5. Deploy (creates service automatically)
cd /absolute/path/to/project
railway up --detach
# → prints build logs URL containing SERVICE_ID (ccd1019a-...)

# 6. Add service ID to config (needed for railway logs/domain)
python3 -c "
import json
cfg = json.load(open('$HOME/.railway/config.json'))
cfg['projects']['/absolute/path/to/project']['service'] = 'SERVICE_ID'
json.dump(cfg, open('$HOME/.railway/config.json','w'), indent=2)
"

# 7. Generate domain + verify
railway domain        # → 🚀 https://my-app-production.up.railway.app
timeout 10 railway logs 2>&1 | tail -20
```

---

## Recipe: Static Site with Nginx

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
EXPOSE 8080
```

**nginx.conf** (hardcode 8080, Railway auto-detects from EXPOSE):
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|json)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/json application/javascript image/svg+xml;
    gzip_min_length 256;
}
```

**Alternative: `${PORT}` template** (only if you can't hardcode port):
Copy to `/etc/nginx/templates/default.conf.template` instead of `/etc/nginx/conf.d/`. The nginx alpine image auto-substitutes `${PORT}` via `envsubst` at startup.

---

## Deploy

```bash
railway up --detach                              # fire and forget
railway up --ci                                  # stream build logs, block until done
railway up --detach --service backend             # specific service
railway up --detach -e production                 # specific environment
```

| Flag | Description |
|------|-------------|
| `-d, --detach` | Don't attach to logs |
| `-c, --ci` | Stream build logs until done |
| `-s, --service` | Target service |
| `-e, --environment` | Target environment |

---

## Logs

```bash
timeout 10 railway logs 2>&1           # runtime logs (streams forever — MUST use timeout)
timeout 10 railway logs --build 2>&1   # build logs
railway logs DEPLOY_ID                 # specific deployment
railway logs --json                    # JSON output
```

**No `--lines`, `--tail`, `--filter`, `--since` flags.** Always wrap with `timeout` and pipe to `tail`/`grep`:
```bash
timeout 10 railway logs --build 2>&1 | tail -30
timeout 10 railway logs 2>&1 | grep -i error
```

---

## Status & Config

```bash
railway status --json                    # project, services, deployments
railway variables --json                 # rendered env vars
railway variables set KEY="value"        # set var
railway variables delete OLD_VAR         # remove var
railway environment production           # switch env
railway environment new staging          # create env
```

---

## Domains

```bash
railway domain --json                    # generate *.up.railway.app
railway domain --json --service backend  # for specific service
railway domain example.com --json        # custom domain (shows DNS records)
```

---

## Databases

```bash
railway add --template postgres
railway add --template redis
railway add --template mysql
railway add --template mongodb
```

---

## Project Management

```bash
railway list                             # all projects
railway init                             # create (INTERACTIVE ONLY — no flags)
railway link                             # link (INTERACTIVE ONLY — no flags)
railway down                             # stop deployment
railway unlink                           # disconnect from project
railway domain                           # generate *.up.railway.app domain
```

For non-TTY project creation/linking, use the GraphQL API recipe above.

---

## Quick Debug

| Symptom | Fix |
|---------|-----|
| 502 Bad Gateway | Check port — nginx/app must listen on `EXPOSE`d port or `$PORT` |
| Deploy failed | `timeout 10 railway logs --build 2>&1 \| tail -50` |
| Service down | `railway status --json` |
| Missing vars | `railway variables --json` |
| "No linked project" | Edit `~/.railway/config.json` — add project entry keyed by CWD path |
| "No service found" | Add `service` field to config entry (get ID from `railway up` output URL) |
| "Failed to prompt" (non-TTY) | Use GraphQL API recipe above — `init`/`link` have no non-interactive flags |
| Logs hang forever | Always wrap: `timeout 10 railway logs 2>&1` |
