---
name: code-intelligence
description: "Code analysis: symbols (ctags), dependency graphs (dep-tree/pydeps), complexity + hotspots + code maps (tree-sitter). Use to understand structure, find definitions, trace deps, plan refactoring, or assess complexity."
---

# Code Intelligence Skill

Two layers: **ctags** for fast symbol lookup, **tree-sitter** for deep analysis (deps, complexity, code maps). Both in one script.

## Quick Reference

```bash
INTEL="python3 ~/.pi/agent/extensions/code-intelligence/intel.py"

# Layer 1: Ctags (zero deps, always works)
$INTEL analyze <file>              # functions, classes, imports
$INTEL structure [dir]             # language distribution

# Layer 2: Tree-sitter (needs: pip install tree-sitter tree-sitter-language-pack grep-ast)
$INTEL deps <file>                 # accurate import list
$INTEL matrix <dir> [<dir>...]     # cross-package import matrix
$INTEL complexity <file_or_dir>    # cyclomatic complexity ranking
$INTEL hotspots <dir> [--top N]    # CC × lines = refactoring priority
$INTEL map <file>                  # aider-style code map with context folding
```

All commands output JSON (machine-readable). Table formatters available for `matrix`, `complexity`, `hotspots`.

## Commands

### analyze — Symbols & Imports (Ctags)

```bash
$INTEL analyze parser/extract.py
```

Returns `{functions, classes, imports}`. Fast, zero deps. Use before editing a file.

### deps — Import List (Tree-sitter)

```bash
$INTEL deps parser/extract.py
# → ["asyncio", "httpx", "countries.types", "pydantic", ...]
```

AST-accurate. No regex false positives. Supports Python, JS, TS, Go, Rust.

### matrix — Cross-Package Import Matrix

```bash
$INTEL matrix bot parser shared countries skup amanat
```

```
From            amanat       bot countries    parser    shared      skup
------------------------------------------------------------------------
amanat               ·         ·         ·         ·         ·         ·
bot                  ·       117         1         6        10         ·
countries            ·         ·        61         ·        30         ·
parser               ·         ·        37         6        20         1
shared               ·         4         ·         2        18         ·
skup                 ·         ·         ·         ·         4         1
```

Instantly reveals coupling violations (e.g. `shared → bot: 4` = bad).

### complexity — Cyclomatic Complexity

```bash
# Single file
$INTEL complexity bot/main_aiogram.py
# → {file_cc: 208, top_functions: [{name: "_register_handlers", cc: 145, lines: 590}, ...]}

# Whole directory (ranked by CC)
$INTEL complexity parser/
```

### hotspots — Refactoring Priority

```bash
$INTEL hotspots . --top 10
```

Ranks files by `CC × code_lines`. High score = complex AND large = highest refactoring ROI.

### map — Code Map (grep-ast)

```bash
$INTEL map parser/staleness.py
```

Aider-style output: shows function/class signatures with tree-sitter context folding (`⋮` for collapsed bodies, `█` for definition lines). Perfect for understanding a file without reading every line.

## External Tools

### dep-tree — Dependency Graphs (multi-language)

```bash
# Full import tree from entrypoint
dep-tree tree parser/__main__.py --json

# Why does A depend on B?
dep-tree explain bot/main_aiogram.py parser/schema.py

# Enforce boundaries
dep-tree check  # uses .dep-tree.yml

# Interactive 3D graph in browser
dep-tree entropy parser/__main__.py
```

Best for JS/TS. Weak on Python namespace packages — use `matrix` command instead.

### pydeps — Python Import Graphs (SVG/PNG)

```bash
# Visual dependency graph
pydeps bot --max-bacon 2 --cluster -o /tmp/bot-deps.svg

# Cycles only
pydeps shared --show-cycles

# Text output (no graphviz needed)
pydeps bot --show-deps --no-output
```

Best for Python. Resolves cross-package imports correctly. Needs `graphviz` for SVG.

## Installation

```bash
# Layer 1 (always)
brew install universal-ctags

# Layer 2 (optional, for deps/complexity/map)
pip install tree-sitter tree-sitter-language-pack grep-ast

# External tools (optional)
brew install dep-tree graphviz
pip install pydeps
```

Tree-sitter commands gracefully degrade — if packages missing, they fall back to regex or return an error message.

## Workflow Examples

### Planning a File Move

```bash
# 1. What does it depend on?
$INTEL deps parser/schema.py

# 2. Who imports it?
rg "from parser\.schema" --type py -l

# 3. Understand its structure
$INTEL map parser/schema.py

# 4. After moving, verify no new coupling
$INTEL matrix bot parser shared countries
```

### Finding Refactoring Targets

```bash
# Top 10 worst files in the project
$INTEL hotspots . --top 10

# Drill into the worst one
$INTEL complexity bot/main_aiogram.py
# → _register_handlers: cc=145, 590 lines (!)

# See its structure to plan the split
$INTEL map bot/main_aiogram.py

# Then use refactoring tools (see python skill, Part 7):
# - LibCST CSTVisitor to analyze closure captures
# - LibCST CSTTransformer to unnest closures + replace captured vars
# - Rope to move top-level symbols to other modules
```

### Verifying Architectural Boundaries

```bash
# After decoupling bot from parser:
$INTEL matrix bot parser shared countries

# Expected: bot→parser should be 0
# If not 0: find the offending files
rg "from parser\." bot/ --type py -l
```

### Refactoring — Blast Radius Assessment

Before changing a module's public surface, assess impact systematically:

```bash
# 1. Map public surface — what does this module export?
$INTEL analyze src/core/engine.py
# Note every function/class that could be imported externally

# 2. Find all dependents — who uses this module?
rg "from core\.engine" --type py -l
rg "import engine" --type py -l
$INTEL matrix core api shared  # coupling matrix view

# 3. Map internal structure
$INTEL map src/core/engine.py
# Private functions (underscore-prefixed) are safe to restructure freely

# 4. Classify changes by risk:
#   SAFE:      rename private functions, reorganize internal logic
#   UPDATES:   rename public symbols, change signatures → update all dependents
#   RISKY:     remove exports, change return types, alter base class contracts → verify all call sites
```

Always present the blast radius **before** making breaking changes.

## Output Presentation Formats

When presenting code structure to the user:

### Module maps
```
src/
  core/         — Core engine: parsing, diffing, output
    engine.py   — Main diff algorithm (diff_images, compare)
    parser.py   — Format parsing (PNG, JPEG, WebP)
  api/          — REST API layer
    routes.py   — Entry point, route registration
    auth.py     — Authentication middleware
```

### Dependency flow
```
routes.py → auth.py → core/engine.py → core/parser.py
                    → shared/config.py
```

### Type hierarchies
```
Base: ImageDiffer
  ├── PixelDiffer
  ├── PerceptualDiffer
  └── StructuralDiffer
```

## Reference Files

- `references/query-patterns.md` — Tree-sitter `.scm` patterns for Python, TypeScript, Go, Rust (imports, classes, functions, decorators). Usable with both Python bindings and CLI.
