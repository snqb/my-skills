---
name: python
description: "Modern Python: uv, ruff, pyright, refactoring (LibCST/Rope), testing, design principles, type safety, error handling, performance."
---

# Python Development

## Part 1: Astral Stack + Tooling

### The Stack

| Tool | Purpose | Speed |
|------|---------|-------|
| **uv** | Package manager | 10-100x pip |
| **ruff** | Linter + formatter | 10-100x flake8/black |
| **pyright** | Type checker (standard mode) | Fast, practical |
| **rope** | Rename, move, extract | N/A |
| **refac** | Move symbols between modules | N/A |
| **LibCST** | Custom codemods (structural) | N/A |

```bash
# Install
uv tool install ruff
uv pip install pyright rope libcst    # refac also exists but breaks on relative imports
```

### Daily Commands

```bash
# Package management
uv sync                     # Install deps
uv add package              # Add dependency
uv add --dev pytest         # Add dev dep
uv run python app.py        # Run with env

# Linting/Formatting
ruff check --fix . && ruff format .

# Type checking
pyright src/                # Standard mode (practical for real codebases)

# Refactoring (always preview first!)
# See Part 7 for Rope, refac, LibCST usage
```

### Single-File Scripts (PEP 723)

For throwaway scripts, use `uv run` + inline deps. No venv, no requirements.txt.

```python
#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "httpx",
#     "plumbum",
# ]
# ///
```

```bash
uv init --script file.py            # scaffold PEP 723 header
uv add --script file.py httpx rich  # add deps to existing script
uv run file.py                      # auto-installs deps, caches
uvx ruff check .                    # run tool without installing
```

### Shell Commands in Python (plumbum)

The only Python shell library where piping actually works:

```python
from plumbum import local, RETCODE
from plumbum.cmd import git, curl, jq, grep, wc, cat

# Pipe
n = (cat["file.py"] | grep["import"] | wc["-l"])()

# API + jq
title = (curl["-s", url] | jq[".title"])()

# Partial application
api = curl["-s", "-f"]
result = api["https://example.com"]()

# Ignore errors (get exit code, no exception)
rc = (local.cmd.ls["/maybe-missing"] & RETCODE)

# Safe interpolation — always list-based, no injection
local.cmd.rm["-rf", user_input]()  # user_input is ONE arg, never split
```

**Note:** plumbum is sync-only. For async subprocess work, prefer Deno + dax.

### pyproject.toml Template

```toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.11"

[tool.uv]
dev-dependencies = ["pytest>=8.0", "pytest-cov>=4.0", "pytest-asyncio>=0.23"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = [
    "E", "W",     # pycodestyle
    "F",          # pyflakes
    "I",          # isort
    "B",          # flake8-bugbear
    "C4",         # flake8-comprehensions
    "UP",         # pyupgrade
    "SIM",        # flake8-simplify
    "PL",         # pylint
    "RUF",        # ruff-specific
    "PERF",       # performance anti-patterns
    "FURB",       # refurb modernization
    "LOG",        # logging best practices
    "ASYNC",      # async anti-patterns
    "S",          # bandit security
    "A",          # flake8-builtins
    "T20",        # flake8-print (catch debug prints)
    "TRY",        # tryceratops (exception handling)
    "RET",        # flake8-return
]
ignore = [
    "PLR0913",    # too many arguments (configs)
    "PLR2004",    # magic value comparison
    "PLR0912",    # too many branches
    "E501",       # line too long (URLs, SQL)
    "S101",       # assert (fine in non-prod)
    "TRY003",     # long exception messages (descriptive is good)
    "RUF012",     # mutable ClassVar (Pydantic defaults)
]

[tool.ruff.lint.isort]
known-first-party = ["mypackage"]
force-single-line = true

[tool.ruff.lint.per-file-ignores]
"**/test_*.py" = ["PLR2004", "S101", "T20"]
"**/__init__.py" = ["F401"]
"scripts/**/*.py" = ["T20"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true

[tool.pyright]
typeCheckingMode = "standard"        # "strict" is aspirational; "standard" is practical
pythonVersion = "3.11"
venvPath = "."
venv = ".venv"
include = ["src"]
exclude = ["**/__pycache__", ".venv", "scripts", "tests"]
reportMissingTypeStubs = "none"      # Don't block on missing stubs
reportIncompatibleVariableOverride = "none"  # Pydantic field overrides

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-v --tb=short --strict-markers"
markers = [
    "e2e: end-to-end tests requiring full environment",
    "integration: integration tests with external dependencies",
]
```

---

## Part 2: Testing Patterns

### Basic Test Structure (AAA)

