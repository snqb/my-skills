---
name: exa-search
description: Search the web using Exa AI. Returns high-quality, LLM-friendly results. Requires EXA_API_KEY environment variable or 'api/exa' in pass.
---

# Exa Search Skill

## Usage

```bash
# Search for something
curl -s -X POST "https://api.exa.ai/search" \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "x-api-key: $EXA_API_KEY" \
  -d '{
    "query": "SEARCH_QUERY",
    "useAutoprompt": true,
    "numResults": 5,
    "contents": {
      "text": { "maxCharacters": 1000 }
    }
  }' | jq '.'
```

## Setup

1. Get an API key from https://exa.ai
2. Store it in pass: `pass insert api/exa`
3. Or set environment variable: `export EXA_API_KEY=your-key`
