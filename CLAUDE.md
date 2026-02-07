# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

## Project

Planning Poker — a real-time collaborative estimation app for Scrum teams. Users create or join sessions and vote on task complexity using Fibonacci cards. Built as an educational/demo project.

## Commands

```bash
npm run dev       # Next.js dev server (localhost:3000)
npm run build     # Production build
npm run lint      # Biome check (linting + formatting issues)
npm run format    # Biome auto-format with --write
```

No test framework is configured yet.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript (strict mode)
- **React Compiler** enabled via `next.config.ts`
- **Tailwind CSS 4** via `@tailwindcss/postcss`
Tailwind 4 with no config file (uses CSS-based configuration)
- **Zustand 5** for client-side state management
- **Supabase** for PostgreSQL database and real-time WebSocket subscriptions
- **Biome** for linting and formatting (replaces ESLint + Prettier)

## Code Style (enforced by Biome)

- Single quotes, always semicolons, trailing commas
- 2-space indentation, LF line endings
- Arrow parentheses: always
- Import organization enabled

## Architecture

**Routing**: App Router with two routes:
- `/` — home page (create or join a session)
- `/session/[id]` — dynamic session page for voting

**Path alias**: `@/*` maps to `./src/*`

**Planned source structure** (per SPEC.md):
- `src/components/` — React UI components (VotingCard, ParticipantsList, VotingResults, etc.)
- `src/store/` — Zustand store (`useVotingStore`) holding session state, user info, and votes
- `src/hooks/` — Custom hooks for real-time subscriptions (`useRealtimeVotes`) and session management (`useSession`)
- `src/lib/` — Supabase client initialization and utilities
- `src/types/` — TypeScript interfaces (Session, Vote, CardValue)

**Real-time flow**: Supabase Realtime channels broadcast vote changes to all session participants. The Zustand store is the single source of truth on the client.

**Database**: Two tables — `sessions` (id, task_name, is_revealed) and `votes` (id, session_id, user_name, value) with RLS policies allowing open access.

**Card values**: Fibonacci sequence `['1', '2', '3', '5', '8', '13', '21', '?']`

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

## Key Specification

See `SPEC.md` for the full technical specification including database schema SQL, TypeScript interfaces, Zustand store shape, implementation phases, and user flows.