```python
def test_user_creation():
    # Arrange
    data = {"name": "Alice", "email": "alice@example.com"}
    
    # Act
    user = User.create(**data)
    
    # Assert
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
```

### Fixtures

```python
import pytest
from typing import Generator

@pytest.fixture
def db() -> Generator[Database, None, None]:
    """Fixture with setup and teardown."""
    database = Database(":memory:")
    database.connect()
    yield database  # Test runs here
    database.disconnect()

@pytest.fixture(scope="session")
def app_config() -> dict:
    """Session-scoped: created once for all tests."""
    return {"debug": True, "db_url": "sqlite:///:memory:"}

def test_query(db: Database):
    """Fixture injected automatically."""
    result = db.query("SELECT 1")
    assert result is not None
```

### Parametrization

```python
@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("World", "WORLD"),
    ("", ""),
])
def test_uppercase(input: str, expected: str):
    assert input.upper() == expected

@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add(a: int, b: int, expected: int):
    assert add(a, b) == expected
```

### Mocking

```python
from unittest.mock import Mock, patch, AsyncMock

def test_with_mock():
    # Mock object
    api = Mock()
    api.get_user.return_value = {"id": 1, "name": "Alice"}
    
    result = api.get_user(1)
    assert result["name"] == "Alice"
    api.get_user.assert_called_once_with(1)

@patch("myapp.services.requests.get")
def test_with_patch(mock_get: Mock):
    mock_get.return_value.json.return_value = {"status": "ok"}
    
    result = fetch_status()
    assert result == "ok"

# Async mocking
async def test_async_mock():
    api = AsyncMock()
    api.fetch.return_value = {"data": [1, 2, 3]}
    
    result = await api.fetch()
    assert result["data"] == [1, 2, 3]
```

### Exception Testing

```python
def test_raises_error():
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate(-1)

def test_raises_specific():
    with pytest.raises(UserNotFoundError) as exc_info:
        get_user("nonexistent")
    assert exc_info.value.user_id == "nonexistent"
```

---

## Part 3: Design Principles

### KISS — Keep It Simple

```python
# ❌ Over-engineered
class FormatterFactory:
    _registry: dict[str, type] = {}
    
    @classmethod
    def register(cls, name: str):
        def decorator(klass):
            cls._registry[name] = klass
            return klass
        return decorator

# ✅ Simple
FORMATTERS = {"json": JsonFormatter, "csv": CsvFormatter}

def get_formatter(name: str) -> Formatter:
    return FORMATTERS[name]()
```

### Single Responsibility

```python
# ❌ Handler does everything
class UserHandler:
    async def create(self, request):
        data = await request.json()           # HTTP
        if not data.get("email"): return 400  # Validation
        user = await db.insert(data)          # Database
        return {"id": user.id}                # Response

# ✅ Separated concerns
class UserService:
    """Business logic only."""
    async def create(self, data: CreateUserInput) -> User:
        return await self.repo.save(User(**data.dict()))

class UserHandler:
    """HTTP only."""
    async def create(self, request) -> Response:
        data = CreateUserInput(**(await request.json()))
        user = await self.service.create(data)
        return Response(user.to_dict(), 201)
```

### Composition Over Inheritance

```python
# ❌ Deep inheritance
class Animal: ...
class Mammal(Animal): ...
class Dog(Mammal): ...
class SwimmingDog(Dog): ...  # What about flying dogs?

# ✅ Composition
@dataclass
class Animal:
    name: str
    behaviors: list[Behavior]
    
    def perform(self, action: str):
        for b in self.behaviors:
            if b.can_handle(action):
                return b.execute(action)

dog = Animal("Rex", [WalkBehavior(), SwimBehavior()])
```

### Rule of Three

Wait for 3 instances before abstracting. Premature abstraction is worse than duplication.

```python
# First time: just write it
def process_user_csv(path): ...

# Second time: still just write it
def process_order_csv(path): ...

# Third time: NOW abstract
def process_csv(path: str, row_handler: Callable[[dict], T]) -> list[T]: ...
```

---

## Part 4: Type Safety

### Generics

```python
from typing import TypeVar, Generic

T = TypeVar("T")

class Result(Generic[T]):
    def __init__(self, value: T | None = None, error: Exception | None = None):
        self._value = value
        self._error = error
    
    def unwrap(self) -> T:
        if self._error:
            raise self._error
        return self._value  # type: ignore

    def unwrap_or(self, default: T) -> T:
        return default if self._error else self._value  # type: ignore

# Usage
def parse_config(path: str) -> Result[Config]:
    try:
        return Result(value=Config.load(path))
    except ConfigError as e:
        return Result(error=e)

result = parse_config("app.yaml")
config = result.unwrap_or(Config.default())
```

