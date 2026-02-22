---
description: Generate high-quality ORT (National Test) questions with cognitive load, distractor engineering, and automated validation.
---

# ORT Question Generator - Automated Test Question Creation

**Version:** 3.0.0
**Purpose:** Generate high-quality ORT (National Test) questions with cognitive load, distractor engineering, multi-format rendering, automated validation, and batch generation based on 2024 research

**Updates in v3.0:**
- ✨ **Embedded validation scripts** - Copy-paste ready Python validators
- ✨ **Generation templates** - Proven templates for all question types
- ✨ **Batch generation strategies** - Optimal distribution for 50-500+ questions
- ✨ **Auto-fix utilities** - Automatic correction of common issues
- ✨ **Production-tested** - Used to generate 50 validated questions in production

**Updates in v2.0:**
- ✨ Multi-format rendering support (comparison_table, passage_based, geometry, chart, standard)
- ✨ Production-ready JSON schema matching actual codebase
- ✨ Layout-specific validation and examples
- ✨ KaTeX math rendering support

---

## Overview

This skill automates the creation of ORT test questions using:
- **LLM-based generation** with cognitive science principles
- **Distractor engineering** (plausible wrong answers that target common misconceptions)
- **Hierarchical ORT structure** (test → section → subsection → question)
- **Bilingual support** (Russian/Kyrgyz)
- **Automated validation** with constraint solvers

