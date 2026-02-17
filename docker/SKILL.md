---
name: docker
description: Modern Docker workflows - image optimization, debugging, fast builds with dive, lazydocker, and BuildKit
---

# Docker Mastery

Modern Docker tools and workflows. For Dockerfile syntax, see `~/.claude/references/docker-best-practices.md`.

## Tools Setup

```bash
# Install essentials
brew install lazydocker dive

# Enable BuildKit
echo 'export DOCKER_BUILDKIT=1' >> ~/.zshrc
source ~/.zshrc
```

## Image Optimization Workflow

### 1. Analyze with dive

```bash
# Interactive mode
dive myimage:latest
# Tab: switch layers/files
# Space: expand directories
# Ctrl+U/D: page up/down

# CI mode (get efficiency score)
dive myimage:latest --ci
```

### 2. Identify Bloat

**Common culprits:**
- Package manager caches (`/var/cache/*`, `/var/lib/apt/lists/*`)
- Build tools in production image
- Duplicate files across layers
- Large dependencies copied multiple times

**Target efficiency:** 95%+

### 3. Fix Patterns

**Remove APT cache:**
```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*
```

**Use Alpine (no APT at all):**
```dockerfile
FROM python:3.12-alpine  # 45MB vs 130MB (slim)
RUN apk add --no-cache build-base  # Auto-cleans
```

**Multi-stage builds:**
```dockerfile
FROM node:20 AS builder  # 1.1GB (build tools)
RUN npm ci && npm run build

FROM node:20-alpine      # 180MB (runtime only)
COPY --from=builder /app/dist ./dist
```

### 4. Measure Results

```bash
# Before/after comparison
docker images | grep myimage
# Goal: 2-3x size reduction for typical apps
```

**Real-world targets:**
- Python API: 80-150MB (Alpine) | 150-250MB (Slim)
- Node.js API: 100-200MB (Alpine)
- Rust binary: 5-20MB (scratch/Alpine)
- Go binary: 10-30MB (scratch/distroless)

## Container Management

### lazydocker - Interactive Dashboard

```bash
lazydocker
```

**Navigation:**
- Arrow keys: move between sections
- Enter: view logs/stats
- `d`: remove container
- `s`: stop/start
- `r`: restart
- `l`: view logs
- `/`: search

**Pro tips:**
- View all logs in real-time (no more `docker logs -f` juggling)
- Kill multiple containers at once
- See resource usage instantly
- Works great in tmux split

## BuildKit Advanced Patterns

### Cache Mounts (Persistent Package Caches)

```dockerfile
# syntax=docker/dockerfile:1.4

# npm cache persists between builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# cargo cache
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release
```

**Win:** 10min → 30sec rebuilds (after first build)

### Build Secrets (No Leaked Credentials)

```dockerfile
# Old way (leaks in image history) ❌
ARG GITHUB_TOKEN
RUN git clone https://${GITHUB_TOKEN}@github.com/private/repo

# BuildKit way ✅
RUN --mount=type=secret,id=github_token \
    git clone https://$(cat /run/secrets/github_token)@github.com/private/repo
```

```bash
# Build with secret
docker build --secret id=github_token,src=$HOME/.github/token -t myapp .
```

### SSH for Private Repos

```dockerfile
RUN --mount=type=ssh \
    pip install git+ssh://git@github.com/private/package.git
```

```bash
# Build with SSH agent
docker build --ssh default -t myapp .
```

### Parallel Stages

```dockerfile
FROM base AS deps
RUN npm ci

FROM base AS test
COPY --from=deps /app/node_modules ./node_modules
RUN npm test

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# deps, test, build run in parallel!
FROM base AS final
COPY --from=build /app/dist ./dist
```

## OrbStack Tips

**Faster builds:**
- Containers start 5-10x faster than Docker Desktop
- Rosetta 2 support for x86 images on M1/M2 (automatic)
- Native network performance (no VM overhead)

**CLI same as Docker:**
```bash
docker ps        # Works exactly the same
docker compose up
```

**Resource usage:**
- Docker Desktop: ~3GB RAM idle
- OrbStack: ~300MB RAM idle

**Quirks:**
- Fast mode uses lightweight VMs (can break some kernel features)
- Restart OrbStack if networking acts weird (rare)

## Troubleshooting

### Build Failures

```bash
# Verbose build output
DOCKER_BUILDKIT=1 docker build --progress=plain -t myapp .

# No cache (fresh build)
docker build --no-cache -t myapp .

# Check layer-by-layer
dive --source docker://myapp:latest
```

