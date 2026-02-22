---
description: Search and download academic books, textbooks, and publications from Library Genesis (LibGen) programmatically.
---

# Book Downloader Skill - LibGen Integration

**Purpose:** Search and download academic books, textbooks, and publications from Library Genesis (LibGen) programmatically.

**Library:** `libgen-api-enhanced` (53⭐, MIT license, actively maintained)
**CLI Tool:** `~/.claude/skills/book-downloader/book_search.py`

---

## 🎯 When to Use This Skill

Use this skill when the user needs to:
- Find academic books, textbooks, or technical publications
- Search for books by title, author, or ISBN
- Filter books by format (PDF, EPUB, MOBI), year, or language
- Get download links for books
- Download books programmatically
- Build reading lists or bibliographies

---

## 📚 Core Capabilities

### 1. Search Books
- **By title** - Find books matching a title
- **By author** - Find all books by an author
- **Default search** - Search across all fields
- **Filtered search** - Combine search with filters

### 2. Filter Results
- **Format** - epub, pdf, mobi, djvu, azw3, etc.
- **Year** - Publication year (exact or range)
- **Language** - English, Russian, Spanish, etc.
- **Exact matching** - Strict vs fuzzy filtering

### 3. Download Books
- **Direct download links** - HTTP mirrors (resolved at runtime)
- **Tor download links** - Onion mirror URLs
- **Batch download** - Download multiple books at once
- **Mirror resilience** - Automatically handles mirror failures

### 4. Metadata Retrieval
- Full bibliographic data (title, author, publisher, year)
- File information (size, format, pages, MD5 hash)
- LibGen ID for reference

---

## 🔧 CLI Tool Usage

### Installation Check
```bash
# Verify installation
which python3
uv tool list | grep libgen
```

If not installed:
```bash
uv tool install libgen-api-enhanced
```

### Basic Commands

**Search by title:**
```bash
~/.claude/skills/book-downloader/book_search.py "Clean Code"
```

**Search by author:**
```bash
~/.claude/skills/book-downloader/book_search.py "Isaac Asimov" --type author
```

**Filter by format:**
```bash
~/.claude/skills/book-downloader/book_search.py "Python Programming" --extension epub
```

**Filter by year and format:**
```bash
~/.claude/skills/book-downloader/book_search.py "Machine Learning" --extension pdf --year 2023
```

**Get download links:**
```bash
~/.claude/skills/book-downloader/book_search.py "Design Patterns" --download-links
```

**Download books:**
```bash
~/.claude/skills/book-downloader/book_search.py "The Pragmatic Programmer" \
  --download --output ~/Books --limit 1
```

**JSON output (for parsing):**
```bash
~/.claude/skills/book-downloader/book_search.py "Algorithms" --json --limit 5
```

### Advanced Examples

**Find latest EPUB of a book:**
```bash
~/.claude/skills/book-downloader/book_search.py "Thinking Fast and Slow" \
  --extension epub --exact --limit 3
```

**Download all books by author:**
```bash
~/.claude/skills/book-downloader/book_search.py "Terry Pratchett" \
  --type author --download --output ~/Books/Pratchett --limit 20
```

**Search with language filter:**
```bash
~/.claude/skills/book-downloader/book_search.py "Война и мир" \
  --language Russian --extension epub
```

**Build bibliography with JSON:**
```bash
~/.claude/skills/book-downloader/book_search.py "Deep Learning" \
  --year 2020 --json | jq '.[] | {title, author, year, id}'
```

---

## 🤖 Claude Integration Patterns

### Pattern 1: Simple Search Request

**User:** "Find the book Clean Code"

**Claude:**
```bash
~/.claude/skills/book-downloader/book_search.py "Clean Code" --limit 5
```

Present results to user with:
- Title, author, year
- Format and file size
- Ask if they want download links or to download

### Pattern 2: Filtered Search

**User:** "Find Python books from 2023 in EPUB format"

**Claude:**
```bash
~/.claude/skills/book-downloader/book_search.py "Python" \
  --extension epub --year 2023 --limit 10
```

### Pattern 3: Download Workflow

**User:** "Download the latest edition of The Pragmatic Programmer"

**Claude:**
1. Search first to confirm:
```bash
~/.claude/skills/book-downloader/book_search.py "The Pragmatic Programmer" --limit 3
```

2. Show options to user
3. Download selected:
```bash
~/.claude/skills/book-downloader/book_search.py "The Pragmatic Programmer" \
  --download --output ~/Downloads --limit 1
```

### Pattern 4: Author Bibliography

**User:** "Show me all books by Donald Knuth"

**Claude:**
```bash
~/.claude/skills/book-downloader/book_search.py "Donald Knuth" \
  --type author --limit 20 --json
```

Parse JSON and present formatted list.

### Pattern 5: Reading List Builder

**User:** "Create a reading list for learning Rust"

**Claude:**
1. Search for multiple titles:
```bash
# Run these in parallel for speed
~/.claude/skills/book-downloader/book_search.py "The Rust Programming Language" --limit 1
~/.claude/skills/book-downloader/book_search.py "Programming Rust" --limit 1
~/.claude/skills/book-downloader/book_search.py "Rust in Action" --limit 1
```

2. Compile results into markdown reading list
3. Optionally offer to download all

---

## 📋 Output Format

### Human-Readable Output
```
1. Clean Code: A Handbook of Agile Software Craftsmanship
   Author: Robert C. Martin
   Year: 2008 | Publisher: Prentice Hall
   Format: pdf | Size: 10.2 MB | Pages: 431
   Language: English
   ID: 123456 | MD5: abc123def456...
```

