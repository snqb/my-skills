# Docker Skill

**Source:** Internal + HN research (2025)

## What It Does

Modern Docker workflows: image optimization, debugging, fast builds.

## Tools

**Essential:**
- `lazydocker` - TUI dashboard for containers/images/logs
- `dive` - Image layer analyzer (find bloat)
- BuildKit - Modern builder (parallel, caching)

**Already Have:**
- OrbStack (fast Docker Desktop replacement)
- `docker-best-practices.md` (reference)

## Quick Start

```bash
# Manage everything Docker
lazydocker

# Analyze image bloat
dive myimage:latest

# Enable BuildKit permanently
echo 'export DOCKER_BUILDKIT=1' >> ~/.zshrc
```

## When to Use

- **Optimizing images** → Use dive workflow
- **Debugging containers** → Use lazydocker
- **Slow builds** → Check BuildKit patterns
- **Writing Dockerfiles** → See docker-best-practices.md

## Files

- **SKILL.md** - Complete workflows and patterns
- **docker-best-practices.md** (`~/.claude/references/`) - Dockerfile reference
