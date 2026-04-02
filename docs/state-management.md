# State Management

## Zustand Store (`useVotingStore`)

Single global store holding all session state. Located at `src/store/useVotingStore.ts`.

### State Shape

```typescript
interface VotingState {
  sessionId: string | null;
  taskName: string | null;
  isRevealed: boolean;
  sessionClosed: boolean;
  userName: string | null;
  currentUserVote: string | null;
  votes: Vote[];
  rounds: Round[];
}
```

### Actions

| Action | Description |
|--------|-------------|
| `setUserName(name)` | Set username and persist to localStorage; inserts null-vote to join session |
| `joinSession(sessionId)` | Fetch session + votes + rounds from DB; restore username from localStorage if found |
| `createSession(taskName)` | Create session in DB, initialize store |
| `castVote(value)` | Optimistic update → DB upsert; rolls back on failure |
| `revealCards()` | Set `is_revealed = true` in DB |
| `resetVoting(consensusValue, taskName?)` | Save round history, reset all votes to null, optionally update task name |
| `renameUser(newName)` | Update username in DB and localStorage; rolls back on failure |
| `closeSession()` | Delete session from DB (cascades to votes), reset store |

### Sync Methods (called by real-time hook)

| Method | Trigger |
|--------|---------|
| `syncVotes(votes)` | Bulk replace after DELETE events (debounced) |
| `addVote(vote)` | Real-time INSERT on `votes` |
| `updateVote(vote)` | Real-time UPDATE on `votes` |
| `addRound(round)` | Real-time INSERT on `rounds` |
| `syncSession(updates)` | Real-time UPDATE on `sessions` |
| `markSessionClosed()` | Real-time DELETE on `sessions` |

### Derived State (Selectors)

```typescript
selectModerator(state)   // → earliest voter's user_name (by voted_at)
selectIsModerator(state) // → true if current user is the moderator
```

## Real-time Hook (`useRealtimeVotes`)

Located at `src/hooks/useRealtimeVotes.ts`.

Subscribes to a Supabase Realtime channel `session:{sessionId}` and dispatches store sync methods on Postgres Change events. Returns `connectionStatus`: `'connecting' | 'connected' | 'error'`.

DELETE events on `votes` are debounced (100ms) and trigger a full re-fetch to avoid stale state from batch deletes.

## Optimistic Updates

Vote casting uses optimistic updates:
1. Immediately set `currentUserVote` in store
2. Send DB upsert
3. On failure: roll back to previous vote value and show error toast

## Username Persistence

Usernames are stored in `localStorage` per session ID (`src/lib/sessionStorage.ts`). On rejoin, the stored name is matched against existing votes to restore the user's identity without re-prompting.
