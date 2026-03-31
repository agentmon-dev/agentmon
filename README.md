# agentmon

See where your AI tokens go.

Auto-collect token usage from Claude Code, Codex, Gemini CLI, and more. Background daemon + web dashboard. Install and forget.

## Quick Start

```bash
npx agentmon init
```

This will:
1. Open your browser for GitHub login
2. Generate an API key
3. Register a background daemon
4. Start collecting token usage automatically

## What it does

**agentmon** watches your AI coding agent's JSONL log files in the background, aggregates token usage every 5 minutes, and sends it to a web dashboard where you can see:

- Token usage trends over time (input/output/cache breakdown)
- Cost per day, project, model, and agent
- "What if?" model cost simulation ("Opus instead of Sonnet would save $47")
- Organization dashboards for team usage

## Supported Agents

| Agent | Status |
|-------|--------|
| Claude Code | Supported |
| Codex | Coming soon |
| Gemini CLI | Coming soon |
| Cursor | Coming soon |

Adding a new agent requires implementing a single adapter interface. See `packages/agent/src/daemon/adapters/`.

## Architecture

```
Developer PC                          Cloud
+-----------------------+     +---------------------------+
|  agentmon daemon      |     |  agentmon.dev (Next.js)   |
|  (Bun compiled bin)   |     |                           |
|                       | --> |  /api/ingest              |
|  Watches:             |     |  Supabase PostgreSQL      |
|  ~/.claude/**/*.jsonl |     |  Web dashboard            |
+-----------------------+     +---------------------------+
```

## Development

```bash
# Install
pnpm install

# Dev (all packages)
pnpm dev

# Build
pnpm build

# Format
pnpm format

# Lint
pnpm check
```

### Project Structure

```
agentmon/
├── apps/web/          # Next.js 16 web dashboard
├── packages/agent/    # CLI daemon (Bun)
└── packages/shared/   # Shared code (pricing)
```

### CLI Commands

```bash
agentmon init          # OAuth + API key + daemon setup
agentmon start         # Start background daemon
agentmon stop          # Stop daemon
agentmon status        # Check daemon status + last sync
```

### Environment Variables (apps/web)

Copy `apps/web/.env.example` to `apps/web/.env` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Privacy

agentmon collects **only**:
- Project name (directory name)
- Model name
- Token counts (input, output, cache)
- Estimated cost

No code content, prompts, or responses are ever collected or transmitted.

## Tech Stack

- **CLI**: Bun + TypeScript, compiled binary
- **Web**: Next.js 16, shadcn/ui, Recharts
- **DB**: Supabase (PostgreSQL)
- **Auth**: GitHub OAuth via Supabase Auth
- **Deploy**: Vercel

## License

MIT
