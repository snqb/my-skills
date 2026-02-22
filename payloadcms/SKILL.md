---
name: payloadcms
description: >
  Use when working with Payload CMS projects (payload.config.ts, collections, fields, hooks, access control, Payload API).
  Triggers: collection definitions, field configs, hooks, access control, queries, custom endpoints, auth, uploads, drafts/versions, live preview, plugins.
  Also for debugging validation errors, security issues, relationship queries, transactions, or hook behavior.
---

# Payload CMS Development

Payload is a Next.js native CMS with TypeScript-first architecture. This skill fuses expert knowledge from official PayloadCMS skills + community best practices.

## Mental Model

Think of Payload as **three interconnected layers**:

1. **Config Layer** → Collections, globals, fields define your schema
2. **Hook Layer** → Lifecycle events transform and validate data
3. **Access Layer** → Functions control who can do what

Every operation flows: `Config → Access Check → Hook Chain → Database → Response Hooks`

## Quick Reference

| Task | Solution | Reference |
|------|----------|-----------|
| Auto-generate slugs | `slugField()` helper | [reference/FIELDS.md#slug-field-helper] |
| Restrict by user | Access control with query | [reference/ACCESS-CONTROL.md#row-level-security] |
| Local API with auth | `user` + `overrideAccess: false` | [reference/QUERIES.md#access-control-in-local-api] |
| Draft/publish workflow | `versions: { drafts: true }` | [reference/COLLECTIONS.md#versioning--drafts] |
| Computed fields | `virtual: true` with afterRead | [reference/FIELDS.md#virtual-fields] |
| Conditional fields | `admin.condition` | [reference/FIELDS.md#conditional-fields] |
| Filter relationship list | `filterOptions` on field | [reference/FIELDS.md#relationship] |
| Prevent hook loops | `req.context` check | [reference/HOOKS.md#hook-context] |
| Cascading deletes | beforeDelete hook | [reference/HOOKS.md#collection-hooks] |
| Transactions | Pass `req` to operations | [reference/ADAPTERS.md#threading-req-through-operations] |
| Background jobs | Jobs queue with tasks | [reference/ADVANCED.md#jobs-queue] |
| Custom API routes | Collection endpoints | [reference/ENDPOINTS.md] |
| Reverse relationships | `join` field type | [reference/FIELDS.md#join-fields] |
| Next.js revalidation | afterChange with context | [reference/HOOKS.md#nextjs-revalidation] |
| Create plugin | `(options) => (config) => Config` | [reference/PLUGIN-DEVELOPMENT.md] |

## Quick Start

```bash
npx create-payload-app@latest my-app
cd my-app
pnpm dev
```

### Minimal Config

```ts
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Media, Posts],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: mongooseAdapter({ url: process.env.DATABASE_URL }),
})
```

## Core Patterns

### Collection Definition

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft' },
  ],
  timestamps: true,
}
```

### Hook Pattern

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && data.title) {
          data.slug = data.title.toLowerCase().replace(/\s+/g, '-')
        }
        return data
      },
    ],
  },
  fields: [{ name: 'title', type: 'text', required: true }],
}
```

### Access Control Pattern

```ts
import type { Access } from 'payload'
import type { User } from '@/payload-types'

// Admin-only access
export const adminOnly: Access = ({ req }) => {
  const user = req.user as User
  return user?.roles?.includes('admin') ?? false
}

// Row-level: users see only their own posts
export const ownPostsOnly: Access = ({ req }) => {
  const user = req.user as User
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return { author: { equals: user.id } }
}
```

### Query Pattern

```ts
// Local API with access control
const posts = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2,
  limit: 10,
  sort: '-createdAt',
  user: req.user,
  overrideAccess: false, // CRITICAL: enforce permissions
})

// With populated relationships (depth: 2 is default)
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2, // Returns: { author: { id: "user123", name: "John" } }
})

// IDs only
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 0, // Returns: { author: "user123" }
})
```

## ⚠️ Critical Security Rules

### 1. Local API Access Control (CRITICAL)

**Default behavior bypasses ALL access control.** This is the #1 security mistake.

```ts
// ❌ SECURITY BUG: Access control bypassed even with user
await payload.find({ collection: 'posts', user: someUser })

// ✅ SECURE: Explicitly enforce permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED for access control
})
```

**When to use each:**
- `overrideAccess: true` (default) → Server-side operations you trust (cron jobs, system tasks)
- `overrideAccess: false` → When operating on behalf of a user (API routes, webhooks)

### 2. Transaction Integrity

**Operations without `req` run in separate transactions.**

```ts
// ❌ DATA CORRUPTION: Separate transaction
hooks: {
  afterChange: [async ({ doc, req }) => {
    await req.payload.create({
      collection: 'audit-log',
      data: { docId: doc.id },
      // Missing req - breaks atomicity!
    })
  }]
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [async ({ doc, req }) => {
    await req.payload.create({
      collection: 'audit-log',
      data: { docId: doc.id },
      req, // Maintains transaction
    })
  }]
}
```

### 3. Infinite Hook Loops

**Hooks triggering themselves create infinite loops.**

```ts
// ❌ INFINITE LOOP
hooks: {
  afterChange: [async ({ doc, req }) => {
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { views: doc.views + 1 },
      req,
    }) // Triggers afterChange again!
  }]
}

// ✅ SAFE: Context flag breaks the loop
hooks: {
  afterChange: [async ({ doc, req, context }) => {
    if (context.skipViewUpdate) return
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { views: doc.views + 1 },
      req,
      context: { skipViewUpdate: true },
    })
  }]
}
```

### 4. Logger Usage

```ts
// ✅ Valid
payload.logger.error('Something went wrong')
payload.logger.error({ msg: 'Failed to process', err: error })

// ❌ Invalid: don't pass error as second argument
payload.logger.error('Failed to process', error)

// ❌ Invalid: use `err` not `error`, use `msg` not `message`
payload.logger.error({ message: 'Failed', error: error })
```

## Common Field Types

```ts
// Text
{ name: 'title', type: 'text', required: true }

// Relationship
{ name: 'author', type: 'relationship', relationTo: 'users' }

// Rich text
{ name: 'content', type: 'richText' }

// Select
{ name: 'status', type: 'select', options: ['draft', 'published'] }

// Upload
{ name: 'image', type: 'upload', relationTo: 'media' }

// Array
{
  name: 'tags',
  type: 'array',
  fields: [{ name: 'tag', type: 'text' }],
}

// Blocks (polymorphic content)
{
  name: 'layout',
  type: 'blocks',
  blocks: [HeroBlock, ContentBlock, CTABlock],
}

// Join (reverse relationship)
{
  name: 'comments',
  type: 'join',
  collection: 'comments',
  on: 'post',
}
```

## Decision Framework

| Scenario | Approach |
|----------|----------|
| Data transformation before save | `beforeChange` hook |
| Data transformation after read | `afterRead` hook |
| Enforce business rules | Access control function |
| Complex validation | `validate` function on field |
| Computed display value | Virtual field with `afterRead` |
| Related docs list | `join` field type |
| Side effects (email, webhook) | `afterChange` hook with context guard |
| Database-level constraint | Field with `unique: true` or `index: true` |

## Getting Payload Instance

```ts
// In API routes (Next.js)
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })
  const posts = await payload.find({ collection: 'posts' })
  return Response.json(posts)
}

// In Server Components
export default async function Page() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'posts' })
  return <div>{docs.map(p => <h1 key={p.id}>{p.title}</h1>)}</div>
}
```

## Project Structure

```
src/
├── app/
│   ├── (frontend)/page.tsx
│   └── (payload)/admin/[[...segments]]/page.tsx
├── collections/
│   ├── Posts.ts
│   ├── Media.ts
│   └── Users.ts
├── globals/Header.ts
├── hooks/slugify.ts
└── payload.config.ts
```

## Quality Checklist

- [ ] All Local API calls with user context use `overrideAccess: false`
- [ ] All hook operations pass `req` for transaction integrity
- [ ] Recursive hooks use `context` flags
- [ ] Types generated and imported from `payload-types.ts`
- [ ] Access control functions typed with `Access` type
- [ ] Collections have meaningful `admin.useAsTitle` set
- [ ] Indexes on frequently queried fields

## Reference Documentation

Detailed patterns in `reference/` directory:
- **[FIELDS.md](reference/FIELDS.md)** - All field types, validation, admin options
- **[COLLECTIONS.md](reference/COLLECTIONS.md)** - Auth, uploads, drafts, live preview
- **[HOOKS.md](reference/HOOKS.md)** - Collection/field hooks, context patterns
- **[ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md)** - RBAC, row-level, field-level
- **[QUERIES.md](reference/QUERIES.md)** - Operators, Local/REST/GraphQL APIs
- **[ENDPOINTS.md](reference/ENDPOINTS.md)** - Custom API endpoints
- **[ADAPTERS.md](reference/ADAPTERS.md)** - Database, storage, email, transactions
- **[ADVANCED.md](reference/ADVANCED.md)** - Auth, jobs, plugins, localization
- **[PLUGIN-DEVELOPMENT.md](reference/PLUGIN-DEVELOPMENT.md)** - Plugin architecture

## Resources

- **LLM Context**: https://payloadcms.com/llms-full.txt
- **Docs**: https://payloadcms.com/docs
- **GitHub**: https://github.com/payloadcms/payload
- **Examples**: https://github.com/payloadcms/payload/tree/main/examples
- **Templates**: https://github.com/payloadcms/payload/tree/main/templates
