# Getting Started

## Prerequisites

- Node.js 18+
- npm
- A Supabase project with the required tables (see [Database Schema](./database-schema.md))

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
