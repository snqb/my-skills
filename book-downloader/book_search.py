#!/usr/bin/env python3
"""
Book Search & Download Tool - LibGen Integration
Uses libgen-api-enhanced for searching and retrieving books
"""

import argparse
import json
import sys
from typing import List, Dict, Optional
from pathlib import Path

try:
    from libgen_api_enhanced import LibgenSearch
except ImportError:
    print("Error: libgen-api-enhanced not installed", file=sys.stderr)
    print("Install with: uv tool install libgen-api-enhanced", file=sys.stderr)
    sys.exit(1)


def search_books(
    query: str,
    search_type: str = "title",
    filters: Optional[Dict] = None,
    limit: int = 10,
    exact_match: bool = False
) -> List:
    """
    Search for books using LibGen API

    Args:
        query: Search query string
        search_type: 'title', 'author', or 'default'
        filters: Dict of filters (year, extension, language, etc.)
        limit: Max number of results
        exact_match: Use exact matching for filters

    Returns:
        List of book results
    """
    s = LibgenSearch()

    # Execute search based on type
    if search_type == "title":
        if filters:
            results = s.search_title_filtered(query, filters, exact_match=exact_match)
        else:
            results = s.search_title(query)
    elif search_type == "author":
        if filters:
            results = s.search_author_filtered(query, filters, exact_match=exact_match)
        else:
            results = s.search_author(query)
    else:  # default
        if filters:
            results = s.search_filtered(query, filters, exact_match=exact_match)
        else:
            results = s.search_default(query)

    # Limit results
    return results[:limit] if results else []


def format_book_info(book, include_download: bool = False) -> Dict:
    """Format book object into readable dict"""
    info = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "publisher": book.publisher,
        "year": book.year,
        "pages": book.pages,
        "language": book.language,
        "extension": book.extension,
        "filesize": book.size,
        "md5": book.md5,
    }

    if include_download:
        info["tor_download"] = book.tor_download_link
        # Resolve direct download link (may be slow)
        try:
            book.resolve_direct_download_link()
            info["direct_download"] = book.resolved_download_link
        except Exception as e:
            info["direct_download"] = f"Error resolving: {str(e)}"

    return info


def download_book(book, output_dir: Path) -> bool:
    """
    Download a book to specified directory

    Args:
        book: Book object from search results
        output_dir: Directory to save the file

    Returns:
        True if successful, False otherwise
    """
    try:
        import requests

        # Resolve download link
        book.resolve_direct_download_link()
        url = book.resolved_download_link

        if not url or url.startswith("Error"):
            print(f"Failed to resolve download link for: {book.title}", file=sys.stderr)
            return False

        # Create filename
        safe_title = "".join(c for c in book.title if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_title}.{book.extension}"
        filepath = output_dir / filename

        # Download file
        print(f"Downloading: {book.title} ({book.size})...", file=sys.stderr)
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"Saved to: {filepath}", file=sys.stderr)
        return True

    except Exception as e:
        print(f"Download failed: {str(e)}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Search and download books from LibGen",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search by title
  %(prog)s "Clean Code" --type title

  # Search by author
  %(prog)s "Isaac Asimov" --type author

  # Filter by format and year
  %(prog)s "Python Programming" --extension epub --year 2020

  # Get download links
  %(prog)s "The Pragmatic Programmer" --download-links

  # Download first result
  %(prog)s "Design Patterns" --download --output ~/Books --limit 1

  # Search with multiple filters
  %(prog)s "Machine Learning" --extension pdf --year 2023 --language English
        """
    )

    # Search parameters
    parser.add_argument("query", help="Search query")
    parser.add_argument(
        "--type",
        choices=["title", "author", "default"],
        default="title",
        help="Search type (default: title)"
    )
    parser.add_argument("--limit", type=int, default=10, help="Max results (default: 10)")
    parser.add_argument("--exact", action="store_true", help="Use exact match for filters")

    # Filters
    parser.add_argument("--extension", help="File extension (epub, pdf, mobi, etc.)")
    parser.add_argument("--year", help="Publication year")
    parser.add_argument("--language", help="Language")

    # Output options
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--download-links", action="store_true", help="Include download links (slower)")

    # Download options
    parser.add_argument("--download", action="store_true", help="Download books")
    parser.add_argument("--output", type=Path, default=Path.cwd(), help="Download directory")

    args = parser.parse_args()

    # Build filters
    filters = {}
    if args.extension:
        filters["extension"] = args.extension
    if args.year:
        filters["year"] = args.year
    if args.language:
        filters["language"] = args.language

    # Search
    try:
        results = search_books(
            args.query,
            search_type=args.type,
            filters=filters if filters else None,
            limit=args.limit,
            exact_match=args.exact
        )

        if not results:
            print("No results found", file=sys.stderr)
            sys.exit(1)

        # Format results
        books = [format_book_info(book, include_download=args.download_links or args.download)
                 for book in results]

        # Output
        if args.json:
            print(json.dumps(books, indent=2))
        else:
            for i, book in enumerate(books, 1):
                print(f"\n{i}. {book['title']}")
                print(f"   Author: {book['author']}")
                print(f"   Year: {book['year']} | Publisher: {book['publisher']}")
                print(f"   Format: {book['extension']} | Size: {book['filesize']} | Pages: {book['pages']}")
                print(f"   Language: {book['language']}")
                print(f"   ID: {book['id']} | MD5: {book['md5']}")
                if args.download_links or args.download:
                    print(f"   Download: {book.get('direct_download', 'N/A')}")

        # Download if requested
        if args.download:
            args.output.mkdir(parents=True, exist_ok=True)
            print(f"\n{'='*60}", file=sys.stderr)
            for book in results:
                download_book(book, args.output)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