### Network Issues

```bash
# DNS not resolving
echo '{"dns": ["8.8.8.8", "8.8.4.4"]}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker  # Linux
# OrbStack: Settings → Restart

# Container can't reach internet
docker run --rm alpine ping -c 3 google.com
```

### Image Pull Failures

```bash
# Check registry auth
docker login

# Pull with different architecture
docker pull --platform linux/amd64 myimage:latest

# Use mirror if blocked
# Edit /etc/docker/daemon.json:
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

### Verify Tags Exist Before Pinning

**Problem:** `manifest unknown` errors when pulling specific versions.

**Always verify tags exist on Docker Hub before pinning:**

```bash
# Check available tags for an image
curl -s "https://registry.hub.docker.com/v2/repositories/browserless/chrome/tags?page_size=100" \
  | jq -r '.results[].name' | grep "puppeteer"

# For official images (different API)
curl -s "https://hub.docker.com/v2/repositories/library/postgres/tags?page_size=50" \
  | jq -r '.results[].name'

# For GitHub Container Registry
curl -s "https://ghcr.io/v2/flaresolverr/flaresolverr/tags/list" \
  | jq -r '.tags[]'
```

**Common gotchas:**

1. **Semantic versioning assumptions:**
   ```yaml
   # ❌ Assumed exists, doesn't
   image: browserless/chrome:1-puppeteer-21.11.0

   # ✅ Actually exists
   image: browserless/chrome:1-puppeteer-21.9.0
   ```

2. **Latest vs stable tags:**
   - `latest` = moving target (breaks in production)
   - Pin to specific version after verifying it exists

3. **Version formats vary by project:**
   - Some use `v3.3.21`, others use `3.3.21`
   - Some use date tags `2024-01-15`
   - Always check the actual registry

**Workflow:**
```bash
# 1. Find available versions
curl -s "https://registry.hub.docker.com/v2/repositories/IMAGE/tags?page_size=100" | jq -r '.results[].name'

# 2. Pick stable version (not :latest)
# 3. Test pull locally
docker pull IMAGE:VERIFIED_TAG

# 4. Pin in compose/Dockerfile
# 5. Document why that version was chosen
```

### Container Won't Stop

```bash
# Force kill
docker kill <container-id>

# If stuck, restart Docker daemon
# OrbStack: Quit + Reopen
```

## Quick Wins Checklist

**Image size:**
- [ ] Use Alpine/Slim base images
- [ ] Multi-stage builds (build vs runtime)
- [ ] .dockerignore exists
- [ ] Run dive, fix >5MB waste

**Build speed:**
- [ ] BuildKit enabled (`export DOCKER_BUILDKIT=1`)
- [ ] Dependencies before code (layer caching)
- [ ] Cache mounts for package managers
- [ ] Parallel stages where possible

**Developer experience:**
- [ ] lazydocker installed
- [ ] OrbStack (macOS) or Podman (Linux)
- [ ] Health checks in Dockerfile
- [ ] docker-compose.yml for local dev

**Security:**
- [ ] Non-root USER in Dockerfile
- [ ] No secrets in ENV/ARG
- [ ] Base image from trusted source
- [ ] Regular `docker scout cves` scans

**Version pinning:**
- [ ] No `:latest` tags in production
- [ ] Verified tags exist on Docker Hub before using
- [ ] Document why specific versions chosen
- [ ] Test image pull before deploying

## Common Patterns

### Python + uv (Fast Package Manager)

```dockerfile
FROM python:3.12-slim
RUN pip install uv

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt

COPY . .
CMD ["python", "app.py"]
```

### Node.js Optimized

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
CMD ["node", "index.js"]
```

### Rust Static Binary

```dockerfile
FROM rust:1.75-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY Cargo.* ./
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release

FROM scratch
COPY --from=builder /app/target/release/myapp /myapp
ENTRYPOINT ["/myapp"]
```

## Decision Tree

**Optimizing image size?**
→ `dive myimage:latest` → Fix top 5 wasted files → Alpine base → Multi-stage

**Slow builds?**
→ Check layer order → Add cache mounts → Enable BuildKit → Parallel stages

**Debugging containers?**
→ `lazydocker` → View logs/stats → Exec shell → Check health

**Writing Dockerfile?**
→ See `~/.claude/references/docker-best-practices.md` → Test with `dive` → Iterate

**Security review?**
→ `docker scout cves` → Non-root user → No secrets → Update base image
