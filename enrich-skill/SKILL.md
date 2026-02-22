---
name: enrich-skill
description: "Improve existing skills by researching best practices from skills.sh, GitHub, and wshobson/agents. Use when asked to 'enrich', 'improve', or 'upgrade' a skill, or compare yours with others."
---

# Enrich Skill

Systematically improve local skills by researching and incorporating best patterns from the ecosystem.

## Workflow

### Step 1: Read Current Skill

```bash
cat ~/.pi/agent/skills/<skill-name>/SKILL.md
```

Identify:
- Current focus/strengths
- Gaps in coverage
- Structure and style

### Step 2: Research Ecosystem

#### Skills.sh (Community Skills)

```bash
npx skills find <topic>
```

#### wshobson/agents (Comprehensive Plugins)

```bash
# List all skills in a plugin
gh api repos/wshobson/agents/contents/plugins/<plugin-name>/skills | jq -r '.[] | .name'

# Get skill content
curl -s "https://raw.githubusercontent.com/wshobson/agents/main/plugins/<plugin>/skills/<skill>/SKILL.md"
```

**Known plugins:**
- `python-development` — 16 Python skills
- `backend-development` — API, security, observability
- `code-refactoring` — Refactoring patterns
- `cicd-automation` — CI/CD patterns

#### Anthropic Official Skills

```bash
gh api repos/anthropics/skills/contents/skills | jq -r '.[] | .name'
```

#### GitHub Search

```bash
# Quality-filtered search
gh search repos "<topic> skill agent" --stars ">50" --json fullName,description,stargazersCount

# Claude skills specifically
gh search repos "claude skill <topic>" --json fullName,description
```

### Step 3: Gap Analysis

Compare your skill against found skills:

| Your Skill Has | Your Skill Missing |
|----------------|-------------------|
| ✅ Feature A | ❌ Pattern X |
| ✅ Feature B | ❌ Pattern Y |

### Step 4: Enrich

Add missing patterns while:
- Preserving original style and focus
- Keeping content concise
- Avoiding redundancy
- Maintaining the skill's unique angle

### Step 5: Verify

```bash
# Check file size (aim for <15KB unless comprehensive)
wc -c ~/.pi/agent/skills/<skill-name>/SKILL.md

# Verify structure
head -50 ~/.pi/agent/skills/<skill-name>/SKILL.md
```

---

## Research Sources

### Primary Sources

| Source | Command | Best For |
|--------|---------|----------|
| skills.sh | `npx skills find <query>` | Community skills, quick discovery |
| wshobson/agents | `gh api repos/wshobson/agents/contents/plugins` | Comprehensive patterns |
| anthropics/skills | `gh api repos/anthropics/skills/contents/skills` | Official, document-focused |
| badlogic/pi-skills | `gh api repos/badlogic/pi-skills/contents` | Pi-specific skills |

### wshobson/agents Plugin Index

```bash
# List all plugins
gh api repos/wshobson/agents/contents/plugins | jq -r '.[] | .name' | head -30
```

Known comprehensive plugins:
- `python-development` — testing, design, types, performance, async
- `backend-development` — API design, security, databases
- `application-performance` — profiling, optimization
- `code-documentation` — docstrings, READMEs
- `comprehensive-review` — code review patterns

### Quick Skill Fetch

```bash
# Fetch and display a wshobson skill
PLUGIN="python-development"
SKILL="python-testing-patterns"
curl -s "https://raw.githubusercontent.com/wshobson/agents/main/plugins/$PLUGIN/skills/$SKILL/SKILL.md" | head -100
```

---

## Example: Enriching Python Skill

### 1. Read Current

```bash
cat ~/.pi/agent/skills/python/SKILL.md
```

**Found:** Astral stack (uv, ruff, ty), refactoring
**Missing:** Testing, design patterns, error handling

### 2. Research

```bash
# Skills.sh
npx skills find python

# wshobson Python skills
gh api repos/wshobson/agents/contents/plugins/python-development/skills | jq -r '.[] | .name'
```

**Found 16 skills:**
- python-testing-patterns
- python-design-patterns  
- python-type-safety
- python-error-handling
- python-performance-optimization
- ...

### 3. Fetch Best Patterns

```bash
for skill in python-testing-patterns python-design-patterns python-error-handling; do
  curl -s "https://raw.githubusercontent.com/wshobson/agents/main/plugins/python-development/skills/$skill/SKILL.md"
done
```

### 4. Gap Analysis

| Has | Missing |
|-----|---------|
| ✅ Astral stack | ❌ pytest fixtures/mocking |
| ✅ rope-refactor | ❌ KISS/SRP patterns |
| ✅ Type checking | ❌ Generics/Protocols |
| | ❌ Error handling |
| | ❌ Performance profiling |

### 5. Enrich

Add sections for:
- Testing patterns (fixtures, parametrize, mocking)
- Design principles (KISS, SRP, composition)
- Type safety (generics, protocols)
- Error handling (fail fast, parse don't validate)
- Performance (profiling, common optimizations)

---

## Enrichment Principles

### Do
- ✅ Keep original skill's unique focus
- ✅ Add complementary patterns
- ✅ Maintain concise style
- ✅ Include practical examples
- ✅ Preserve working commands/configs

### Don't
- ❌ Replace unique content with generic
- ❌ Bloat beyond necessity
- ❌ Copy verbatim without adaptation
- ❌ Add rarely-used patterns
- ❌ Duplicate what other skills cover

### Size Guidelines

| Skill Type | Target Size |
|------------|-------------|
| Focused tool | 3-5 KB |
| Language/framework | 10-15 KB |
| Comprehensive guide | 15-25 KB |

---

## Quick Commands

```bash
# Check your skill
cat ~/.pi/agent/skills/<name>/SKILL.md | head -50

# Search skills.sh
npx skills find <topic>

# List wshobson plugins
gh api repos/wshobson/agents/contents/plugins | jq -r '.[] | .name'

# List skills in plugin
gh api repos/wshobson/agents/contents/plugins/<plugin>/skills | jq -r '.[] | .name'

# Fetch skill content
curl -s "https://raw.githubusercontent.com/wshobson/agents/main/plugins/<plugin>/skills/<skill>/SKILL.md"

# Check Anthropic skills
gh api repos/anthropics/skills/contents/skills | jq -r '.[] | .name'
```
