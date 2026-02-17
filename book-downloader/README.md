# Book Downloader - Quick Reference

Search and download books from Library Genesis (LibGen).

## 🚀 Quick Start

```bash
# Search by title
~/.claude/skills/book-downloader/book_search.py "Clean Code"

# Search by author
~/.claude/skills/book-downloader/book_search.py "Isaac Asimov" --type author

# Filter by format
~/.claude/skills/book-downloader/book_search.py "Python" --extension epub

# Download a book
~/.claude/skills/book-downloader/book_search.py "Design Patterns" \
  --download --output ~/Books --limit 1
```

## 📖 Common Commands

| Task | Command |
|------|---------|
| **Title search** | `book_search.py "Book Title"` |
| **Author search** | `book_search.py "Author Name" --type author` |
| **Format filter** | `book_search.py "Query" --extension epub` |
| **Year filter** | `book_search.py "Query" --year 2023` |
| **Get links** | `book_search.py "Query" --download-links` |
| **Download** | `book_search.py "Query" --download --output ~/Books` |
| **JSON output** | `book_search.py "Query" --json` |
| **Limit results** | `book_search.py "Query" --limit 5` |

## 🎯 Common Formats

- **epub** - E-readers, tablets, phones (recommended)
- **pdf** - Desktop, printing
- **mobi** - Legacy Kindle
- **djvu** - Scanned academic papers
- **azw3** - Modern Kindle

## 💡 Pro Tips

**Find latest EPUB:**
```bash
book_search.py "Book Title" --extension epub --exact --limit 3
```

**Download author's works:**
```bash
book_search.py "Author" --type author --download --output ~/Books/Author
```

**JSON + jq magic:**
```bash
book_search.py "Python" --json | jq '.[] | {title, year, filesize}'
```

## 📚 Full Documentation

See [SKILL.md](SKILL.md) for:
- Complete API reference
- Claude integration patterns
- Troubleshooting guide
- Advanced workflows
- Example conversations

## ⚠️ Note

LibGen operates in a legal gray area. Users are responsible for compliance with local copyright laws. Consider legal alternatives (library access, legitimate purchases) when appropriate.

---

**Library:** [libgen-api-enhanced](https://github.com/onurhanak/libgen-api-enhanced) (MIT)