### JSON Output
```json
[
  {
    "id": "123456",
    "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
    "author": "Robert C. Martin",
    "publisher": "Prentice Hall",
    "year": "2008",
    "pages": "431",
    "language": "English",
    "extension": "pdf",
    "filesize": "10.2 MB",
    "md5": "abc123def456...",
    "tor_download": "http://libgen.onion/...",
    "direct_download": "http://download.mirror.com/..."
  }
]
```

---

## ⚠️ Important Considerations

### Mirror Availability
- LibGen mirrors change frequently
- `libgen-api-enhanced` handles mirror resolution automatically
- If download links fail, the library will try alternative mirrors
- Tor links are more stable but require Tor browser/setup

### Rate Limiting
- Be respectful with search frequency
- For bulk operations, add delays between requests
- Consider caching search results

### Legal & Ethical Use
- LibGen operates in a legal gray area in many jurisdictions
- Users are responsible for compliance with local copyright laws
- Recommend legal alternatives when appropriate (library, university access, legitimate purchases)

### File Quality
- Not all uploads are equal quality
- Check MD5 hash for integrity verification
- Prefer recent uploads for better quality
- EPUB usually better than PDF for reading on devices

### Language Detection
- Language filter is exact match
- Common values: "English", "Russian", "Spanish", "German", "French"
- Case-sensitive in exact mode

---

## 🔍 Troubleshooting

### "No results found"
- Try broader search terms
- Remove filters (especially year/exact match)
- Try different search type (title vs default)
- Check spelling

### "Error resolving download link"
- Mirror may be temporarily down
- Try again later
- Use Tor download link as fallback

### Import Error
```bash
# Reinstall the library
uv tool install --force libgen-api-enhanced
```

### Slow download link resolution
- This is normal - library checks multiple mirrors
- Use `--download-links` flag only when needed
- Consider using Tor links directly (no resolution needed)

---

## 💡 Pro Tips

### 1. JSON + jq for Power Workflows
```bash
# Extract just titles and authors
~/.claude/skills/book-downloader/book_search.py "Algorithms" --json | \
  jq '.[] | "\(.title) by \(.author)"'

# Find smallest file size
~/.claude/skills/book-downloader/book_search.py "Python" --extension epub --json | \
  jq 'sort_by(.filesize) | .[0]'
```

### 2. Format Preferences
- **EPUB** - Best for e-readers, smartphones, tablets
- **PDF** - Best for desktop, printing, preserves formatting
- **MOBI** - Legacy Kindle format (use EPUB + Calibre instead)
- **DJVU** - Academic papers, scanned books (smaller than PDF)

### 3. Batch Download Script
```bash
#!/bin/bash
# Download multiple books from a list
while IFS= read -r book; do
  ~/.claude/skills/book-downloader/book_search.py "$book" \
    --download --output ~/Books --limit 1
  sleep 2  # Be nice to servers
done < booklist.txt
```

### 4. Verification Workflow
```bash
# 1. Search and save results
~/.claude/skills/book-downloader/book_search.py "Book Title" --json > results.json

# 2. Review results
jq '.[] | {title, year, extension, filesize}' results.json

# 3. Download specific book by MD5
# (Extract MD5 from results, then search by it for exact match)
```

---

## 🎓 Example Conversations

**Example 1: Student looking for textbook**
```
User: I need "Introduction to Algorithms" by CLRS
Claude:
  [Runs search]
  Found 3 editions:
  1. 3rd Edition (2009) - PDF, 12.3 MB
  2. 3rd Edition (2009) - EPUB, 8.1 MB
  3. 2nd Edition (2001) - PDF, 15.2 MB

  Which would you prefer? I recommend the 3rd edition EPUB for better readability.
```

**Example 2: Researcher building bibliography**
```
User: Find recent machine learning books
Claude:
  [Runs search with --year 2023 --year 2024]
  Found 15 recent ML books. Here are the top 5:
  [Lists results]

  Would you like me to:
  1. Download any of these
  2. Export as BibTeX
  3. Create a reading list with summaries
```

**Example 3: Format conversion need**
```
User: I need this book in EPUB but only found PDF
Claude:
  I can help with that:
  1. First, let me search for EPUB versions
     [Runs --extension epub search]
  2. If no EPUB found, I can help you convert using Calibre
     [Suggests calibre-cli conversion]
```

---

## 🚀 Future Enhancements

Potential additions to this skill:
- **Anna's Archive integration** - Fallback when LibGen fails
- **Calibre integration** - Format conversion, metadata management
- **Citation generation** - BibTeX, APA, MLA export
- **Reading list management** - Track what you've downloaded
- **Mirror health monitoring** - Track which mirrors work best
- **ISBN search** - Direct lookup by ISBN-10/ISBN-13
- **Duplicate detection** - Avoid downloading same book twice

---

## 📚 Related Skills

- **pdf** skill - Extract text, manipulate PDFs
- **llm-delegator** - Analyze book content with LLMs
- **python** skill - For custom scripting with the library

---

## 🔗 References

- [libgen-api-enhanced GitHub](https://github.com/onurhanak/libgen-api-enhanced)
- [Library Genesis](http://libgen.li) - Official site (mirrors vary)
- [Anna's Archive](https://annas-archive.org) - Alternative source

---

**Last Updated:** 2025-01-31
**Maintainer:** Claude Code Skills
