---
name: bishkek-report
description: "Summon 8–12 fictional but statistically plausible people from Kyrgyzstan to judge your web app. They take screenshots, click around, get confused, get delighted, and write honest reviews in Russian. Output: a single .md report with embedded screenshots. Use when you need brutal UX feedback from people who ride marshrutkas."
---

# Bishkek Report

You are about to assemble a focus group from Kyrgyzstan. They don't know each other, they didn't sign up for this, and they have opinions.

## When to use

- You built something and want to know if real people would survive it
- You need UX feedback that isn't from a designer in San Francisco
- You want to stress-test your app against the full spectrum: a 72-year-old эне on a Galaxy A13, a 16-year-old preparing for ОРТ on a Xiaomi, a developer with DevTools open, and a journalist who needs a quote in 5 minutes

## The Cast

Generate **8–12 people** that reflect real Kyrgyzstan demographics. Not stereotypes — actual variance:

| Axis | Examples of variance |
|------|---------------------|
| **Age** | 16 → 72. Include at least one teenager and one pensioner |
| **Location** | Bishkek, Osh, Naryn, Jalal-Abad oblast village, Moscow diaspora, Ankara researcher |
| **Language** | KY-only, RU-only, KY+RU, KY+RU+EN, TR+EN |
| **Tech level** | ⭐ (nephew helps) → ⭐⭐⭐⭐⭐ (opens DevTools first) |
| **Profession** | Teacher, student, developer, journalist, pensioner, activist, construction worker, marketolog, researcher |
| **Device** | Xiaomi Redmi, Samsung Galaxy A-series, iPhone, MacBook, Windows laptop |

Each person gets a **name, age, city, profession, languages, tech level**. Keep it plausible. No one is named "Test User 4".

## Process

### 1. Launch the app locally

```bash
# Start the server in tmux (never block main thread)
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi
tmux new-window -d -t pi -n app 'cd PROJECT_DIR && START_COMMAND'
sleep 2
tmux capture-pane -t pi:app -p -S -5
```

### 2. Take screenshots with ABP (browser.js)

Use `browser.js` from the `browser-testing` skill. Capture **at minimum**:

- Home page (desktop)
- Home page (mobile 390×844)
- A search interaction + results
- A detail/content page (full page)
- Dark mode (if exists)
- Any "explore" / secondary page

```bash
B=~/.pi/agent/skills/browser-testing/browser.js

# Launch browser
$B start --headless

# Desktop screenshots (default viewport 1280x900)
$B nav 'http://localhost:PORT'
$B screenshot /tmp/review-home.png

# Interact — search, click, navigate. Capture each state.
$B click 'input[type="search"]'
$B type 'search query'
$B key Enter
$B screenshot /tmp/review-search.png

# Navigate to a detail page
$B click 'a.detail-link'
$B screenshot /tmp/review-detail.png --full

# Mobile viewport
$B nav 'http://localhost:PORT' --device 'iPhone 15'
$B screenshot /tmp/review-mobile.png

# Dark mode (if exists)
$B eval 'document.documentElement.classList.add("dark")'
$B screenshot /tmp/review-dark.png
```

### 3. Read screenshots

Use the `read` tool on each `.png` — actually look at the app. This is your eyes. Note:
- Visual hierarchy — what grabs attention first?
- Information density — too sparse? too cluttered?
- Typography — readable? too small?
- Touch targets — would a thumb hit them?
- Color/contrast — especially dark mode
- Broken layouts, overflow, clipped text

### 4. Hit the API

```bash
# Poke around the actual data
curl -s 'http://localhost:PORT/api/...' | python3 -m json.tool
```

Understand what the app _does_, not just what it _looks like_. Try edge cases:
- Empty search
- Very long input
- Non-Latin characters
- Features mentioned in the UI but possibly broken

### 5. Write the report

Each person gets:

```markdown
## N. Name, age — profession, city

> [!quote] «One memorable sentence in their voice»

### Сценарий
What they did — specific actions, specific pages, specific searches.

### Что понравилось
- Bullet points. Specific. Reference actual UI elements, data, interactions.

### Что не понравилось
- Bullet points. Specific. Not vague "could be better" — what broke, what confused, what's missing.

### Оценка: **X/10**

> One-line summary in their voice.
```

### 6. Summary section

After all testimonies:

- **Average score** with ASCII bar chart
- **Problem frequency** — which issues hit the most people (use mermaid if Obsidian)
- **Strengths table** — what everyone agrees is good
- **Prioritized issues** — P0 (broken), P1 (significant), P2 (nice to have)
- **One-sentence verdict**

## Output

- **Format**: `.md` with Obsidian features (callouts, mermaid, YAML frontmatter, tables)
- **Language**: Russian. The people are from Kyrgyzstan, they think in Russian (or KY, but you write in RU because your Kyrgyz is embarrassing)
- **Location**: `.git/reports/user-testing-YYYYMMDD.md`
- **Tone**: Honest. The people are not mean, but they're not impressed easily. Бүбүсара эне doesn't care about your proto-Turkic reconstruction if she can't read the font.

## Cleanup

```bash
rm /tmp/review-*.png
tmux kill-window -t pi:app 2>/dev/null
```

## Rules

1. **Always screenshot** — you must look at the app, not guess from code
2. **Always hit the API** — test what's behind the UI
3. **People are specific** — they search specific things, notice specific bugs, have specific needs
4. **Scores vary** — if everyone gives 7/10, your cast is too homogeneous
5. **The grandmother and the developer should disagree** — that's the point
6. **Russian language** — for the report text. UI elements and Kyrgyz terms quoted as-is
7. **Clean up** — screenshots, tmux windows, temp scripts
