---
name: code-intelligence
description: Lightweight code analysis using Ctags. Provides symbol extraction (functions, classes) and dependency analysis. Use this when you need to understand the codebase structure, find definitions, or analyze dependencies without reading every file.
---

# Code Intelligence Skill

This skill provides **structural understanding** of code using Ctags and heuristics. It is faster than reading full files and simpler than heavy AST parsers.

## Capabilities

- **Symbol Extraction**: Find all functions, classes, and methods in a file.
- **Dependency Analysis**: See what modules a file imports.
- **Project Structure**: Analyze the project layout and language distribution.

## Tools

### 1. Analyze File (Symbols & Imports)

Extracts structure from a specific file.

```bash
python3 ~/.pi/agent/extensions/code-intelligence/intel.py analyze <file_path>
```

**Output**: JSON object with `functions`, `classes`, and `imports`.

**When to use:**
- "What functions are in this file?"
- "Where is the `User` class defined?"
- "What dependencies does this script use?"
- Before editing a file, to understand its structure.

### 2. Analyze Project Structure

Scans the codebase to understand organization.

```bash
python3 ~/.pi/agent/extensions/code-intelligence/intel.py structure
```

**Output**: JSON summary of languages.

**When to use:**
- "How is this project structured?"
- "What languages are used?"

## Implementation Details

- **Engine**: `ctags` (via `code-intelligence` extension)
- **Supported Languages**: Python, JavaScript, TypeScript, Go, Rust, Java, C++, and more.
- **Performance**: Extremely fast, zero-dependency python script.

## Example

**User:** "What does `auth.py` do?"

**Agent:**
1. Run `analyze auth.py` to see functions (`login`, `logout`, `verify_token`).
2. See imports (`jwt`, `bcrypt`).
3. Conclude: "It handles user authentication using JWT and bcrypt."
