# Architecture

## System Overview

```
┌─────────────────┐
│   Next.js App    │
│   (App Router)   │
│                  │
│  Zustand Store ◄─┼──── Single source of truth
│       ▲          │
│       │          │
│  useRealtimeVotes│◄─── Supabase Realtime (WebSocket)
└───────┼──────────┘
        │ HTTP + WebSocket
┌───────▼──────────┐
│    Supabase       │
│  ┌────────────┐   │
│  │ PostgreSQL │   │
│  └────────────┘   │
│  ┌────────────┐   │
│  │  Realtime  │   │
│  └────────────┘   │
└───────────────────┘
```

## Routing

| Route | Description |
|-------|-------------|
| `/` | Home page — create or join a session |
| `/session/[id]` | Session room — voting, results, moderator controls |
| `/guide` | Fibonacci card values explanation page |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Geist fonts, ToastContainer)
│   ├── page.tsx                # Home — CreateSessionForm, JoinSessionForm
│   ├── globals.css             # Global styles + Tailwind
│   ├── guide/
│   │   └── page.tsx            # Card values guide
│   └── session/
│       └── [id]/
│           └── page.tsx        # Session page (renders SessionRoom)
├── components/                 # UI components (see components.md)
├── hooks/
│   └── useRealtimeVotes.ts     # Supabase Realtime subscription hook
├── lib/
│   ├── database.ts             # Supabase CRUD operations
│   ├── sessionStorage.ts       # localStorage username persistence
│   └── toast.ts                # Toast notification system
├── store/
│   └── useVotingStore.ts       # Zustand store
├── types/
│   └── index.ts                # Session, Vote, Round, CardValue types
└── utils/
    └── supabase/
        ├── client.ts           # Browser Supabase client
        ├── server.ts           # Server Supabase client
        └── middleware.ts       # Supabase auth middleware
```

**Path alias**: `@/*` maps to `./src/*`

## Data Flow

1. **User action** → Zustand store action (optimistic update) → Supabase DB write
2. **DB change** → Supabase Realtime event → `useRealtimeVotes` hook → Zustand `sync*` / `add*` / `update*` methods
3. **Components** subscribe to Zustand selectors and re-render on state changes

## Authentication

No authentication — users identify by username per session. Usernames are persisted in `localStorage` keyed by session ID, allowing automatic reconnection.

## Moderator Role

The first user to join a session (earliest `voted_at` timestamp) is automatically the moderator. Only the moderator can reveal cards, start new rounds, and close the session.
