---
name: bucket
description: Read and manage Bucket tasks — the offline-first PWA task tracker. View lists, add/update/delete tasks, set progress. Use when asked about "my tasks", "bucket", "what am I working on", "add a task", "mark done".
---

# Bucket — Task Management Skill

Manage tasks in the Bucket app via its REST API.

## Config

Credentials stored in `pass`:
- `bucket/room` — room ID (e.g., `3e4df8839c64`)
- `bucket/enc-key` — encryption key (base64url, optional — only if room uses E2E encryption)
- `bucket/url` — sync server URL (default: `https://bucket-sync.esen.works`)

## API Endpoints

Base: `$URL/room/$ROOM`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/room/:id` | — | Full room: lists + tasks |
| GET | `/room/:id/lists` | — | All lists |
| POST | `/room/:id/lists` | `{title, emoji?}` | Create list |
| PATCH | `/room/:id/lists/:listId` | `{title?, emoji?}` | Update list |
| DELETE | `/room/:id/lists/:listId` | — | Delete list + its tasks |
| GET | `/room/:id/tasks` | — | All tasks (opt: `?list=ID`) |
| POST | `/room/:id/tasks` | `{listId, title, description?, progress?}` | Create task |
| PATCH | `/room/:id/tasks/:taskId` | `{title?, description?, progress?, listId?}` | Update task |
| DELETE | `/room/:id/tasks/:taskId` | — | Delete task |

**Encryption**: Pass `X-Enc-Key: <base64url key>` header to decrypt/encrypt text fields. Without it, encrypted fields show ciphertext.

## Usage Pattern

```bash
# Load credentials
ROOM=$(pass bucket/room)
KEY=$(pass bucket/enc-key 2>/dev/null)  # optional
URL=$(pass bucket/url 2>/dev/null || echo "https://bucket-sync.esen.works")
ENC_HDR=""
[[ -n "$KEY" ]] && ENC_HDR="-H X-Enc-Key:$KEY"

# Show all tasks
curl -s "$URL/room/$ROOM" $ENC_HDR | jq .

# Add a task
curl -s -X POST "$URL/room/$ROOM/tasks" \
  -H "Content-Type: application/json" $ENC_HDR \
  -d '{"listId":"LIST_ID","title":"Do the thing"}'

# Set progress (0-100)
curl -s -X PATCH "$URL/room/$ROOM/tasks/TASK_ID" \
  -H "Content-Type: application/json" $ENC_HDR \
  -d '{"progress":100}'

# Delete a task
curl -s -X DELETE "$URL/room/$ROOM/tasks/TASK_ID" $ENC_HDR
```

## Display

When showing tasks to the user, format as a compact table:

```
📋 List Name
  ██████████░░░░░░░░░░ 50%  Task title
  ████████████████████ 100% Another task (done)
  ░░░░░░░░░░░░░░░░░░░░ 0%  Not started
```

Progress bar: 20 chars wide. `█` for filled, `░` for empty.

## Task Model

- **progress**: 0–100 integer (not boolean done/not done). 100 = done.
- **listId**: every task belongs to a list.
- **description**: optional freetext.
