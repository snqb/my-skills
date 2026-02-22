---
name: brainstorm
description: >
  Deep brainstorming for long sessions. Use before any creative work: features, components, architecture, strategy.
  Combines: collaborative dialogue (one question at a time), systems thinking (players/incentives/2nd-order effects),
  and 25 cross-domain mental models. Outputs validated designs to docs/plans/.
---

# Deep Brainstorming

Turn ideas into fully-formed designs through collaborative dialogue, systems analysis, and cross-domain thinking.

**Announce at start:** "Starting brainstorm session. I'll ask one question at a time."

## The Process

### Phase 1: Understand the Idea

1. Check current project context (files, docs, recent commits)
2. Ask questions **one at a time** to refine the idea
3. Prefer multiple choice when possible
4. Focus on: purpose, constraints, success criteria, stakeholders

### Phase 2: Analyze the System

Before proposing solutions, map the system:

1. **Map players & incentives** — Who's involved? What does each want?
2. **Identify stocks & flows** — What accumulates? What moves between states?
3. **Trace 2nd-order effects** — If we do X, what happens next? Then what?
4. **Find leverage points** — Where can small changes create large impact?
5. **Spot feedback loops** — What reinforces or balances itself?

### Phase 3: Apply Mental Models

Pick 2-3 relevant lenses from the toolbox below to analyze from different angles.

### Phase 4: Explore Approaches

- Propose 2-3 different approaches with trade-offs
- Lead with your recommendation and explain why
- Apply YAGNI ruthlessly — remove unnecessary features

### Phase 5: Present the Design

- Break into sections of 200-300 words
- Ask after each section: "Does this look right so far?"
- Cover: architecture, components, data flow, error handling, testing
- Go back and clarify when something doesn't fit

### Phase 6: Document