### Protocols (Structural Typing)

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_dict(self) -> dict: ...
    
    @classmethod
    def from_dict(cls, data: dict) -> "Serializable": ...

# Any class with these methods satisfies the protocol
class User:
    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name}
    
    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(**data)

def serialize(obj: Serializable) -> str:
    return json.dumps(obj.to_dict())

# Works — User matches protocol structurally
serialize(User("1", "Alice"))
isinstance(User(...), Serializable)  # True (runtime_checkable)
```

### TypeVar with Bounds

```python
from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)

def validate(model_cls: type[ModelT], data: dict) -> ModelT:
    return model_cls.model_validate(data)

# Only accepts BaseModel subclasses
user = validate(User, {"name": "Alice"})  # ✅
text = validate(str, {"x": 1})            # ❌ Type error
```

---

## Part 5: Error Handling

### Fail Fast — Validate Early

```python
def process_order(order_id: str, quantity: int, discount: float) -> OrderResult:
    # Validate all inputs first
    if not order_id:
        raise ValueError("'order_id' is required")
    if quantity <= 0:
        raise ValueError(f"'quantity' must be positive, got {quantity}")
    if not 0 <= discount <= 100:
        raise ValueError(f"'discount' must be 0-100, got {discount}")
    
    # Now safe to proceed
    return _process(order_id, quantity, discount)
```

### Parse, Don't Validate

```python
from enum import Enum

class OutputFormat(Enum):
    JSON = "json"
    CSV = "csv"

def parse_format(value: str) -> OutputFormat:
    """Convert string to typed enum at boundary."""
    try:
        return OutputFormat(value.lower())
    except ValueError:
        valid = [f.value for f in OutputFormat]
        raise ValueError(f"Invalid format '{value}'. Valid: {valid}")

# At API boundary
def export(data: list, format_str: str) -> bytes:
    fmt = parse_format(format_str)  # Fail fast, now typed
    ...
```

### Exception Hierarchy

```python
class AppError(Exception):
    """Base for all app errors."""

class ValidationError(AppError):
    """Input validation failed."""

class NotFoundError(AppError):
    """Resource not found."""
    def __init__(self, resource: str, id: str):
        self.resource = resource
        self.id = id
        super().__init__(f"{resource} '{id}' not found")

class ExternalServiceError(AppError):
    """External API/service failed."""
    def __init__(self, service: str, status: int, body: str):
        self.service = service
        self.status = status
        self.body = body
        super().__init__(f"{service} returned {status}")
```

### Pydantic Validation

```python
from pydantic import BaseModel, Field, field_validator

class CreateUser(BaseModel):
    email: str = Field(..., min_length=5)
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(ge=0, le=150)
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email")
        return v.lower()

# Automatic validation with clear errors
try:
    user = CreateUser(email="bad", name="", age=200)
except ValidationError as e:
    print(e.errors())  # Detailed error list
```

---

## Part 6: Performance Essentials

### Profiling First

```bash
# cProfile — find slow functions
python -m cProfile -s cumtime script.py

# line_profiler — line-by-line
pip install line_profiler
kernprof -l -v script.py

# memory_profiler — memory usage
pip install memory-profiler
python -m memory_profiler script.py

# py-spy — production profiling (no code changes)
pip install py-spy
py-spy top --pid 12345
py-spy record -o flame.svg --pid 12345
```

### Common Optimizations

```python
# ❌ String concatenation in loop
result = ""
for item in items:
    result += str(item)

# ✅ Join
result = "".join(str(item) for item in items)

# ❌ List when generator works
squares = [x**2 for x in range(1_000_000)]
total = sum(squares)

# ✅ Generator (constant memory)
total = sum(x**2 for x in range(1_000_000))

# ❌ List search O(n)
if item in large_list: ...

# ✅ Set/dict lookup O(1)
if item in large_set: ...

# ❌ Global variable access
MULTIPLIER = 2
def slow():
    return sum(MULTIPLIER * x for x in range(10000))

# ✅ Local variable (faster lookup)
def fast():
    multiplier = 2
    return sum(multiplier * x for x in range(10000))
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(n: int) -> int:
    # Cached after first call with same n
    return sum(i**2 for i in range(n))

# Check cache stats
expensive_computation.cache_info()

