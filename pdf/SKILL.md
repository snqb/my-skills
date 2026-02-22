---
name: pdf
description: Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF form or programmatically process, generate, or analyze PDF documents at scale.
license: Proprietary. LICENSE.txt has complete terms
---

# PDF Processing Guide

## Overview

This guide covers essential PDF processing operations using Python libraries and command-line tools. For advanced features, JavaScript libraries, and detailed examples, see reference.md. If you need to fill out a PDF form, read forms.md and follow its instructions.

## Quick Start

```python
from pypdf import PdfReader, PdfWriter

# Read a PDF
reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

# Extract text
text = ""
for page in reader.pages:
    text += page.extract_text()
```

## Large PDF Strategies

**CRITICAL: For PDFs with 10+ pages or >5MB, use these token-aware patterns to avoid context overflow.**

### When to Use Large PDF Strategies

- **File size**: >5MB
- **Page count**: >10 pages
- **Symptoms**: Claude runs out of context, extracts partial text, or becomes unresponsive
- **Solution**: Process incrementally, not all at once

### 1. Summary-First Approach (RECOMMENDED)

Extract metadata and page count FIRST, then ask which pages to process:

```python
from pypdf import PdfReader
import pdfplumber

# Step 1: Get document overview (fast, minimal tokens)
reader = PdfReader("large_document.pdf")
print(f"📄 Document: {len(reader.pages)} pages")
print(f"📝 Title: {reader.metadata.title if reader.metadata else 'N/A'}")
print(f"✍️  Author: {reader.metadata.author if reader.metadata else 'N/A'}")

# Step 2: Extract table of contents or first few pages
print("\n🔍 Preview (first 3 pages):")
with pdfplumber.open("large_document.pdf") as pdf:
    for i in range(min(3, len(pdf.pages))):
        text = pdf.pages[i].extract_text()
        print(f"\n--- Page {i+1} ---")
        print(text[:500] + "..." if len(text) > 500 else text)

# Step 3: Ask user which pages to extract (via AskUserQuestion or interactive input)
# Then process only those pages
```

### 2. Page-by-Page with Token Limits

Process pages one at a time with hard limits to prevent overflow:

```python
import pdfplumber

MAX_PAGES = 20  # Stop after N pages
MAX_CHARS_PER_PAGE = 2000  # Truncate long pages
MAX_TOTAL_CHARS = 30000  # Stop when total exceeds this

total_chars = 0
extracted_pages = []

with pdfplumber.open("large_document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        if i >= MAX_PAGES:
            print(f"⚠️  Stopped at page {i} (MAX_PAGES={MAX_PAGES})")
            break

        text = page.extract_text() or ""

        # Truncate individual page if too long
        if len(text) > MAX_CHARS_PER_PAGE:
            text = text[:MAX_CHARS_PER_PAGE] + f"\n[... truncated {len(text) - MAX_CHARS_PER_PAGE} chars]"

        total_chars += len(text)
        extracted_pages.append({
            "page": i + 1,
            "text": text,
            "chars": len(text)
        })

        # Stop if total exceeds limit
        if total_chars > MAX_TOTAL_CHARS:
            print(f"⚠️  Stopped at page {i+1} (total {total_chars} chars exceeds {MAX_TOTAL_CHARS})")
            break

        print(f"✓ Page {i+1}: {len(text)} chars (total: {total_chars})")

# Process extracted_pages as needed
print(f"\n📊 Extracted {len(extracted_pages)} pages, {total_chars} total chars")
```

### 3. Targeted Page Ranges

Extract specific page ranges instead of entire document:

```python
import pdfplumber

def extract_page_range(pdf_path, start_page, end_page):
    """Extract text from specific page range (1-indexed)"""
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)

        # Validate range
        if start_page < 1 or end_page > total_pages:
            raise ValueError(f"Invalid range: {start_page}-{end_page} (doc has {total_pages} pages)")

        print(f"📄 Extracting pages {start_page}-{end_page} of {total_pages}")

        results = []
        for i in range(start_page - 1, end_page):  # Convert to 0-indexed
            text = pdf.pages[i].extract_text()
            results.append({
                "page": i + 1,
                "text": text
            })
            print(f"✓ Page {i+1}")

        return results

# Usage examples:
# extract_page_range("document.pdf", 1, 5)      # First 5 pages
# extract_page_range("document.pdf", 10, 15)    # Pages 10-15
# extract_page_range("document.pdf", 50, 55)    # Pages 50-55
```

