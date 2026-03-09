# Round History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist and display per-round estimation history (task name + moderator-picked consensus) for a session.

**Architecture:** Add a `rounds` table in Supabase. When the moderator clicks "New Round", the current round is saved (task name + consensus value chosen by moderator via card picker) before votes are reset. All participants see the history in real-time via a new Supabase Realtime subscription. History renders as a table section below `ParticipantsList`.

**Tech Stack:** Next.js App Router, Zustand 5, Supabase Realtime, TypeScript, Tailwind CSS 4, Biome

---

### Task 1: Create `rounds` table in Supabase

> This is a manual step — run the SQL in the Supabase dashboard SQL editor.

**Step 1: Run this SQL in Supabase dashboard → SQL Editor**

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

**Step 2: Verify**

In Supabase Table Editor, confirm the `rounds` table appears with the correct columns.

**Step 3: Enable Realtime for `rounds` table**

In Supabase dashboard → Database → Replication, ensure the `rounds` table is enabled for realtime (same as `votes` and `sessions`).

---

### Task 2: Add `Round` type

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the `Round` interface** at the end of `src/types/index.ts`:

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

**Step 2: Run lint to verify no errors**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Round type"
```

---

### Task 3: Add DB functions for rounds

**Files:**
- Modify: `src/lib/database.ts`

**Step 1: Add `Round` to the import** at line 1 of `src/lib/database.ts`:

```typescript
import type { CardValue, Round, Session, Vote } from '@/types';
```

**Step 2: Add two functions** at the end of `src/lib/database.ts` (after the `renameUser` function):

```typescript
// --- Rounds ---