Write validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`

---

## Systems Thinking Framework

### Core Questions

| Question | Purpose |
|----------|---------|
| Who are all the players, and what does each want? | Map incentives |
| If we do X, what happens next? Then what? | Trace cascading effects |
| What accumulates over time? What flows? | Model dynamics |
| Where are the feedback loops? | Find reinforcing/balancing forces |
| What constraint, if removed, unlocks the most value? | Find leverage |
| What recurring pain could be systematized? | Identify automation opportunities |

### Common Mistakes to Flag

- **Only seeing first-order effects** — Changes ripple in non-obvious ways
- **Ignoring incentives** — Players respond to their incentives, not yours
- **Optimizing locally** — Improving one part can worsen the whole
- **Missing feedback loops** — Systems amplify or dampen changes
- **Treating symptoms** — Address root causes, not visible symptoms

---

## 25 Mental Models Toolbox

| # | Lens | Core Question | Best For |
|---|------|---------------|----------|
| 1 | **Artist** | What makes this unique? | Creative blocks, innovation |
| 2 | **Economist** | How do people respond to incentives? | Behavior prediction |
| 3 | **Engineer** | Can I model and calculate this? | Data-driven decisions |
| 4 | **Entrepreneur** | What works if I try many things? | Uncertainty, experimentation |
| 5 | **Doctor** | What's the diagnosis from symptoms? | Root cause analysis |
| 6 | **Journalist** | Have I verified from independent sources? | Research, validation |
| 7 | **Scientist** | Does this withstand controlled testing? | Hypothesis testing |
| 8 | **Mathematician** | Can I prove this rigorously? | Logic, error detection |
| 9 | **Programmer** | What patterns can I automate? | Process optimization |
| 10 | **Architect** | What will this look like at full scale? | Future visualization |
| 11 | **Salesperson** | What do people really want beneath stated needs? | Understanding motivations |
| 12 | **Soldier** | What procedure must I follow exactly? | Risk prevention |
| 13 | **Chess Master** | What happens next if I simulate this? | Strategic foresight |
| 14 | **Designer** | Does this intuitively suggest how to use it? | UX, communication |
| 15 | **Teacher** | How do I build knowledge in a learner's mind? | Explanation, transfer |
| 16 | **Anthropologist** | Can I understand this group from inside? | Culture analysis |
| 17 | **Psychologist** | Does my model predict actual behavior? | Human behavior |
| 18 | **Critic** | How can I build on others' work? | Analysis, synthesis |
| 19 | **Philosopher** | What happens when I push this to extremes? | Finding flaws |
| 20 | **Accountant** | What ratios reveal hidden truths? | Metrics analysis |
| 21 | **Politician** | What will people believe about this? | Perception strategy |
| 22 | **Novelist** | Does my story make coherent sense? | Narrative structure |
| 23 | **Actor** | Can I actually feel the state I need? | Emotional management |
| 24 | **Plumber** | What would I find by examining directly? | Hands-on debugging |
| 25 | **Hacker** | What's really happening underneath? | Deep system understanding |

### Quick Model Selection

| Problem Type | Recommended Lenses |
|--------------|-------------------|
| Need creativity | Artist, Entrepreneur, Designer |
| Understanding behavior | Economist, Psychologist, Salesperson |
| Making predictions | Engineer, Chess Master, Scientist |
| Debugging issues | Doctor, Plumber, Hacker |
| Improving processes | Programmer, Accountant, Architect |
| Communication | Novelist, Teacher, Designer |
| Decision under uncertainty | Entrepreneur, Scientist, Politician |
| Understanding people | Anthropologist, Psychologist, Actor |
| Finding hidden assumptions | Philosopher, Mathematician, Critic |
| Risk management | Soldier, Accountant, Engineer |

---

## Long Session Discipline

### Pacing

- **One question per message** — Don't overwhelm
- **Validate incrementally** — Check understanding before building on it
- **Take breaks** — After major design sections, pause for confirmation
- **Document as you go** — Don't rely on memory across long sessions

### Staying Grounded

- **Evidence before claims** — Don't assume; verify
- **Name your lens** — "Looking at this as an Economist..." makes reasoning visible
- **Revisit assumptions** — Early assumptions may become invalid as understanding deepens
- **Track open questions** — Maintain a list of unresolved items

### Session Markers

Use these to structure long sessions:

```
🎯 GOAL: [What we're trying to figure out]
📍 CHECKPOINT: [Summary of where we are]
❓ OPEN: [Unresolved questions]
✅ DECIDED: [Confirmed decisions]
🔄 REVISIT: [Things to reconsider later]
```

---

## Key Principles

- **One question at a time** — Don't overwhelm with multiple questions
- **Multiple choice preferred** — Easier to answer than open-ended
- **YAGNI ruthlessly** — Remove unnecessary features from all designs
- **Explore alternatives** — Always propose 2-3 approaches before settling
- **Incremental validation** — Present design in sections, validate each
- **Be flexible** — Go back and clarify when something doesn't make sense
- **Guide, don't answer** — Use questions to help thinking, not give solutions
- **Combine lenses** — Powerful insights come from mixing perspectives

---

## Output Template

```markdown
# [Topic] Design

**Date:** YYYY-MM-DD
**Goal:** [One sentence]
**Status:** Draft | Validated

## Context
[Current state, constraints, stakeholders]

## System Map
- **Players:** [Who's involved and their incentives]
- **Stocks:** [What accumulates]
- **Flows:** [What moves between states]
- **Leverage points:** [Where small changes have big impact]

## Approaches Considered
1. [Approach A] — [Trade-offs]
2. [Approach B] — [Trade-offs]
3. [Approach C] — [Trade-offs]

**Chosen:** [Which and why]

## Design
[Architecture, components, data flow]

## Open Questions
- [ ] [Unresolved item 1]
- [ ] [Unresolved item 2]

## Next Steps
1. [Action 1]
2. [Action 2]
```

---

## Sources

Fused from:
- [obra/superpowers@brainstorming](https://github.com/obra/superpowers) — Collaborative dialogue process
- [refoundai/lenny-skills@systems-thinking](https://github.com/refoundai/lenny-skills) — Systems analysis framework
- [hexbee/hello-skills@cross-domain-thinking-toolbox](https://github.com/hexbee/hello-skills) — 25 mental models
