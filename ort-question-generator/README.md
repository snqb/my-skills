# ORT Question Generator - Quick Reference (v3.0)

Generate high-quality ORT test questions with AI-powered distractor engineering and multi-format rendering.

## What's New in v3.0

- ✨ **Embedded validation scripts**: Copy-paste ready Python validators
- ✨ **Generation templates**: Proven templates for batch generation
- ✨ **Batch strategies**: Optimal distribution for 50-500+ questions
- ✨ **Auto-fix utilities**: Automatic correction of common issues
- ✨ **Production-tested**: Successfully generated 50 validated questions

## What's New in v2.0

- ✨ **Multi-format rendering**: comparison_table, passage_based, geometry, chart, standard
- ✨ **Production-ready schema**: Matches actual codebase validation
- ✨ **KaTeX support**: LaTeX math rendering for equations
- ✨ **Layout-specific validation**: Strict checks per layout type

## Quick Layout Reference

| Layout | Best For | Required Fields |
|--------|----------|-----------------|
| `comparison_table` | Math QC | `columns.A`, `columns.B` |
| `passage_based` | Reading | Substantial text (100+ chars) |
| `standard` | General | None (default) |
| `geometry` | Spatial | `diagram` |
| `chart` | Data analysis | `chart_data` |

## Generation via Claude Skill

```
# Use the skill directly in Claude Code
User: "Generate 5 math quantitative comparison questions, difficulty 3"

Claude: [Generates 5 questions with comparison_table layout, LaTeX, distractor rationale]
```

## Quick Validation

```bash
# Validate questions file (Python script)
python /path/to/validate-questions.py questions.json

# Fix broken questions
python /path/to/fix-broken-questions.py questions.json
```

## File Structure

```
ort-question-generator/
├── SKILL.md              # Comprehensive guide
├── README.md             # This file
├── generator.ts          # Main generator
├── validator.ts          # Validation logic
├── prompts/              # LLM prompts by domain
│   ├── math.ts
│   ├── verbal.ts
│   └── grammar.ts
├── templates/            # Question templates
│   ├── math-qc.yaml
│   ├── math-standard.yaml
│   └── verbal-analogy.yaml
├── schemas/              # JSON schemas
│   └── ort-question.schema.json
└── demo/                 # 50 demo questions + web UI
    ├── index.html
    ├── demos.json
    └── style.css
```

## Key Features

- **LLM-Based Generation**: GPT-4 with chain-of-thought prompting
- **Distractor Engineering**: Targets cognitive traps (NAACL 2024 research)
- **Cognitive Load**: Bloom's taxonomy (Recall → Strategic → Extended)
- **Bilingual**: Russian + Kyrgyz with parity checking
- **Validation**: Math solver + schema + quality metrics

## Next Steps

1. Read `SKILL.md` for complete documentation
2. Run `bun install` to install dependencies
3. Configure `.env` with OpenAI API key
4. Generate your first question!

## Research Sources

- [NAACL 2024: Distractor Generation](https://aclanthology.org/2024.findings-naacl.193/)
- [EMNLP 2024: Survey](https://aclanthology.org/2024.emnlp-main.799.pdf)
- [PMC: Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11623049/)
