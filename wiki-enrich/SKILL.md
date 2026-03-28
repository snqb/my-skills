---
name: wiki-enrich
description: "Enrich Markdown articles with inline Wikipedia links. First mention of each notable entity gets a hyperlink. Use when asked to add wiki links, enrich, or add references to .md files."
---

# Wikipedia Enricher

Enrich a Markdown article with inline Wikipedia links. First mention of each notable entity gets a hyperlink; subsequent mentions stay plain.

## When to Use

- User says "enrich", "add wiki links", "wikipedia links", "add references", or "обогати ссылками"
- After generating a long-form informational article
- On any existing `.md` file the user points to

## Workflow

### 1. Read the article

Read the full file. Note the **language**: Russian-dominant → prefer `ru.wikipedia.org`. English-dominant → prefer `en.wikipedia.org`.

### 2. Extract entities

Identify **linkable entities** — first occurrence only:

- **People**: Джин Шарп, Курманбек Бакиев, Vaswani
- **Organizations**: USAID, NED, Freedom House, ОДКБ, CANVAS
- **Events**: Тюльпановая революция, Андижанская бойня, Революция роз
- **Places**: Авиабаза Манас, Минусинская котловина
- **Concepts**: RLHF, self-attention (only if they have a Wikipedia page)

**Do NOT link:**
- Common words, generic terms ("революция", "демократия" on their own)
- Things already wrapped in `[text](url)` or `[[wikilinks]]`
- Items inside code blocks, YAML frontmatter, or Mermaid diagrams
- The same entity twice — first mention only

Aim for **15–40 entities** per long article. Don't overlink.

### 3. Resolve URLs via Wikipedia API

For each entity, curl the **opensearch** endpoint:

```bash
# Russian Wikipedia
curl -s "https://ru.wikipedia.org/w/api.php?action=opensearch&search=ENCODED_TERM&limit=3&format=json"

# English Wikipedia
curl -s "https://en.wikipedia.org/w/api.php?action=opensearch&search=ENCODED_TERM&limit=3&format=json"
```

Response format: `["query", ["Title1","Title2",...], ["","",...], ["url1","url2",...]]`

**URL-encode** Cyrillic and special characters. In bash:
```bash
python3 -c "import urllib.parse; print(urllib.parse.quote('Джин Шарп'))"
```

**Resolution rules:**
1. Try the **primary language** first (ru for Russian articles, en for English)
2. If no result or poor match → try the **other language**
3. If first result title closely matches the entity → use it
4. If ambiguous → use the `action=query&list=search` API for better fuzzy matching:
   ```bash
   curl -s "https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=ENCODED_TERM&srlimit=3&format=json"
   ```
5. If still no good match → skip this entity (don't force bad links)

### 4. Batch the lookups

To avoid 40 sequential curls, batch into groups. Build a shell script:

```bash
#!/bin/bash
# wiki-lookup.sh — run all lookups in parallel
lookup() {
  local lang="$1" term="$2"
  local encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$term'))")
  local result=$(curl -s "https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=1&format=json")
  echo "${term}|||${result}"
}

lookup ru "Джин Шарп" &
lookup ru "USAID" &
lookup ru "Freedom House" &
# ... all entities ...
wait
```

Run it, parse the output, build a mapping: `entity → url`.

### 5. Apply links

For each confirmed entity→url pair, find the **first mention** in the article body (not in YAML, not in headings unless it adds clarity, not in code blocks) and replace:

```
Джин Шарп  →  [Джин Шарп](https://ru.wikipedia.org/wiki/Джин_Шарп)
```

Use the `edit` tool for each replacement. Be precise — match the exact text in context.

**Link formatting:**
- Person names: `[Джин Шарп](url)` or `[**Джин Шарп**](url)` if already bold
- Orgs in bold: `[**USAID**](url)` — preserve bold inside link
- Abbreviations: link the first full mention, e.g., `[National Endowment for Democracy](url) (NED)`

### 6. Verify

After all edits, read the file again and confirm:
- No broken Markdown syntax
- No double-linked entities
- Links don't appear inside code blocks or frontmatter
- The article reads naturally (links shouldn't disrupt flow)

## Edge Cases

- **Tables**: Link entities in table cells normally, they render fine
- **Callouts**: Links inside `> [!note]` blocks work fine
- **Bold/italic entities**: Wrap the formatting inside the link: `[**term**](url)`
- **Parenthetical mentions**: `авиабаза «Манас»` → `авиабаза [«Манас»](url)` — link the name, not the descriptor
- **Abbreviations with expansion**: `**National Endowment for Democracy** (NED)` → link the full name, not the abbreviation
