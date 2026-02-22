---
name: coolify
description: "Complete Coolify deployment and management: CLI operations, API access, Docker patterns, networking, Prometheus/Grafana, WordPress troubleshooting, SSL. Use for deploy, debug, manage Coolify services."
---

# Coolify — Deployment & Management

Complete guide for deploying and managing applications on Coolify.

## Part 1: CLI Setup & Operations

### Installation

```bash
# Install Coolify CLI
curl -fsSL https://get.coolify.io/cli | bash

# Or manual install to ~/.local/bin
mkdir -p ~/.local/bin
curl -L https://github.com/coollabsio/coolify-cli/releases/latest/download/coolify-linux-amd64 -o ~/.local/bin/coolify
chmod +x ~/.local/bin/coolify
export PATH="$HOME/.local/bin:$PATH"
```

### Configure Context

```bash
# Add Coolify instance
coolify context add production https://coolify.example.com YOUR_API_TOKEN

# List contexts
coolify context list

# Switch context
coolify context use staging

# Verify connection
coolify context verify
```

Get API token from Coolify dashboard: `/security/api-tokens`

### Service Management

```bash
# List all resources
coolify resource list

# Services
coolify service get SERVICE_UUID
coolify service start SERVICE_UUID
coolify service stop SERVICE_UUID
coolify service restart SERVICE_UUID

# Applications
coolify app get APP_UUID
coolify app logs APP_UUID --lines 500
coolify app start APP_UUID
coolify app restart APP_UUID

# Databases
coolify database list
coolify database start DB_UUID
coolify database backup DB_UUID
```

### Deployments

```bash
# Deploy application
coolify deploy APP_UUID

# Check deployment status
coolify deploy list APP_UUID

# Get deployment details
coolify deploy get DEPLOY_UUID
```

### Environment Variables

```bash
# List env vars
coolify app env list APP_UUID

# Set env var
coolify app env set APP_UUID DATABASE_URL "postgresql://..."

# Delete env var
coolify app env delete APP_UUID OLD_VAR

# Restart to apply
coolify app restart APP_UUID
```

### Server Management

```bash
# List servers with IPs
coolify server list -s

# Validate connection
coolify server validate SERVER_UUID

# Get server domains
coolify server domains SERVER_UUID
```

### JSON Output for Scripting

```bash
# Get all unhealthy services
coolify resource list --format json | jq '.[] | select(.status | contains("unhealthy"))'

# Extract service UUIDs
coolify service list --format json | jq -r '.[].uuid'

# Find running apps
coolify resource list --format json | jq '.[] | select(.type=="application" and .status=="running")'
```

---

## Part 2: API Direct Access

When CLI doesn't support an operation:

```bash
# Get service details
curl -H "Authorization: Bearer $API_TOKEN" \
  https://coolify.example.com/api/v1/services/SERVICE_UUID

# List all applications
curl -H "Authorization: Bearer $API_TOKEN" \
  https://coolify.example.com/api/v1/applications

# Trigger deployment
curl -X POST -H "Authorization: Bearer $API_TOKEN" \
  https://coolify.example.com/api/v1/applications/APP_UUID/deploy
```

---

## Part 3: Docker Patterns

### Dynamic Container Names Problem

Coolify appends unique suffixes on every deploy:
```
my-app-eg488k8w0o44o80800wwws4c-214629924110  # Deploy 1
my-app-eg488k8w0o44o80800wwws4c-222239183078  # Deploy 2
```

**Solution: Use DNS Aliases**

Coolify creates stable DNS aliases:
```json
{
  "DNSNames": [
    "my-app-eg488k8w0o44o80800wwws4c-222708068545",  // Dynamic (avoid!)
    "my-app",                                         // STABLE (use this!)
    "3e280ed24989"                                    // Container ID
  ]
}
```

```bash
# Find stable alias
docker inspect $(docker ps -q -f name=my-app) \
  --format '{{json .NetworkSettings.Networks}}' | \
  jq -r '.[].DNSNames[] | select(. | test("^[a-z]+-[a-z]+$"))'
```

### Network Configuration

```bash
# Check container network
docker inspect CONTAINER --format '{{json .NetworkSettings.Networks}}' | jq 'keys[]'

# Check if on coolify network
docker inspect CONTAINER --format '{{json .NetworkSettings.Networks}}' | jq 'has("coolify")'

# Connect to coolify network
docker network connect coolify CONTAINER
```

**Cross-stack communication:** Enable "Connect to Predefined Network" in Coolify UI.

