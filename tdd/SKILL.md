---
name: tdd
description: Test-Driven Development discipline. RED-GREEN-REFACTOR cycle enforcement. Use when writing new features or fixing bugs.
---

# TDD Discipline

Write the test. Watch it fail. Write minimal code. Watch it pass. Repeat.

## The Cycle

```
RED → GREEN → REFACTOR → commit
```

1. **RED**: Write one test. Run it. Watch it FAIL (not error—fail because feature is missing).
2. **GREEN**: Write simplest code to pass. Just enough. No more.
3. **REFACTOR**: Clean up while tests green. Then commit.

## Rules

- **No production code without a failing test first**
- Wrote code before the test? Delete it. Start over.
- If you didn't watch the test fail, you don't know if it tests the right thing.

## When to Skip

- Throwaway prototypes (that you'll actually throw away)
- Generated code
- Config files

Thinking "skip TDD just this once"? That's rationalization. Stop.

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Test mocks instead of real code | Test real code |
| `test_retry_works` | `retries_failed_operations_3_times` |
| Multiple behaviors in one test | One behavior per test |
| Keep "reference code" after deleting untested code | Delete all untested code |

## Examples

### Good Test Name

```python
def test_transfer_fails_when_insufficient_balance():
    ...
```

### Bad Test Name

```python
def test_transfer():  # What about transfer?
    ...
```

### Minimal Green

```python
# RED: test expects add(2, 3) == 5

# GREEN (wrong - too much):
def add(a, b):
    if not isinstance(a, (int, float)):
        raise TypeError("...")
    return a + b

# GREEN (right - just enough):
def add(a, b):
    return a + b
```