### 4. Search-Then-Extract Pattern

Search for keywords first, then extract only relevant pages:

```python
import pdfplumber

def find_pages_with_keyword(pdf_path, keyword):
    """Find pages containing keyword, return page numbers"""
    matching_pages = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"🔍 Searching {len(pdf.pages)} pages for '{keyword}'...")

        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if keyword.lower() in text.lower():
                matching_pages.append(i + 1)  # 1-indexed
                print(f"✓ Found on page {i+1}")

    return matching_pages

def extract_matching_pages(pdf_path, keyword, max_pages=10):
    """Extract only pages containing keyword"""
    matching = find_pages_with_keyword(pdf_path, keyword)

    if not matching:
        print(f"❌ No pages found with '{keyword}'")
        return []

    print(f"\n📄 Found {len(matching)} matching pages: {matching}")

    # Limit to max_pages
    if len(matching) > max_pages:
        print(f"⚠️  Limiting to first {max_pages} pages")
        matching = matching[:max_pages]

    # Extract text from matching pages
    with pdfplumber.open(pdf_path) as pdf:
        results = []
        for page_num in matching:
            text = pdf.pages[page_num - 1].extract_text()
            results.append({"page": page_num, "text": text})

    return results

# Usage:
# extract_matching_pages("large_doc.pdf", "contract", max_pages=5)
# extract_matching_pages("report.pdf", "revenue")
```

### 5. Progressive Extraction with User Feedback

For interactive sessions, show progress and let user decide when to stop:

```python
import pdfplumber

def interactive_extraction(pdf_path, pages_per_chunk=5):
    """Extract in chunks, show results, ask to continue"""
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        current_page = 0

        while current_page < total_pages:
            end_page = min(current_page + pages_per_chunk, total_pages)

            print(f"\n📄 Extracting pages {current_page + 1}-{end_page} of {total_pages}")

            for i in range(current_page, end_page):
                text = pdf.pages[i].extract_text()
                print(f"\n--- Page {i+1} ---")
                print(text[:1000] + "..." if len(text) > 1000 else text)

            current_page = end_page

            if current_page < total_pages:
                # In bypass mode: auto-continue for N more chunks, then stop
                # In interactive mode: use AskUserQuestion
                remaining = total_pages - current_page
                print(f"\n⏸  {remaining} pages remaining. Continue? (auto-stopping after 3 chunks)")
                if current_page >= pages_per_chunk * 3:
                    print("⚠️  Stopping after 3 chunks (token limit)")
                    break

# Usage: interactive_extraction("large_doc.pdf", pages_per_chunk=5)
```

### Decision Tree

```
Is PDF large (>10 pages or >5MB)?
  ├─ NO → Use standard extraction (Quick Start examples)
  │
  └─ YES → Which strategy?
      ├─ Don't know what's needed? → Summary-First (show TOC, ask user)
      ├─ Know specific pages? → Targeted Page Ranges
      ├─ Looking for keyword? → Search-Then-Extract
      └─ Exploring unknown doc? → Page-by-Page with Token Limits
```

### Key Principles

1. **Never extract all pages blindly** - Check page count first
2. **Set hard limits** - MAX_PAGES, MAX_CHARS to prevent overflow
3. **Show progress** - Print page numbers and character counts
4. **Truncate gracefully** - Don't let single page consume all tokens
5. **Ask before continuing** - Get user confirmation for large extractions

## Python Libraries

### pypdf - Basic Operations

#### Merge PDFs
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

#### Split PDF
```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

#### Extract Metadata
```python
reader = PdfReader("document.pdf")
meta = reader.metadata
print(f"Title: {meta.title}")
print(f"Author: {meta.author}")
print(f"Subject: {meta.subject}")
print(f"Creator: {meta.creator}")
```

#### Rotate Pages
```python
reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]
page.rotate(90)  # Rotate 90 degrees clockwise
writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### pdfplumber - Text and Table Extraction

