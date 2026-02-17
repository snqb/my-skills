# PDF Processing Skill

**Source:** [Anthropics Skills Repository](https://github.com/anthropics/skills/tree/main/skills/pdf)

## What It Does

Comprehensive toolkit for PDF manipulation covering:
- Text/table extraction with layout preservation
- Document creation from scratch
- Merging, splitting, rotating pages
- Form filling (fillable and non-fillable)
- Password protection and encryption
- Watermarks and metadata

## When to Use

- Extracting structured data from PDFs
- Filling out PDF forms programmatically
- Batch processing multiple PDFs
- Creating reports and documents
- Converting scanned documents (OCR)

## Key Libraries

**Python:**
- `pypdf` - Basic operations (merge, split, rotate)
- `pdfplumber` - Text/table extraction with layout
- `reportlab` - PDF creation from scratch
- `pypdfium2` - Fast rendering and image generation

**Command-line:**
- `pdftotext` - Fast text extraction
- `qpdf` - Merge, split, decrypt, optimize
- `pdfimages` - Extract embedded images

## Quick Examples

```python
# Extract tables to Excel
import pdfplumber
import pandas as pd

with pdfplumber.open("report.pdf") as pdf:
    tables = pdf.pages[0].extract_tables()
    df = pd.DataFrame(tables[0][1:], columns=tables[0][0])
    df.to_excel("output.xlsx")
```

```bash
# Merge PDFs
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Extract text
pdftotext -layout document.pdf output.txt
```

## Important Files

- **SKILL.md** - Main guide with common operations
- **forms.md** - Complete PDF form filling workflow
- **reference.md** - Advanced features and JavaScript libraries
- **scripts/** - Helper scripts for form processing

## Form Filling Workflow

See `forms.md` for the complete step-by-step process:
1. Check if PDF has fillable fields
2. Extract field information
3. Create validation images
4. Fill the form

Always follow the exact steps - it ensures accurate form completion.

## License

Proprietary - see LICENSE.txt in original repository
