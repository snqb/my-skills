# Coolify Cheatsheet

## Container Operations

```bash
# Find container by name pattern
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i PATTERN

# Get stable DNS alias (use this in Prometheus/configs!)
docker inspect CONTAINER --format '{{json .NetworkSettings.Networks}}' | jq -r '.[].DNSNames[1]'

# Check what networks container is on
docker inspect CONTAINER --format '{{json .NetworkSettings.Networks}}' | jq 'keys[]'

# Get container IP on coolify network
docker inspect CONTAINER --format '{{.NetworkSettings.Networks.coolify.IPAddress}}'

# Connect manual container to coolify network
docker network connect coolify CONTAINER

# View env vars
docker exec CONTAINER printenv | sort

# Quick health check
docker exec CONTAINER curl -sf http://localhost:PORT/health && echo OK || echo FAIL
```

## Prometheus Targets

```bash
# Check all targets health
curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Check specific metric
curl -s 'http://localhost:9090/api/v1/query?query=METRIC_NAME' | jq '.data.result[]'

# Reload config (if --web.enable-lifecycle)
curl -X POST http://localhost:9090/-/reload
```

## SSH Pattern (with sshpass)

```bash
# One-liner command
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no USER@HOST "COMMAND"

# Example: check container logs
sshpass -p 'PASSWORD' ssh USER@HOST "docker logs CONTAINER --tail 50"
```

## Common Fixes

| Problem | One-liner Fix |
|---------|---------------|
| Prometheus can't reach target | Use stable DNS: `service-name:port` not full container name |
| Env var has placeholder | Hardcode fallback in code or fix in Coolify UI |
| Container not found | Coolify redeployed - find new name with `docker ps` |
| Port 8000 conflict | Use 8001 (Coolify reserves 8000) |
| Cross-stack networking | Enable "Connect to Predefined Network" in Coolify |

## Prometheus Config Template

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: my-service
    static_configs:
      - targets: ['my-service:8001']  # STABLE DNS alias
    metrics_path: /metrics
```

## Manual Prometheus Container

```bash
# Create config
cat > /tmp/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: my-app
    static_configs:
      - targets: ['my-app:8001']
EOF

# Run on coolify network
docker run -d \
  --name prometheus-manual \
  --network coolify \
  -v /tmp/prometheus.yml:/etc/prometheus/prometheus.yml \
  -p 9090:9090 \
  prom/prometheus:v2.47.0

# Update config and reload
docker restart prometheus-manual
```