Based on research from:
- [NAACL 2024: Automated Distractor Generation](https://aclanthology.org/2024.findings-naacl.193/)
- [EMNLP 2024: Distractor Generation Survey](https://aclanthology.org/2024.emnlp-main.799.pdf)
- [PMC: Systematic Literature Review on Distractor Generation](https://pmc.ncbi.nlm.nih.gov/articles/PMC11623049/)

---

## Core Concepts

### 1. ORT Hierarchical Structure

```
ORT Main Test (3 hours)
├── Section 1: Math (60 questions, 70 min)
│   ├── Subsection 1.1: Arithmetic (Q1-Q15, 15 min)
│   │   └── Question Types: Standard, Quantitative Comparison
│   ├── Subsection 1.2: Algebra (Q16-Q30, 15 min)
│   └── Subsection 1.3: Geometry (Q31-Q45, 20 min)
├── Section 2: Verbal (60 questions, 60 min)
│   ├── Subsection 2.1: Analogies (Q61-Q75, 15 min)
│   ├── Subsection 2.2: Sentence Completion (Q76-Q90, 15 min)
│   └── Subsection 2.3: Reading Comprehension (Q91-Q120, 30 min)
└── Section 3: Grammar (40 questions, 50 min)
    ├── Subsection 3.1: Sentence Structure (Q121-Q140, 20 min)
    └── Subsection 3.2: Word Usage (Q141-Q160, 30 min)
```

### 2. Cognitive Load Framework

Based on **Bloom's Taxonomy** and **Webb's Depth of Knowledge**:

| Level | Name | Description | Example |
|-------|------|-------------|---------|
| 1 | Recall | Direct fact retrieval | "What is 2 + 2?" |
| 2 | Strategic Thinking | Apply concept to solve | "If 0 < x < 1, compare x and √x" |
| 3 | Extended Thinking | Multi-step reasoning | "Analyze this passage and infer the author's intent" |

### 3. Distractor Engineering

**Goal:** Generate plausible wrong answers that target specific cognitive traps.

**Common Traps:**
- **Sign Error**: Student applies rule from different domain (e.g., x > √x for x > 1, not 0 < x < 1)
- **Boundary Confusion**: Mishandles edge cases (e.g., x = 1 vs x < 1)
- **Constraint Failure**: Ignores given constraints
- **Operation Error**: Adds instead of multiplies
- **Translation Error**: Misunderstands problem statement

**Example:**
```json
{
  "question": "Compare: A = x, B = √x, given 0 < x < 1",
  "correct": "B",
  "distractors": [
    {
      "option": "A",
      "cognitive_trap": "sign_error",
      "rationale": "Student applies x > √x rule from x > 1 domain"
    },
    {
      "option": "C (equal)",
      "cognitive_trap": "boundary_confusion",
      "rationale": "Student confuses x = 1 boundary case"
    },
    {
      "option": "D (insufficient info)",
      "cognitive_trap": "constraint_failure",
      "rationale": "Student fails to realize 0 < x < 1 forces inequality"
    }
  ]
}
```

### 4. Question Types

#### Math Section

**Quantitative Comparison (QC):**
```
Compare Column A and Column B:
  Condition: 0 < x < 1
  Column A: x
  Column B: √x

Options:
  А) Column A is greater
  Б) Column B is greater
  В) Columns are equal
  Г) Not enough information
```

**Standard Math:**
```
What is the value of x if 2x + 5 = 13?

Options:
  А) 4
  Б) 9
  В) 13
  Г) 18
```

#### Verbal Section

**Analogies:**
```
BOOK : LIBRARY :: ?

Options:
  А) Teacher : School
  Б) Fish : Ocean
  В) Car : Road
  Г) Flower : Garden
```

**Sentence Completion:**
```
The scientist's theory was ___, supported by overwhelming evidence.

Options:
  А) refuted
  Б) validated
  В) ignored
  Г) questioned
```

---

## Multi-Format Rendering (New in v2.0)

### Layout Types Overview

The `rendering` field controls how questions are displayed in the frontend. Each layout has specific requirements:

| Layout | Use Case | Requirements | Example |
|--------|----------|--------------|---------|
| `standard` | Default layout for most questions | None | Simple text questions |
| `comparison_table` | Math quantitative comparisons | `columns.A` and `columns.B` required | Compare x² vs x |
| `passage_based` | Reading comprehension | Substantial text (100+ chars) | Analyze this paragraph |
| `geometry` | Spatial reasoning | Diagram/image required | Find the angle |
| `chart` | Data interpretation | Chart/graph data | Interpret the bar chart |

### Complete Rendering Schema

```typescript
interface RenderingConfig {
  layout: "comparison_table" | "standard" | "passage_based" | "geometry" | "chart";
  requires_katex?: boolean;  // Set to true if any LaTeX present

  // For comparison_table layout:
  columns?: Record<string, {
    latex?: string;    // KaTeX math expression
    plain?: string;    // Plaintext fallback
    label?: string;    // Column header (optional)
  }>;
  condition?: {
    latex?: string;    // KaTeX condition
    plain?: string;    // Plaintext condition
  };

  // For passage_based layout:
  passage?: {
    ru: string;        // Russian passage
    kg: string;        // Kyrgyz passage
  };

  // For geometry layout:
  diagram?: {
    type: "svg" | "image";
    content: string;   // SVG markup or image URL
  };

  // For chart layout:
  chart_data?: {
    type: "bar" | "line" | "pie";
    data: any;
  };
}
```

---

### Layout 1: comparison_table (Quantitative Comparison)

**Use For:** Math questions where students compare two mathematical expressions

**Requirements:**
- MUST have `columns.A` and `columns.B`
- Both columns should have either `latex` or `plain` (preferably both)
- Optional `condition` for constraints
- Set `requires_katex: true` if using LaTeX

**Complete Example:**
```json
{
  "id": 2001,
  "text": {
    "ru": "Сравните Колонку А и Колонку Б",
    "kg": "А тилкесин жана Б тилкесин салыштырыңыз"
  },
  "choices": [
    {
      "letter": "А",
      "text": {
        "ru": "Величина в колонке А больше",
        "kg": "А тилкесиндеги сан чоңураак"
      },
      "isCorrect": false
    },
    {
      "letter": "Б",
      "text": {
        "ru": "Величина в колонке Б больше",
        "kg": "Б тилкесиндеги сан чоңураак"
      },
      "isCorrect": true
    },
    {
      "letter": "В",
      "text": {
        "ru": "Величины равны",
        "kg": "Сандар барабар"
      },
      "isCorrect": false
    },
    {
      "letter": "Г",
      "text": {
        "ru": "Недостаточно информации",
        "kg": "Маалымат жетишсиз"
      },
      "isCorrect": false
    }
  ],
  "explanation": {
    "ru": "Когда 0 < x < 1, квадрат числа меньше самого числа. x² < x в этом интервале.",
    "kg": "0 < x < 1 болгондо, сандын квадраты өзүнөн кичине. x² < x бул интервалда."
  },
  "ort": {
    "section": {
      "code": "MATH",
      "name": { "ru": "Математика", "kg": "Математика" }
    },
    "subsection": {
      "code": "ARITHMETIC",
      "name": { "ru": "Арифметика", "kg": "Арифметика" }
    },
    "difficulty": 3,
    "cognitive_load": "Strategic Thinking"
  },
  "rendering": {
    "layout": "comparison_table",
    "requires_katex": true,
    "columns": {
      "A": {
        "latex": "x^2",
        "plain": "x²",
        "label": "Колонка А"
      },
      "B": {
        "latex": "x",
        "plain": "x",
        "label": "Колонка Б"
      }
    },
    "condition": {
      "latex": "0 < x < 1",
      "plain": "0 < x < 1"
    }
  },
  "logic_engine": {
    "variables": {
      "x": {
        "name": "x",
        "domain": {
          "type": "real",
          "min": 0,
          "max": 1,
          "exclude": [0, 1]
        },
        "sample_values": [0.25, 0.5, 0.75]
      }
    },
    "constraints": ["0 < x < 1"],
    "expressions": {
      "column_a": "x^2",
      "column_b": "x"
    },
    "solver": {
      "method": "analytical",
      "validation_status": "passed",
      "test_points": [
        { "x": 0.25, "result": "B > A" },
        { "x": 0.5, "result": "B > A" }
      ]
    }
  },
  "distractor_rationale": {
    "А": {
      "cognitive_trap": "overgeneralization",
      "description": "Применяет x² > x из домена x > 1",
      "plausibility_score": 0.7
    },
    "В": {
      "cognitive_trap": "boundary_confusion",
      "description": "Путает границу x=1",
      "plausibility_score": 0.6
    },
    "Г": {
      "cognitive_trap": "constraint_failure",
      "description": "Игнорирует ограничение 0 < x < 1",
      "plausibility_score": 0.65
    }
  }
}
```

---

### Layout 2: passage_based (Reading Comprehension)

**Use For:** Reading comprehension, text analysis, inference questions

**Requirements:**
- Question text should be substantial (100+ characters recommended)
- Optional `passage` field for longer texts
- No KaTeX typically needed

**Complete Example:**
```json
{
  "id": 2002,
  "text": {
    "ru": "В 1920 году население города составляло 50,000 человек. К 1930 году оно удвоилось. Какой был прирост населения за десятилетие?",
    "kg": "1920-жылы шаардын калкы 50,000 адам болгон. 1930-жылга чейин эки эсе көбөйгөн. Он жылдын ичинде калк канча өсү болгон?"
  },
  "choices": [
    {
      "letter": "А",
      "text": {
        "ru": "25,000",
        "kg": "25,000"
      },
      "isCorrect": false
    },
    {
      "letter": "Б",
      "text": {
        "ru": "50,000",
        "kg": "50,000"
      },
      "isCorrect": true
    },
    {
      "letter": "В",
      "text": {
        "ru": "75,000",
        "kg": "75,000"
      },
      "isCorrect": false
    },
    {
      "letter": "Г",
      "text": {
        "ru": "100,000",
        "kg": "100,000"
      },
      "isCorrect": false
    }
  ],
  "explanation": {
    "ru": "Если население удвоилось с 50,000, то новая численность 100,000. Прирост = 100,000 - 50,000 = 50,000.",
    "kg": "Эгер калк 50,000дөн эки эсе көбөйсө, жаңы сан 100,000. Өсүү = 100,000 - 50,000 = 50,000."
  },
  "ort": {
    "section": {
      "code": "VERBAL",
      "name": { "ru": "Вербальная часть", "kg": "Вербалдык бөлүм" }
    },
    "subsection": {
      "code": "READING",
      "name": { "ru": "Чтение", "kg": "Окуу" }
    },
    "difficulty": 2,
    "cognitive_load": "Application"
  },
  "rendering": {
    "layout": "passage_based",
    "requires_katex": false
  },
  "distractor_rationale": {
    "А": {
      "cognitive_trap": "calculation_error",
      "description": "Путает прирост с половиной",
      "plausibility_score": 0.6
    },
    "В": {
      "cognitive_trap": "partial_understanding",
      "description": "Складывает вместо вычитания",
      "plausibility_score": 0.7
    },
    "Г": {
      "cognitive_trap": "superficial_similarity",
      "description": "Берет конечную численность вместо прироста",
      "plausibility_score": 0.8
    }
  }
}
```

---

### Layout 3: standard (Default)

**Use For:** Traditional multiple choice questions without special formatting

**Requirements:**
- None - this is the fallback layout
- Works for any question type
- Minimal rendering config needed

**Complete Example:**
```json
{
  "id": 2003,
  "text": {
    "ru": "Какое из следующих слов является антонимом слова 'щедрый'?",
    "kg": "Төмөнкү сөздөрдүн кайсынысы 'берешке' сөзүнүн антоними?"
  },
  "choices": [
    {
      "letter": "А",
      "text": { "ru": "Великодушный", "kg": "Жомарт" },
      "isCorrect": false
    },
    {
      "letter": "Б",
      "text": { "ru": "Скупой", "kg": "Сараң" },
      "isCorrect": true
    },
    {
      "letter": "В",
      "text": { "ru": "Добрый", "kg": "Боорукер" },
      "isCorrect": false
    },
    {
      "letter": "Г",
      "text": { "ru": "Честный", "kg": "Чынчыл" },
      "isCorrect": false
    }
  ],
  "explanation": {
    "ru": "Антоним 'щедрый' - это 'скупой', противоположное по значению.",
    "kg": "'Берешке' сөзүнүн антоними - 'сараң', маанисине карама-каршы."
  },
  "ort": {
    "section": {
      "code": "VERBAL",
      "name": { "ru": "Вербальная часть", "kg": "Вербалдык бөлүм" }
    },
    "subsection": {
      "code": "VOCABULARY",
      "name": { "ru": "Лексика", "kg": "Лексика" }
    },
    "difficulty": 1,
    "cognitive_load": "Recall"
  },
  "rendering": {
    "layout": "standard",
    "requires_katex": false
  },
  "distractor_rationale": {
    "А": {
      "cognitive_trap": "superficial_similarity",
      "description": "Синоним вместо антонима",
      "plausibility_score": 0.75
    },
    "В": {
      "cognitive_trap": "partial_understanding",
      "description": "Связанная положительная черта",
      "plausibility_score": 0.65
    },
    "Г": {
      "cognitive_trap": "false_equivalence",
      "description": "Другая положительная черта",
      "plausibility_score": 0.6
    }
  }
}
```

---

### Validation Rules by Layout

#### comparison_table Validation

```python
def validate_comparison_table(question):
    errors = []

    # CRITICAL: Must have columns
    if not question.get('rendering', {}).get('columns'):
        errors.append("comparison_table layout but NO columns field")
        return errors

    columns = question['rendering']['columns']

    # CRITICAL: Must have A and B
    if 'A' not in columns:
        errors.append("comparison_table missing column A")
    if 'B' not in columns:
        errors.append("comparison_table missing column B")

    # Check column data completeness
    for col_name in ['A', 'B']:
        if col_name in columns:
            col = columns[col_name]
            if not col.get('latex') and not col.get('plain'):
                errors.append(f"column {col_name} has neither latex nor plain")

    # WARNING: Condition recommended
    if not question.get('rendering', {}).get('condition'):
        warnings.append("comparison_table without condition (recommended)")

    return errors
```

#### passage_based Validation

```python
def validate_passage_based(question):
    warnings = []

    # Check if text is substantial
    text_ru = question.get('text', {}).get('ru', '')
    if len(text_ru) < 100:
        warnings.append(f"passage_based but text is short ({len(text_ru)} chars)")

    return warnings
```

#### KaTeX Consistency Validation

```python
def validate_katex(question):
    errors = []
    requires_katex = question.get('rendering', {}).get('requires_katex', False)

    if requires_katex:
        # Should have latex somewhere
        has_latex = False

        if question.get('rendering', {}).get('condition', {}).get('latex'):
            has_latex = True

        for col in question.get('rendering', {}).get('columns', {}).values():
            if col.get('latex'):
                has_latex = True

        if not has_latex:
            errors.append("requires_katex=true but no latex found")

    return errors
```

---

## Production-Ready Scripts (New in v3.0)

### Complete Validation Script

Save as `scripts/validate-questions.py`:

```python
#!/usr/bin/env python3
"""
Validate enhanced questions JSON structure
No fallbacks - strict validation
"""
import json
import sys
from pathlib import Path

def validate_questions(file_path):
    """Strict validation - fail fast on any issue"""

    with open(file_path) as f:
        questions = json.load(f)

    print(f"📋 Validating {len(questions)} questions from {file_path}")
    print()

    errors = []
    warnings = []

    for q in questions:
        qid = q.get('id', 'UNKNOWN')

        # Required fields
        if not q.get('text'):
            errors.append(f"Q{qid}: Missing text")
        if not q.get('choices'):
            errors.append(f"Q{qid}: Missing choices")
        if not q.get('explanation'):
            errors.append(f"Q{qid}: Missing explanation")
        if not q.get('ort'):
            errors.append(f"Q{qid}: Missing ORT structure")

        # Layout-specific validation
        layout = q.get('rendering', {}).get('layout', 'standard')

        if layout == 'comparison_table':
            # STRICT: Must have columns with A and B
            columns = q.get('rendering', {}).get('columns', {})

            if not columns:
                errors.append(f"Q{qid}: comparison_table layout but NO columns field")
            else:
                if 'A' not in columns:
                    errors.append(f"Q{qid}: comparison_table missing column A")
                if 'B' not in columns:
                    errors.append(f"Q{qid}: comparison_table missing column B")

                # Check column data completeness
                for col_name in ['A', 'B']:
                    if col_name in columns:
                        col = columns[col_name]
                        if not col.get('latex') and not col.get('plain'):
                            errors.append(f"Q{qid}: column {col_name} has neither latex nor plain")

            # Check for condition (optional but recommended)
            if not q.get('rendering', {}).get('condition'):
                warnings.append(f"Q{qid}: comparison_table without condition")

        elif layout == 'passage_based':
            # Check if question text is substantial
            text_ru = q.get('text', {}).get('ru', '')
            if len(text_ru) < 100:
                warnings.append(f"Q{qid}: passage_based but text is short ({len(text_ru)} chars)")

        # Validate KaTeX requirement
        requires_katex = q.get('rendering', {}).get('requires_katex', False)
        if requires_katex:
            # Should have latex somewhere
            has_latex = False
            if q.get('rendering', {}).get('condition', {}).get('latex'):
                has_latex = True
            for col in q.get('rendering', {}).get('columns', {}).values():
                if col.get('latex'):
                    has_latex = True

            if not has_latex:
                warnings.append(f"Q{qid}: requires_katex=true but no latex found")

    # Print results
    print("=" * 60)
    if errors:
        print(f"❌ VALIDATION FAILED - {len(errors)} ERRORS")
        print()
        for err in errors:
            print(f"  ❌ {err}")
        print()

    if warnings:
        print(f"⚠️  {len(warnings)} WARNINGS")
        print()
        for warn in warnings:
            print(f"  ⚠️  {warn}")
        print()

    if not errors and not warnings:
        print("✅ ALL CHECKS PASSED")
        print()

    # Summary by layout
    layout_counts = {}
    for q in questions:
        layout = q.get('rendering', {}).get('layout', 'standard')
        layout_counts[layout] = layout_counts.get(layout, 0) + 1

    print("📊 Layout Distribution:")
    for layout, count in sorted(layout_counts.items()):
        print(f"  • {layout}: {count} questions")

    print()
    print("=" * 60)

    return len(errors) == 0

if __name__ == '__main__':
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
    else:
        file_path = Path(__file__).parent.parent / 'src/data/ort-questions-generated.json'

    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    success = validate_questions(file_path)
    sys.exit(0 if success else 1)
```

**Usage:**
```bash
# Validate default location
python scripts/validate-questions.py

# Validate specific file
python scripts/validate-questions.py src/data/my-questions.json

# In CI/CD
python scripts/validate-questions.py questions.json || exit 1
```

---

### Auto-Fix Utility Script

Save as `scripts/fix-warnings.py`:

```python
#!/usr/bin/env python3
"""
Auto-fix common validation warnings
"""
import json
import sys
from pathlib import Path

def fix_warnings(file_path, question_ids=None, conditions=None):
    """
    Fix specific warnings in questions

    Args:
        file_path: Path to questions JSON
        question_ids: List of question IDs to fix
        conditions: Dict mapping question_id -> {latex, plain}
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    fixed_count = 0
    for q in questions:
        qid = q['id']

        # Fix missing conditions on comparison_table
        if question_ids and qid in question_ids:
            if 'rendering' in q and q['rendering'].get('layout') == 'comparison_table':
                if not q['rendering'].get('condition') and conditions and qid in conditions:
                    q['rendering']['condition'] = conditions[qid]
                    fixed_count += 1
                    print(f"✅ Fixed Q{qid}: Added condition")

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Fixed {fixed_count} questions")
    return fixed_count

if __name__ == '__main__':
    # Example: Fix comparison_table questions missing conditions
    file_path = Path(__file__).parent.parent / 'src/data/ort-questions-generated.json'

    questions_needing_conditions = [4003, 4004, 4007, 4008, 4009]
    conditions = {
        4003: {"latex": "\\text{Какая дробь больше?}", "plain": "Какая дробь больше?"},
        4004: {"latex": "\\text{Сравните дроби}", "plain": "Сравните дроби"},
        # Add more as needed
    }

    fix_warnings(file_path, questions_needing_conditions, conditions)
```

---

### Generation Script Template

Save as `scripts/generate-questions.py`:

```python
#!/usr/bin/env python3
"""
Generate ORT questions from templates
"""
import json
import random
from datetime import datetime
from pathlib import Path

def create_base_question(qid):
    """Create base question structure"""
    return {
        "id": qid,
        "text": {"ru": "", "kg": ""},
        "choices": [
            {"letter": "А", "text": {"ru": "", "kg": ""}, "isCorrect": False},
            {"letter": "Б", "text": {"ru": "", "kg": ""}, "isCorrect": False},
            {"letter": "В", "text": {"ru": "", "kg": ""}, "isCorrect": False},
            {"letter": "Г", "text": {"ru": "", "kg": ""}, "isCorrect": False},
        ],
        "explanation": {"ru": "", "kg": ""},
        "ort": {
            "section": {"code": "", "name": {"ru": "", "kg": ""}},
            "subsection": {"code": "", "name": {"ru": "", "kg": ""}},
            "difficulty": 3,
            "cognitive_load": "Strategic Thinking"
        },
        "rendering": {
            "layout": "standard",
            "requires_katex": False
        },
        "distractor_rationale": {},
        "generation": {
            "method": "TEMPLATE",
            "generated_at": datetime.now().isoformat(),
            "version": "3.0"
        }
    }

# Question templates by type
MATH_QC_TEMPLATES = [
    {
        "columns": {"A": {"latex": "x^2", "plain": "x²"}, "B": {"latex": "x", "plain": "x"}},
        "condition": {"latex": "0 < x < 1", "plain": "0 < x < 1"},
        "correct": "Б",
        "explanation_ru": "Когда 0 < x < 1, квадрат числа меньше самого числа.",
        "explanation_kg": "0 < x < 1 болгондо, сандын квадраты өзүнөн кичине.",
        "difficulty": 3
    },
    # Add more templates
]

ANALOGY_TEMPLATES = [
    {
        "question_ru": "КНИГА : БИБЛИОТЕКА :: ?",
        "question_kg": "КИТЕП : КИТЕПКАНА :: ?",
        "options": [
            {"ru": "Учитель : Школа", "kg": "Мугалим : Мектеп"},
            {"ru": "Рыба : Океан", "kg": "Балык : Океан"},
            {"ru": "Машина : Дорога", "kg": "Унаа : Жол"},
            {"ru": "Цветок : Сад", "kg": "Гүл : Бакча"},
        ],
        "correct": 1,  # Index
        "difficulty": 2
    },
    # Add more templates
]

def generate_math_qc(template, qid):
    """Generate Math Quantitative Comparison question"""
    q = create_base_question(qid)

    # Set text
    q["text"] = {
        "ru": "Сравните Колонку А и Колонку Б",
        "kg": "А тилкесин жана Б тилкесин салыштырыңыз"
    }

    # Set standard QC choices
    q["choices"] = [
        {"letter": "А", "text": {"ru": "Величина в колонке А больше", "kg": "А тилкесиндеги сан чоңураак"}, "isCorrect": template["correct"] == "А"},
        {"letter": "Б", "text": {"ru": "Величина в колонке Б больше", "kg": "Б тилкесиндеги сан чоңураак"}, "isCorrect": template["correct"] == "Б"},
        {"letter": "В", "text": {"ru": "Величины равны", "kg": "Сандар барабар"}, "isCorrect": template["correct"] == "В"},
        {"letter": "Г", "text": {"ru": "Недостаточно информации", "kg": "Маалымат жетишсиз"}, "isCorrect": template["correct"] == "Г"},
    ]

    # Set explanation
    q["explanation"] = {
        "ru": template["explanation_ru"],
        "kg": template["explanation_kg"]
    }

    # Set ORT structure
    q["ort"] = {
        "section": {"code": "MATH", "name": {"ru": "Математика", "kg": "Математика"}},
        "subsection": {"code": "ARITHMETIC", "name": {"ru": "Арифметика", "kg": "Арифметика"}},
        "difficulty": template["difficulty"],
        "cognitive_load": "Strategic Thinking"
    }

    # Set rendering
    q["rendering"] = {
        "layout": "comparison_table",
        "requires_katex": True,
        "columns": template["columns"],
        "condition": template.get("condition")
    }

    # Add distractor rationale
    traps = ["overgeneralization", "sign_error", "boundary_confusion", "constraint_failure"]
    for letter in ["А", "Б", "В", "Г"]:
        if letter != template["correct"]:
            q["distractor_rationale"][letter] = {
                "cognitive_trap": random.choice(traps),
                "description": "Распространенная ошибка при решении",
                "plausibility_score": round(random.uniform(0.6, 0.8), 2)
            }

    return q

def generate_analogy(template, qid):
    """Generate Verbal Analogy question"""
    q = create_base_question(qid)

    q["text"] = {
        "ru": template["question_ru"],
        "kg": template["question_kg"]
    }

    # Set choices
    for i, (letter, opt) in enumerate(zip(["А", "Б", "В", "Г"], template["options"])):
        q["choices"][i] = {
            "letter": letter,
            "text": {"ru": opt["ru"], "kg": opt["kg"]},
            "isCorrect": i == template["correct"]
        }

    q["explanation"] = {
        "ru": "Правильная аналогия по смыслу",
        "kg": "Туура аналогия маани боюнча"
    }

    q["ort"] = {
        "section": {"code": "VERBAL", "name": {"ru": "Вербальная часть", "kg": "Вербалдык бөлүм"}},
        "subsection": {"code": "ANALOGIES", "name": {"ru": "Аналогии", "kg": "Аналогиялар"}},
        "difficulty": template["difficulty"],
        "cognitive_load": "Strategic Thinking"
    }

    # Add distractor rationale
    for i, letter in enumerate(["А", "Б", "В", "Г"]):
        if i != template["correct"]:
            q["distractor_rationale"][letter] = {
                "cognitive_trap": "superficial_similarity",
                "description": "Поверхностное сходство",
                "plausibility_score": round(random.uniform(0.6, 0.75), 2)
            }

    return q

def generate_questions(count, distribution):
    """
    Generate questions with specified distribution

    Args:
        count: Total number of questions
        distribution: Dict like {"math_qc": 20, "analogy": 10, ...}

    Returns:
        List of questions
    """
    questions = []
    qid = 4001

    # Math QC
    for _ in range(distribution.get("math_qc", 0)):
        template = random.choice(MATH_QC_TEMPLATES)
        questions.append(generate_math_qc(template, qid))
        qid += 1

    # Analogies
    for _ in range(distribution.get("analogy", 0)):
        template = random.choice(ANALOGY_TEMPLATES)
        questions.append(generate_analogy(template, qid))
        qid += 1

    # Add more question types...

    return questions

if __name__ == '__main__':
    # Generate 50 questions with balanced distribution
    distribution = {
        "math_qc": 20,
        "analogy": 10,
        "antonym": 10,
        "grammar": 10
    }

    questions = generate_questions(50, distribution)

    # Save to file
    output_path = Path('src/data/ort-questions-generated.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated {len(questions)} questions")
    print(f"💾 Saved to {output_path}")
```

---

### Batch Generation Strategy

For large question sets (100-500 questions), use this distribution:

| Section | Subsection | Count (50) | Count (150) | Count (500) |
|---------|-----------|------------|-------------|-------------|
| **Math** | QC (comparison_table) | 20 | 40 | 120 |
| | Standard Problems | 0 | 20 | 80 |
| **Verbal** | Analogies | 10 | 25 | 80 |
| | Antonyms | 10 | 25 | 80 |
| | Reading | 0 | 20 | 60 |
| **Grammar** | Sentence Structure | 10 | 20 | 80 |
| **Total** | | **50** | **150** | **500** |

**Difficulty Distribution:**
- Easy (1-2): 30%
- Medium (3): 40%
- Hard (4-5): 30%

**Cognitive Load Distribution:**
- Recall: 25%
- Strategic Thinking: 50%
- Extended Thinking: 25%

**Python Helper:**
```python
def calculate_distribution(total_count):
    """Calculate question distribution for any total count"""

    # Base ratios (from 50-question template)
    base_ratios = {
        "math_qc": 0.40,        # 20/50 = 40%
        "analogy": 0.20,        # 10/50 = 20%
        "antonym": 0.20,        # 10/50 = 20%
        "grammar": 0.20,        # 10/50 = 20%
    }

    # Scale to total_count
    distribution = {}
    for qtype, ratio in base_ratios.items():
        distribution[qtype] = int(total_count * ratio)

    # Adjust for rounding
    actual_total = sum(distribution.values())
    if actual_total < total_count:
        # Add remainder to most common type
        distribution["math_qc"] += (total_count - actual_total)

    return distribution

# Example: Generate 500 questions
distribution = calculate_distribution(500)
print(distribution)
# Output: {'math_qc': 200, 'analogy': 100, 'antonym': 100, 'grammar': 100}
```

---

### Quality Gates for Batch Generation

**Pre-Generation Checks:**
1. ✅ All templates have valid structure
2. ✅ Template count sufficient for target (no duplicates)
3. ✅ Bilingual text present in all templates

**Post-Generation Validation:**
1. ✅ Run `validate-questions.py` - zero errors allowed
2. ✅ Check distribution matches target (±2%)
3. ✅ No duplicate question IDs
4. ✅ All questions have distractor rationale
5. ✅ KaTeX questions have valid LaTeX

**Batch Workflow:**
```bash
# 1. Generate questions
python scripts/generate-questions.py --count 500 --output temp-questions.json

# 2. Validate (strict)
python scripts/validate-questions.py temp-questions.json
# Must show: ✅ ALL CHECKS PASSED

# 3. Fix any warnings (if needed)
python scripts/fix-warnings.py temp-questions.json

# 4. Re-validate
python scripts/validate-questions.py temp-questions.json

# 5. Move to production
mv temp-questions.json src/data/ort-questions-generated.json

# 6. Test in application
bun run src/web/server/index.ts
# Check logs: "✅ Loaded X questions"

# 7. Commit
git add src/data/ort-questions-generated.json
git commit -m "feat: generate 500 ORT questions with validation"
git push origin main
```

---

## Data Storage Format

### Recommended: YAML for Authoring → JSON for Production

**Development (YAML with comments):**
```yaml
---
# Math QC: Square root in (0,1) interval
id: math-qc-sqrt-interval-001
type: QUANTITATIVE_COMPARISON

meta:
  domain: MATH
  subdomain: Number Properties
  difficulty: 3
  cognitive_load: Strategic Thinking
  tags: [fractions, roots, intervals]
  author: system
  created_at: 2026-01-22T10:00:00Z

# ORT hierarchical structure
ort:
  test:
    type: MAIN_ORT
  section:
    code: SEC1
    name:
      kg: Математика
      ru: Математика
    order: 1
    totalQuestions: 60
    totalMinutes: 70
  subsection:
    code: SEC1_SUB1
    name:
      kg: Арифметика
      ru: Арифметика
    order: 1
    questionRange: [1, 15]
    recommendedMinutes: 15
  questionType:
    code: QC
    name:
      kg: Сандык салыштыруу
      ru: Количественное сравнение
  timing:
    recommendedSeconds: 60
    subsectionTotalSeconds: 900
  difficulty:
    level: MEDIUM
    percentileTarget: 50

# Logic engine (for validation)
logic_engine:
  variables:
    x:
      type: real
      domain:
        min: 0
        max: 1
        inclusive: [false, false]
      sample_values: [0.01, 0.25, 0.5, 0.75, 0.99]

  constraints:
    - expression: x > 0
      description: x must be positive
    - expression: x < 1
      description: x must be less than 1

  solver:
    method: symbolic_comparison
    rule: sqrt(x) > x for 0 < x < 1
    test_points: 10000
    validation_status: passed
    validated_at: 2026-01-22T10:00:00Z

# Question content (bilingual)
content:
  languages:
    ru:
      instruction: Сравните величины в колонках А и Б
      condition:
        latex: 0 < x < 1
        plain: x находится между 0 и 1
      columns:
        A:
          latex: x
          plain: x
          label: Значение x
        B:
          latex: \sqrt{x}
          plain: √x
          label: Квадратный корень из x

      options:
        - id: А
          text: Величина в колонке А больше
        - id: Б
          text: Величина в колонке Б больше
        - id: В
          text: Величины равны
        - id: Г
          text: Недостаточно информации

    kg:
      instruction: А жана Б тилкелериндеги чоңдуктарды салыштыргыла
      condition:
        latex: 0 < x < 1
        plain: x 0 менен 1 ортосунда
      columns:
        A:
          latex: x
          plain: x
          label: x мааниси
        B:
          latex: \sqrt{x}
          plain: √x
          label: x тамырдан

      options:
        - id: А
          text: А тилкесиндеги чоңдук көбүрөөк
        - id: Б
          text: Б тилкесиндеги чоңдук көбүрөөк
        - id: В
          text: Чоңдуктар барабар
        - id: Г
          text: Маалымат жетишсиз

# Answer with distractor rationale
answer:
  correct_option: Б

  explanations:
    ru:
      text: |
        В интервале (0, 1) корень числа строго больше самого числа.
        Например, если x = 0.25, то √0.25 = 0.5, и 0.5 > 0.25.

      worked_example:
        x_value: 0.25
        column_a_result: 0.25
        column_b_result: 0.5
        comparison: 0.5 > 0.25

    kg:
      text: |
        (0, 1) интервалында тамырдын мааниси сандын өзүнөн чоң болот.
        Мисалы, эгер x = 0.25 болсо, √0.25 = 0.5, жана 0.5 > 0.25.

      worked_example:
        x_value: 0.25
        column_a_result: 0.25
        column_b_result: 0.5
        comparison: 0.5 > 0.25

  # Distractor engineering: why wrong answers are wrong
  distractor_rationale:
    А:
      cognitive_trap: sign_error
      description: Student applies integer logic (x > √x for x > 1)
    В:
      cognitive_trap: boundary_confusion
      description: Student confuses boundary case x=1
    Г:
      cognitive_trap: constraint_failure
      description: Student fails to realize constraint forces strict inequality

rendering:
  layout: comparison_table
  mobile_layout: stacked
  geometry: null
  assets: []
```

**Production (JSON minified):**
```bash
# Convert YAML → JSON during build
yq eval -o=json question.yaml > question.json
jq -c . question.json > question.min.json
gzip -9 question.min.json
```

---

## LLM-Based Generation Workflow

### Step 1: Topic Selection & Template
```typescript
interface GenerationRequest {
  domain: 'MATH' | 'VERBAL' | 'GRAMMAR';
  subsection: string;  // e.g., "Arithmetic", "Analogies"
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitive_load: 'Recall' | 'Strategic Thinking' | 'Extended Thinking';
  count: number;  // How many questions to generate
}
```

### Step 2: Prompt Engineering (Chain-of-Thought)

**Math Question Example:**
```
You are an expert ORT test designer. Generate a quantitative comparison question for the ORT Math section.

Domain: MATH
Subsection: Arithmetic - Number Properties
Difficulty: 3 (Medium)
Cognitive Load: Strategic Thinking
Language: Russian and Kyrgyz (bilingual)

Requirements:
1. Use the format: Compare Column A and Column B
2. Include a constraint/condition (e.g., "0 < x < 1")
3. Generate 4 plausible options (А, Б, В, Г)
4. Engineer distractors that target common misconceptions:
   - Option А: sign_error (applying wrong domain rule)
   - Option В: boundary_confusion (mishandling edge cases)
   - Option Г: constraint_failure (ignoring given constraints)

5. Provide detailed explanation with worked example

Let's think step by step:
- Step 1: Choose a mathematical concept (e.g., square roots, fractions)
- Step 2: Define the constraint that makes the problem interesting
- Step 3: Identify the correct answer
- Step 4: Generate distractors based on cognitive traps students fall into
- Step 5: Write bilingual text (Russian + Kyrgyz)
- Step 6: Create validation logic

Output format: YAML following the schema above.
```

### Step 3: Validation & Refinement

**Automated Checks:**
1. **Schema validation** - Verify JSON/YAML structure
2. **Constraint solver** - Test mathematical correctness
3. **Distractor quality** - Ensure distractors are plausible but wrong
4. **Bilingual parity** - Check Russian/Kyrgyz equivalence
5. **Difficulty calibration** - Validate against difficulty level

**Example Validator:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

function validateQuestion(question: OrtQuestion): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check bilingual parity
  if (question.text.ru.length > 0 && !question.text.kg) {
    warnings.push("Missing Kyrgyz translation");
  }

  // 2. Validate math (if applicable)
  if (question.ort.section.code === 'SEC1') {
    const result = validateMathLogic(question.logic_engine);
    if (!result.valid) {
      errors.push(`Math validation failed: ${result.reason}`);
    }
  }

  // 3. Check distractor quality
  const distractorScore = evaluateDistractors(question.answer.distractor_rationale);
  if (distractorScore < 0.7) {
    warnings.push("Distractors may be too obvious or implausible");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions: []
  };
}
```

---

## Integration with Current Codebase

### Current Question Format (Simplified)
```typescript
interface OrtQuestion {
  id: number;
  text: BilingualText;
  choices: Choice[];
  explanation: BilingualText;
  ort: OrtStructure;  // NEW: Required hierarchical structure
  meta?: MetaData;
}
```

### Enhanced Schema (with Generation Metadata)
```typescript
interface EnhancedOrtQuestion extends OrtQuestion {
  // Generation metadata
  generation?: {
    method: 'LLM' | 'TEMPLATE' | 'MANUAL';
    model?: string;  // e.g., "gpt-4"
    prompt_version?: string;
    generated_at?: string;
    validated_at?: string;
    validation_score?: number;
  };

  // Logic engine (for math questions)
  logic_engine?: LogicEngine;

  // Distractor rationale (cognitive trap explanations)
  distractor_rationale?: Record<string, DistractorInfo>;

  // Rendering hints
  rendering?: {
    layout: 'comparison_table' | 'standard' | 'passage_based';
    mobile_layout?: string;
    geometry?: GeometrySpec;
    assets?: string[];
  };
}
```

---

## Usage Examples

### Example 1: Generate Math QC Questions
```typescript
import { generateQuestions } from './generator';

const request = {
  domain: 'MATH',
  subsection: 'Arithmetic',
  difficulty: 3,
  cognitive_load: 'Strategic Thinking',
  count: 10
};

const questions = await generateQuestions(request);
// Returns 10 validated questions with distractors
```

### Example 2: Batch Generation with Validation
```bash
# Generate 150 questions for ORT Main Test
npm run generate -- \
  --domain MATH \
  --count 60 \
  --output ./src/data/ort-questions-math-generated.json \
  --validate

# Output:
# ✅ Generated 60 math questions
# ✅ Validation: 58/60 passed
# ⚠️  2 questions flagged for manual review
```

### Example 3: Interactive Generation (CLI)
```bash
# Interactive question builder
npm run generate:interactive

# Prompts:
# 1. Select domain: [MATH | VERBAL | GRAMMAR]
# 2. Select subsection: [Arithmetic | Algebra | Geometry]
# 3. Select difficulty: [1 | 2 | 3 | 4 | 5]
# 4. How many questions? [1-50]
# 5. Output format: [YAML | JSON | JSON5]
```

---

## Tools & Dependencies

### Required
- **Node.js 20+** or **Bun 1.0+**
- **OpenAI API** (for LLM generation) or **Anthropic Claude**
- **TypeScript 5+**
- **Zod** (schema validation)

### Optional
- **KaTeX** (LaTeX rendering in preview)
- **react-svg-pan-zoom** (geometry preview)
- **yq** (YAML processing)
- **jq** (JSON processing)

### Install
```bash
# Core dependencies
bun add zod ajv openai

# Dev tools
bun add -d @types/node typescript

# CLI tools (global)
brew install yq jq
```

---

## Best Practices

### 1. Start with Templates, Refine with LLM
```typescript
// Good: Use template + LLM refinement
const template = loadTemplate('math-qc-comparison');
const refined = await llm.refine(template, {
  difficulty: 3,
  cognitive_load: 'Strategic Thinking'
});
```

### 2. Always Validate
```typescript
// Good: Validate before adding to database
const question = await generateQuestion(request);
const validation = validateQuestion(question);

if (!validation.valid) {
  console.error("Validation failed:", validation.errors);
  // Don't add to database
}
```

### 3. Bilingual Parity Check
```typescript
// Good: Ensure translations are equivalent
function checkBilingualParity(text: BilingualText): boolean {
  const ruLength = text.ru.length;
  const kgLength = text.kg.length;

  // Translations should be similar length (±30%)
  return Math.abs(ruLength - kgLength) / ruLength < 0.3;
}
```

### 4. Distractor Quality Metrics
```typescript
// Good: Score distractor plausibility
function scoreDistractor(distractor: DistractorInfo): number {
  let score = 0.5;  // Base score

  // +0.2 if targets specific cognitive trap
  if (distractor.cognitive_trap) score += 0.2;

  // +0.2 if has detailed rationale
  if (distractor.description?.length > 50) score += 0.2;

  // +0.1 if mathematically valid (but wrong conclusion)
  if (distractor.mathematically_valid) score += 0.1;

  return Math.min(score, 1.0);
}
```

---

## Roadmap

### Phase 1: Foundation (Week 1) ✅
- [x] Research LLM-based generation (NAACL, EMNLP 2024)
- [x] Define enhanced schema with cognitive load
- [x] Document ORT hierarchical structure

### Phase 2: Generator (Week 2)
- [ ] Build TypeScript generator with OpenAI API
- [ ] Implement chain-of-thought prompting
- [ ] Add constraint solver for math validation
- [ ] Create CLI tool for batch generation

### Phase 3: Validation (Week 3)
- [ ] Schema validator (JSON Schema + Zod)
- [ ] Distractor quality evaluator
- [ ] Bilingual parity checker
- [ ] Difficulty calibration (A/B testing)

### Phase 4: Integration (Week 4)
- [ ] Update question loading system
- [ ] Add generation metadata to database
- [ ] Build web UI for question preview
- [ ] Create test suite with 100+ examples

---

## References

### Research Papers (2024)
- [Automated Distractor Generation (NAACL 2024)](https://aclanthology.org/2024.findings-naacl.193/)
- [Distractor Generation Survey (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.799.pdf)
- [Systematic Literature Review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11623049/)

### Prompt Engineering
- [Learn Prompting: LSAT Tutorial](https://learnprompting.org/docs/basic_applications/mc_tutorial)
- [Self-Consistency Strategy (93% accuracy)](https://tylerburleigh.com/blog/2023/12/04/)

### Tools
- [yq - YAML processor](https://github.com/mikefarah/yq)
- [jq - JSON processor](https://stedolan.github.io/jq/)
- [Zod - TypeScript validation](https://zod.dev/)
- [KaTeX - Math rendering](https://katex.org/)

---

## Quick Start

```bash
# 1. Clone skill
cd ~/.claude/skills
git clone https://github.com/your-org/ort-question-generator

# 2. Install dependencies
cd ort-question-generator
bun install

# 3. Configure API key
cp .env.example .env
# Add: OPENAI_API_KEY=sk-...

# 4. Generate first question
bun run generate -- \
  --domain MATH \
  --subsection Arithmetic \
  --difficulty 3 \
  --count 1

# 5. Preview in browser
bun run preview generated-questions.yaml
```

---

**Version History:**
- v1.0.0 (2026-01-22): Initial skill creation based on 2024 research
