# MCP Builder Skill

**Source:** [Anthropics Skills Repository](https://github.com/anthropics/skills/tree/main/skills/mcp-builder)

## What It Does

Complete guide for building high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Covers the entire workflow from research to evaluation.

## When to Use

- Building MCP servers to integrate external APIs
- Wrapping services (GitHub, Slack, databases, etc.) for LLM access
- Creating tools for Claude or other LLM clients
- Need guidance on MCP best practices and patterns

## Four-Phase Workflow

### Phase 1: Research and Planning
- Study MCP protocol docs from `modelcontextprotocol.io`
- Load SDK documentation (Python or TypeScript)
- Understand API to wrap
- Plan comprehensive tool coverage

### Phase 2: Implementation
- Set up project structure
- Build API client with auth
- Implement tools with proper schemas
- Add error handling and pagination

### Phase 3: Review and Test
- Code quality review (DRY, types, descriptions)
- Build and syntax checks
- Test with MCP Inspector

### Phase 4: Evaluations
- Create 10 complex, realistic questions
- Verify answers yourself
- Output as XML evaluation file
- Test LLM effectiveness

## Recommended Stack

- **Language:** TypeScript (better SDK support, static typing)
- **Transport:** Streamable HTTP for remote, stdio for local
- **Schemas:** Zod (TypeScript) or Pydantic (Python)

## Key Design Principles

✅ **Comprehensive API coverage** over workflow shortcuts
✅ **Clear tool naming** with consistent prefixes
✅ **Concise descriptions** for discoverability
✅ **Actionable error messages** that guide solutions
✅ **Pagination support** for large datasets
✅ **Structured outputs** with outputSchema

## Reference Files

The skill includes detailed guides in `reference/`:
- `mcp_best_practices.md` - Universal guidelines
- `node_mcp_server.md` - TypeScript implementation
- `python_mcp_server.md` - Python implementation
- `evaluation.md` - Creating quality tests

## Quick Start Pattern

```typescript
// TypeScript example structure
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

const server = new Server({ name: "my-service", version: "1.0.0" });

server.registerTool({
  name: "service_get_data",
  description: "Fetch data from the service",
  inputSchema: z.object({
    id: z.string().describe("Resource ID"),
  }),
  async handler({ id }) {
    // Implementation
  }
});
```

## License

See LICENSE.txt in original repository