### Environment Variable Gotchas

Coolify UI can save placeholder text as values:
```bash
# What you see: SMARTPROXY_PASSWORD=required
# What deploys: SMARTPROXY_PASSWORD="required"  # Broken!
```

**Solution: Detect placeholders in code**
```python
def get_env(key: str, default: str = None) -> str:
    val = os.getenv(key, default)
    if val and val.lower() in ("required", "todo", key.lower()):
        return default  # Placeholder detected
    return val
```

### Docker Compose Best Practices

```yaml
services:
  api:
    container_name: my-api  # Stable name
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    external: true
    name: coolify  # Connect to shared network
```

---

## Part 4: Prometheus + Grafana

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│ Prometheus  │────▶│   Grafana   │
│  :8001      │     │  :9090      │     │   :3000     │
└─────────────┘     └─────────────┘     └─────────────┘
                coolify network (shared)
```

### Prometheus Config

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: my-app
    static_configs:
      - targets: ['my-app:8001']  # Use stable DNS alias!
    metrics_path: /metrics
```

### Grafana Datasource

```yaml
# provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090  # Container name on coolify network
    isDefault: true
```

### Port Note

**Avoid port 8000** — reserved by Coolify. Use 8001+ for metrics.

---

## Part 5: WordPress Troubleshooting

### Access Container

Via Coolify dashboard → Service → Terminal → select "wordpress"

Or via SSH:
```bash
docker exec -it CONTAINER bash
cd /var/www/html
```

### Site Down After .htaccess Edit

```bash
# Check .htaccess
cat /var/www/html/.htaccess

# Remove last line (usually the problem)
sed -i '$d' /var/www/html/.htaccess
```

### PHP Configuration

```bash
# Add to .htaccess (note: space, not =)
echo "php_value max_input_vars 3000" >> /var/www/html/.htaccess
echo "php_value upload_max_filesize 64M" >> /var/www/html/.htaccess
echo "php_value post_max_size 128M" >> /var/www/html/.htaccess
```

### REST API Issues

Test externally first:
```bash
curl https://site.com/wp-json/
```

If JSON returns, it's a false positive — Site Health loopback is blocked, not the API.

Ensure .htaccess has:
```
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

---

## Part 6: SSL Certificates

Coolify uses Traefik with Let's Encrypt (auto-renewal).

### Check Certificate

```bash
echo | openssl s_client -servername domain.com -connect domain.com:443 2>/dev/null | \
  openssl x509 -noout -dates -subject
```

### Fix Invalid Certificate

1. Coolify dashboard → Service → Domains
2. Click regenerate SSL
3. Verify Traefik labels in service config

---

## Part 7: Debugging

### Quick Commands

```bash
# Container running?
docker ps | grep name

# Logs
docker logs CONTAINER --tail 100

# Env vars
docker exec CONTAINER printenv | grep KEY

# Network connectivity
docker exec CONTAINER curl -s http://other-service:port/health

# DNS resolution
docker exec CONTAINER nslookup other-service

# Health check status
docker inspect CONTAINER | jq '.[0].State.Health'
```

### Prometheus Target Health

```bash
curl -s 'http://localhost:9090/api/v1/targets' | \
  jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `no such host` | Wrong network | Enable "Connect to Predefined Network" |
| Target `down` | Dynamic container name | Use stable DNS alias |
| Env var placeholder | UI saved placeholder | Detect in code or fix in UI |
| 502 Bad Gateway | Container unhealthy | Check health checks |
| Port conflict | Port 8000 used | Use 8001+ |

---

## Quick Reference

### Troubleshooting Workflow

```
Service Down?
├── Check status: coolify resource list
├── Get details: coolify service get UUID
├── Check logs: coolify app logs UUID
├── Identify issue
├── Fix (restart, config, files)
└── Verify: coolify resource list
```

### CLI Cheatsheet

```bash
# Context
coolify context add NAME URL TOKEN
coolify context use NAME

# Resources
coolify resource list
coolify service restart UUID
coolify app logs UUID

# Deploy
coolify deploy UUID

# Env
coolify app env set UUID KEY "value"
coolify app restart UUID
```

### Docker Cheatsheet

```bash
# Find stable DNS alias
docker inspect CONTAINER --format '{{json .NetworkSettings.Networks}}' | jq '.[].DNSNames'

# Check network
docker inspect CONTAINER | jq '.[0].NetworkSettings.Networks | keys'

# Connect to coolify network
docker network connect coolify CONTAINER
```
