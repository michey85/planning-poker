# Getting Started

## Prerequisites

- Node.js 18+
- npm
- A Supabase project with the required tables (see [Database Schema](./database-schema.md)), or the local Supabase CLI (see below)

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Supabase (optional)

To run Supabase locally instead of against the hosted project (requires Docker Desktop and the `supabase` CLI, installed via `brew install supabase/tap/supabase`):

```bash
supabase start    # starts local Postgres, API, Studio, applies supabase/migrations/
supabase stop     # stops the local stack
```

`supabase start` prints local `API_URL` and `ANON_KEY` values — put those in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from `supabase start` output>
```

Studio UI: http://127.0.0.1:54323

## Installation

```bash
npm install
```

## Development

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # Biome check (linting + formatting)
npm run format    # Auto-format with Biome
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + React Compiler |
| Styling | Tailwind CSS 4 (CSS-based config, no `tailwind.config.js`) |
| State | Zustand 5 |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (WebSocket) |
| Linting | Biome (replaces ESLint + Prettier) |
| Deployment | Vercel |

## Code Style

Enforced by Biome:

- Single quotes, always semicolons, trailing commas
- 2-space indentation, LF line endings
- Arrow parentheses: always
- Automatic import organization