#### Extract Text with Layout
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        print(text)
```

#### Extract Tables
```python
with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for j, table in enumerate(tables):
            print(f"Table {j+1} on page {i+1}:")
            for row in table:
                print(row)
```

#### Advanced Table Extraction
```python
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            if table:  # Check if table is not empty
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)

# Combine all tables
if all_tables:
    combined_df = pd.concat(all_tables, ignore_index=True)
    combined_df.to_excel("extracted_tables.xlsx", index=False)
```

### reportlab - Create PDFs

#### Basic PDF Creation
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter

# Add text
c.drawString(100, height - 100, "Hello World!")
c.drawString(100, height - 120, "This is a PDF created with reportlab")

# Add a line
c.line(100, height - 140, 400, height - 140)

# Save
c.save()
```

#### Create PDF with Multiple Pages
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet

doc = SimpleDocTemplate("report.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = []

# Add content
title = Paragraph("Report Title", styles['Title'])
story.append(title)
story.append(Spacer(1, 12))

body = Paragraph("This is the body of the report. " * 20, styles['Normal'])
story.append(body)
story.append(PageBreak())

# Page 2
story.append(Paragraph("Page 2", styles['Heading1']))
story.append(Paragraph("Content for page 2", styles['Normal']))

# Build PDF
doc.build(story)
```

## Command-Line Tools

### pdftotext (poppler-utils)
```bash
# Extract text
pdftotext input.pdf output.txt

# Extract text preserving layout
pdftotext -layout input.pdf output.txt

# Extract specific pages
pdftotext -f 1 -l 5 input.pdf output.txt  # Pages 1-5
```

### qpdf
```bash
# Merge PDFs
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Split pages
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf
qpdf input.pdf --pages . 6-10 -- pages6-10.pdf

# Rotate pages
qpdf input.pdf output.pdf --rotate=+90:1  # Rotate page 1 by 90 degrees

# Remove password
qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf
```

### pdftk (if available)
```bash
# Merge
pdftk file1.pdf file2.pdf cat output merged.pdf

# Split
pdftk input.pdf burst

# Rotate
pdftk input.pdf rotate 1east output rotated.pdf
```

## Common Tasks

### Extract Text from Scanned PDFs
```python
# Requires: pip install pytesseract pdf2image
import pytesseract
from pdf2image import convert_from_path

# Convert PDF to images
images = convert_from_path('scanned.pdf')

# OCR each page
text = ""
for i, image in enumerate(images):
    text += f"Page {i+1}:\n"
    text += pytesseract.image_to_string(image)
    text += "\n\n"

print(text)
```

### Add Watermark
```python
from pypdf import PdfReader, PdfWriter

# Create watermark (or load existing)
watermark = PdfReader("watermark.pdf").pages[0]

# Apply to all pages
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

### Extract Images
```bash
# Using pdfimages (poppler-utils)
pdfimages -j input.pdf output_prefix

# This extracts all images as output_prefix-000.jpg, output_prefix-001.jpg, etc.
```

### Password Protection
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

# Add password
writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```

## Quick Reference

| Task | Best Tool | Command/Code |
|------|-----------|--------------|
| Merge PDFs | pypdf | `writer.add_page(page)` |
| Split PDFs | pypdf | One page per file |
| Extract text | pdfplumber | `page.extract_text()` |
| Extract tables | pdfplumber | `page.extract_tables()` |
| Create PDFs | reportlab | Canvas or Platypus |
| Command line merge | qpdf | `qpdf --empty --pages ...` |
| OCR scanned PDFs | pytesseract | Convert to image first |
| Fill PDF forms | pdf-lib or pypdf (see forms.md) | See forms.md |

## Next Steps

- For advanced pypdfium2 usage, see reference.md
- For JavaScript libraries (pdf-lib), see reference.md
- If you need to fill out a PDF form, follow the instructions in forms.md
- For troubleshooting guides, see reference.md