# Clear cache
expensive_computation.cache_clear()
```

### __slots__ for Memory

```python
class Regular:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Slotted:
    __slots__ = ["x", "y"]
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Slotted uses ~40% less memory per instance
# Use for classes with many instances
```

---

## Quick Reference

---

## Part 7: Refactoring Tools

### Tool Landscape

| Tool | Stars | Best For | Gotchas |
|------|-------|----------|---------|
| **Rope** | 2,171⭐ | Move top-level symbols, rename across codebase | Offset must point to NAME not `def`; uses fully-qualified imports that need cleanup |
| **LibCST** | 1,851⭐ | Custom codemods: unnest closures, rewrite patterns, structural transforms | Preserves formatting; `.visit()` not `.walk()`; `CSTTransformer` for changes, `CSTVisitor` for read-only |
| **refac** | 56⭐ | `refac symbol src dst` (LibCST-based) | ❌ **Broken on relative imports** — crashes on `from .foo import bar` |
| **Bowler** | 1,612⭐ | Fluent API for simple refactors | Stale (last commit mid-2024) |
| **refactor** | 458⭐ | AST pattern find-and-replace rules | Good for simple transforms, not structural moves |
| **MonkeyType** | 4,994⭐ | Generate type annotations from runtime | Run tests under it, then `monkeytype apply module` |

### When to Use What

```
Need to...
├── Move top-level function/class to another module → Rope (proven)
├── Rename symbol across codebase → Rope
├── Unnest closures / restructure → LibCST codemod (custom)
├── Replace captured vars (bot→self.bot) → LibCST CSTTransformer
├── Analyze function structure (what captures what) → LibCST CSTVisitor or ast
├── Pattern-based transforms → refactor or LibCST
├── Remove dead imports → ruff --fix
├── Move symbols between modules → Rope (NOT refac — it breaks on relative imports)
└── Add type annotations from runtime → MonkeyType
```

### Rope — Move Top-Level Symbols

**Proven pattern.** Rope moves functions/classes and rewrites imports across the codebase.

```python
import rope.base.project
import rope.refactor.move

proj = rope.base.project.Project('.')
resource = proj.get_resource('src/big_module.py')
src = resource.read()

# IMPORTANT: offset must point to the NAME, not 'def '
idx = src.index('def my_function')
offset = idx + 4  # skip 'def ' → points to 'my_function'

mover = rope.refactor.move.create_move(proj, resource, offset)
dest = proj.get_resource('src/utils.py')  # target must exist
changes = mover.get_changes(dest)

print(changes.get_description())  # Always preview first
changes.do()                      # Apply
```

**Batch moves (loop pattern):**
```python
moves = [
    ('MyClass',     'class ',     'src/models.py'),
    ('helper_func', 'def ',       'src/utils.py'),
    ('async_func',  'async def ', 'src/async_utils.py'),
]
for name, prefix, target in moves:
    resource = proj.get_resource('src/big_module.py')  # re-read after each move!
    src = resource.read()
    idx = src.index(f'{prefix}{name}')
    offset = idx + len(prefix)
    mover = rope.refactor.move.create_move(proj, resource, offset)
    dest = proj.get_resource(target)
    changes = mover.get_changes(dest)
    changes.do()
```

**⚠️ Rope gotchas:**
- **CRITICAL: Check for package/file conflicts!** Rope creates `foo.py` without checking if `foo/` (package dir) exists. Python silently prefers the directory → import breaks at runtime. Always run: `find . -name '*.py' | while read f; do d="${f%.py}"; [ -d "$d" ] && echo "CONFLICT: $f vs $d/"; done`
- Adds `import bot.module` style imports → replace with `from .module import symbol`
- Moves logger references → give target modules their own `logger = logging.getLogger(__name__)`
- Re-read resource after each move (file content changes)

### LibCST — Analyze + Transform

**Analysis (CSTVisitor — read-only):**
```python
import libcst as cst

class BodyNameCollector(cst.CSTVisitor):
    """Collect bare Name references, skipping imports and inner classes."""
    def __init__(self):
        self.names: set[str] = set()
        self._in_import = False
    
    def visit_ImportFrom(self, node): self._in_import = True
    def leave_ImportFrom(self, node): self._in_import = False
    def visit_ClassDef(self, node): return False  # skip inner classes
    def visit_Name(self, node):
        if not self._in_import:
            self.names.add(node.value)

