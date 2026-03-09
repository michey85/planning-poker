# Round History Design

**Date:** 2026-03-09
**Feature:** Per-session estimation round history

## Overview

Add a persistent, real-time round history section to the session page. After each voting round, the moderator picks a consensus value and clicks "New Round" — the completed round (task name + consensus) is saved to the database and displayed to all participants.

## Data Model

New `rounds` table in Supabase:

```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  consensus_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for rounds" ON rounds
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_rounds_session_id ON rounds(session_id);
```

TypeScript type added to `src/types/index.ts`:

```typescript
export interface Round {
  id: string;
  session_id: string;
  round_number: number;
  task_name: string;
  consensus_value: string;
  created_at: string;
}
```

## UI & Interaction Flow

**ModeratorControls:**
- After reveal, show a consensus card picker (Fibonacci values: 1, 2, 3, 5, 8, 13, 21, ?)
- "New Round" button disabled until moderator selects a consensus value
- On "New Round": save round to DB → reset votes → clear consensus picker

**RoundHistory section (new, below ParticipantsList):**
- Visible once at least 1 round exists
- Simple table showing round number, task name, consensus value
- Updates in real-time via Supabase Realtime subscription on `rounds` table

## Zustand Store Changes

- `rounds: Round[]` — list of completed rounds, populated on session join and updated via realtime
- `addRound(round: Round)` — called by realtime subscription on INSERT
- `newRound(consensusValue: string)` — saves round to DB then resets votes (replaces current `newRound`)

## Implementation Touchpoints

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Round` interface |
| `src/lib/database.ts` | Add `saveRound()` and `getRounds()` |
| `src/store/useVotingStore.ts` | Add `rounds`, `addRound`, update `newRound` to accept consensus |
| `src/hooks/useRealtimeVotes.ts` | Add subscription to `rounds` table |
| `src/components/ModeratorControls.tsx` | Add consensus card picker, gate "New Round" |
| `src/components/RoundHistory.tsx` | New component — rounds table |
| `src/components/SessionRoom.tsx` | Render `<RoundHistory />` below `<ParticipantsList />` |