export async function saveRound(
  sessionId: string,
  roundNumber: number,
  taskName: string,
  consensusValue: string,
): Promise<Round> {
  const { data, error } = await supabase
    .from('rounds')
    .insert({ session_id: sessionId, round_number: roundNumber, task_name: taskName, consensus_value: consensusValue })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRounds(sessionId: string): Promise<Round[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select()
    .eq('session_id', sessionId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/lib/database.ts
git commit -m "feat: add saveRound and getRounds DB functions"
```

---

### Task 4: Update Zustand store

**Files:**
- Modify: `src/store/useVotingStore.ts`

**Step 1: Add `Round` to the import** at line 9:

```typescript
import type { CardValue, Round, Vote } from '@/types';
```

**Step 2: Add `rounds` and `addRound` to the `VotingState` interface** (after `votes: Vote[];`):

```typescript
rounds: Round[];
addRound: (round: Round) => void;
```

**Step 3: Update `resetVoting` signature** in the interface (change the existing line):

```typescript
resetVoting: (consensusValue: string, taskName?: string) => Promise<void>;
```

**Step 4: Add `rounds: []` to `initialState`** (after `votes: [],`):

```typescript
rounds: [],
```

**Step 5: Update `joinSession`** to also fetch rounds. After `const votes = await db.getVotes(sessionId);`, add:

```typescript
const rounds = await db.getRounds(sessionId);
```

Then add `rounds` to the `set({...})` call:

```typescript
set({
  sessionId: session.id,
  taskName: session.task_name,
  isRevealed: session.is_revealed,
  votes,
  rounds,
  userName: restoredUserName,
  currentUserVote: restoredVote,
});
```

**Step 6: Replace the `resetVoting` implementation** with this updated version that saves the round first:

```typescript
resetVoting: async (consensusValue: string, taskName?: string) => {
  const {
    sessionId,
    isRevealed,
    currentUserVote,
    votes,
    rounds,
    taskName: prevTaskName,
  } = get();
  if (!sessionId) throw new Error('No active session');
  const roundNumber = rounds.length + 1;
  const roundTaskName = prevTaskName ?? '';
  set((state) => ({
    isRevealed: false,
    currentUserVote: null,
    votes: state.votes.map((v) => ({ ...v, value: null })),
    ...(taskName !== undefined ? { taskName } : {}),
  }));
  try {
    await db.saveRound(sessionId, roundNumber, roundTaskName, consensusValue);
    await db.resetSession(sessionId, taskName);
  } catch {
    set({ isRevealed, currentUserVote, votes, rounds, taskName: prevTaskName });
    pushToast('Failed to start new round. Please try again.', 'error');
  }
},
```

**Step 7: Add `addRound` action** (after the `updateVote` action):

```typescript
addRound: (round) =>
  set((state) => {
    if (state.rounds.some((r) => r.id === round.id)) return state;
    return { rounds: [...state.rounds, round] };
  }),
```

**Step 8: Run lint**

```bash
npm run lint
```

Expected: no errors. Fix any type errors (e.g., `db.saveRound` import).

**Step 9: Commit**

```bash
git add src/store/useVotingStore.ts
git commit -m "feat: add rounds state and update resetVoting to save round history"
```

---

### Task 5: Add rounds realtime subscription

**Files:**
- Modify: `src/hooks/useRealtimeVotes.ts`

**Step 1: Add `Round` to the import** at line 6:

```typescript
import type { Round, Vote } from '@/types';
```

**Step 2: Add the rounds subscription** to the existing channel, after the `sessions` DELETE subscription (before `.subscribe(...)`):

```typescript
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'rounds',
    filter: `session_id=eq.${sessionId}`,
  },
  (payload) => {
    useVotingStore.getState().addRound(payload.new as Round);
  },
)
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/hooks/useRealtimeVotes.ts
git commit -m "feat: subscribe to rounds table realtime inserts"
```

---

### Task 6: Update ModeratorControls with consensus picker

**Files:**
- Modify: `src/components/ModeratorControls.tsx`

**Step 1: Add `CARD_VALUES` to the imports** at the top:

```typescript
import { CARD_VALUES } from '@/types';
```

**Step 2: Add `consensusValue` local state** after the existing `useState` declarations (around line 25):

```typescript
const [consensusValue, setConsensusValue] = useState<string | null>(null);
```

**Step 3: Update `confirmNewRound`** to pass `consensusValue`. Replace the existing function:

```typescript
const confirmNewRound = async () => {
  if (!consensusValue) return;
  const name = newTaskName.trim();
  setIsResetting(true);
  try {
    await resetVoting(consensusValue, name && name !== taskName ? name : undefined);
    setShowNewRound(false);
    setConsensusValue(null);
  } finally {
    setIsResetting(false);
  }
};
```

**Step 4: Also clear `consensusValue` on cancel** — update the Cancel button's `onClick`:

```typescript
onClick={() => { setShowNewRound(false); setConsensusValue(null); }}
```

**Step 5: Add consensus card picker** inside the `showNewRound` block, between the task name input row and the button row. Insert after the closing `</div>` of the input row and before the button `<div className="flex gap-2">`:

```tsx
<div className="flex flex-wrap gap-1.5">
  <span className="text-sm text-foreground/60 w-full">Consensus:</span>
  {CARD_VALUES.map((v) => (
    <button
      key={v}
      type="button"
      onClick={() => setConsensusValue(v)}
      className={`rounded px-2.5 py-1 text-sm font-medium border transition-colors ${
        consensusValue === v
          ? 'bg-accent text-white border-accent'
          : 'border-border text-foreground/60 hover:border-accent'
      }`}
    >
      {v}
    </button>
  ))}
</div>
```

**Step 6: Disable "Start Round" until consensus is selected** — update the Start Round button's `disabled` prop:

```tsx
disabled={isResetting || !consensusValue}
```

**Step 7: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 8: Verify in browser**

1. Start a session, vote, reveal
2. Click "New Round" — confirm consensus card picker appears
3. Confirm "Start Round" is disabled until a card is selected
4. Select a card, click "Start Round" — confirm round resets

**Step 9: Commit**

```bash
git add src/components/ModeratorControls.tsx
git commit -m "feat: add consensus value picker to moderator new round flow"
```

---

### Task 7: Create RoundHistory component

**Files:**
- Create: `src/components/RoundHistory.tsx`

**Step 1: Create the file** `src/components/RoundHistory.tsx`:

```tsx
'use client';

import { useVotingStore } from '@/store/useVotingStore';

export default function RoundHistory() {
  const rounds = useVotingStore((s) => s.rounds);

  if (rounds.length === 0) return null;

  return (
    <section aria-label="Round history">
      <h2 className="mb-3 text-sm font-semibold text-foreground/60 uppercase tracking-wide">
        Round History
      </h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-2.5 text-left font-medium text-foreground/60 w-12">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-foreground/60">Task</th>
              <th className="px-4 py-2.5 text-right font-medium text-foreground/60 w-24">Consensus</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr key={round.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-foreground/40">{round.round_number}</td>
                <td className="px-4 py-2.5 text-foreground">{round.task_name}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-accent">{round.consensus_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

**Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/RoundHistory.tsx
git commit -m "feat: add RoundHistory component"
```

---

### Task 8: Wire RoundHistory into SessionRoom

**Files:**
- Modify: `src/components/SessionRoom.tsx`

**Step 1: Add the import** at the top of `src/components/SessionRoom.tsx` (with the other component imports):

```typescript
import RoundHistory from './RoundHistory';
```

**Step 2: Render `<RoundHistory />`** after `<ParticipantsList />` (line 98):

```tsx
<ParticipantsList />
<RoundHistory />
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Full end-to-end test in browser**

1. Create a session with task name "Login page"
2. Enter a username, vote with a card
3. Reveal cards
4. Click "New Round" — select consensus "5" — enter new task "Payment flow" — click "Start Round"
5. Confirm "Round History" section appears with: `1 | Login page | 5`
6. Complete round 2, start round 3
7. Confirm history shows both rounds in order
8. Open the session in a second browser tab — confirm history loads correctly on join
9. Complete another round in tab 1 — confirm tab 2 updates in real-time

**Step 5: Commit**

```bash
git add src/components/SessionRoom.tsx
git commit -m "feat: render RoundHistory in session room"
```