# Usage: analyze what a function captures from enclosing scope
tree = cst.parse_module(open("big.py").read())
collector = BodyNameCollector()
some_function_node.body.visit(collector)
captures = collector.names & {'bot', 'db', 'config'}
```

**Transform (CSTTransformer — rewrite):**
```python
class ReplaceCapturedVars(cst.CSTTransformer):
    """Replace `bot` → `callback.bot`, `country` → `get_country()`."""
    def __init__(self, captures: set[str], first_param: str):
        self.captures = captures
        self.first_param = first_param
        self._in_import = False
        self._in_inner_class = False
    
    def visit_ImportFrom(self, node): self._in_import = True; return True
    def leave_ImportFrom(self, o, u): self._in_import = False; return u
    def visit_ClassDef(self, node): self._in_inner_class = True; return True
    def leave_ClassDef(self, o, u): self._in_inner_class = False; return u
    
    def leave_Name(self, original, updated):
        if self._in_import or self._in_inner_class:
            return updated
        if updated.value == 'bot' and 'bot' in self.captures:
            return cst.Attribute(value=cst.Name(self.first_param), attr=cst.Name("bot"))
        if updated.value == 'country' and 'country' in self.captures:
            return cst.Call(func=cst.Name("get_country"))
        return updated

# Apply to function body
replacer = ReplaceCapturedVars({'bot', 'country'}, 'callback')
new_body = function_node.body.visit(replacer)
```

**⚠️ LibCST gotchas:**
- Use `.visit()` not `.walk()` (no `.walk()` on Module)
- `CSTTransformer.leave_*` returns `(original, updated)` — return `updated` with changes
- `cst.RemovalSentinel.REMOVE` to delete a node
- `cst.parse_statement()` is brittle for multi-line — use text-level reconstruction for complex bodies
- Inner classes need explicit skip logic (set a flag in `visit_ClassDef`)

### Workflow: Decompose a God Module (Proven)

Real pattern used to split a 1,252-line file into 5 modules:

```bash
# Phase 1: Unnest closures (LibCST — ~5 min automated)
# Write a CSTVisitor to analyze captures, then text-level transform:
#   - Strip @router decorators
#   - Dedent 4 spaces (remove nesting)  
#   - Replace `bot` → `message.bot`/`callback.bot`
#   - Replace `country` → `get_country()`
#   - Replace `menu_handler` → `_get_menu_handler()` (module singleton)
# Key insight: check if framework already provides the captured value
#   (e.g., aiogram: message.bot, callback.bot — no param needed!)

# Phase 2: Move top-level symbols (Rope — ~10 min automated)
# Middleware class → bot/middleware.py
# Config helpers → bot/core/config.py
# Startup/shutdown → bot/startup.py
# Then fix Rope's fully-qualified imports

# Phase 3: Verify
ruff check --fix . && ruff format .  # Fix imports
pyright .                             # Type check
pytest                                # Regressions?

# Phase 4: The god module should now be just:
#   - Imports
#   - Wiring (_register_handlers with router.message()(handler) calls)
#   - main() entry point
```

### MonkeyType — Generate Type Annotations

```bash
uv pip install monkeytype
monkeytype run pytest tests/        # Collect runtime types
monkeytype stub mypackage.module    # Preview annotations
monkeytype apply mypackage.module   # Apply to source
```

---

## Quick Reference

### Decision Tree

```
Python task?
├── Package management → uv
├── Linting/imports → ruff check
├── Formatting → ruff format
├── Type checking → pyright (standard mode)
├── Rename symbol → Rope
├── Move top-level symbol to another module → Rope
├── Unnest closures / structural refactor → LibCST codemod
├── Analyze captures / dependencies → LibCST CSTVisitor or ast
├── Testing → pytest + fixtures + mocks
└── Performance issue → profile first, then optimize
```

### Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| `pip install` | `uv add` |
| `black` + `isort` | `ruff format` |
| `mypy` (slow, strict) | `pyright` (fast, standard mode) |
| Skip `--dry-run` | Always dry-run refactors |
| `# type: ignore` everywhere | Fix the types |
| Optimize without profiling | Profile first |
| Deep inheritance | Composition |
| Validate late | Fail fast at boundaries |
| Premature abstraction | Rule of Three |
| Manual find-replace across files | Rope rename/move |
| Hand-edit imports after moves | Let Rope rewrite them (then fix fully-qualified → relative) |
| Write custom `ast` script | Use LibCST (preserves formatting, has visitors) |
| Assume closures need params | Check if framework provides the value (e.g., `message.bot`) |
| Use `refac` with relative imports | Use Rope instead (refac crashes on relative imports) |

---

## Resources

- **uv:** https://docs.astral.sh/uv/
- **ruff:** https://docs.astral.sh/ruff/
- **pyright:** https://github.com/microsoft/pyright
- **pytest:** https://docs.pytest.org/
- **Pydantic:** https://docs.pydantic.dev/
- **LibCST:** https://libcst.readthedocs.io/ (codemods, visitors, transformers)
- **Rope:** https://github.com/python-rope/rope (move, rename, extract)
- **MonkeyType:** https://github.com/Instagram/MonkeyType (runtime type generation)
