---
name: python
description: "Modern Python: Astral stack (uv, ruff, ty), testing patterns, design principles, type safety, error handling, performance. Complete Python development workflow."
---

# Python Development

## Part 1: Astral Stack + Tooling

### The Stack

| Tool | Purpose | Speed |
|------|---------|-------|
| **uv** | Package manager | 10-100x pip |
| **ruff** | Linter + formatter | 10-100x flake8/black |
| **ty** | Type checker | 60-100x mypy |
| **rope-refactor** | AST refactoring | N/A |

```bash
# Install
uv tool install ruff ty
uv pip install python-rope-refactor
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
ty check src/               # Fast (dev)
pyright src/                # Thorough (CI)

# Refactoring (always dry-run first!)
rope-refactor rename --path . --file src/user.py --symbol User --new-name Account --dry-run
rope-refactor rename --path . --file src/user.py --symbol User --new-name Account --apply
```

### pyproject.toml Template

```toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.11"

[tool.uv]
dev-dependencies = ["pytest>=8.0", "pytest-cov>=4.0"]

[tool.ruff]
target-version = "py311"
line-length = 88

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "C4", "UP", "SIM", "PTH", "ERA", "PL", "RUF"]
ignore = ["PLR0913", "PLR2004"]

[tool.ruff.lint.isort]
force-single-line = true

[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.11"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"
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

### Decision Tree

```
Python task?
├── Package management → uv
├── Linting/imports → ruff check
├── Formatting → ruff format
├── Type checking → ty (dev) / pyright (CI)
├── Refactoring (multi-file) → rope-refactor
├── Testing → pytest + fixtures + mocks
└── Performance issue → profile first, then optimize
```

### Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| `pip install` | `uv add` |
| `black` + `isort` | `ruff format` |
| `mypy` for dev | `ty` (60x faster) |
| Skip `--dry-run` | Always dry-run refactors |
| `# type: ignore` everywhere | Fix the types |
| Optimize without profiling | Profile first |
| Deep inheritance | Composition |
| Validate late | Fail fast at boundaries |
| Premature abstraction | Rule of Three |

---

## Resources

- **uv:** https://docs.astral.sh/uv/
- **ruff:** https://docs.astral.sh/ruff/
- **ty:** https://github.com/astral-sh/ty
- **pytest:** https://docs.pytest.org/
- **Pydantic:** https://docs.pydantic.dev/
