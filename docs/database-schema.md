# Database Schema

Three tables in Supabase PostgreSQL with Row Level Security (RLS) enabled.

## Tables

### `sessions`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `task_name` | TEXT | — | Current task being estimated |
| `is_revealed` | BOOLEAN | `false` | Whether votes are visible |
| `created_at` | TIMESTAMPTZ | `NOW()` | Session creation time |

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);
```

### `votes`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `session_id` | UUID | — | FK → `sessions.id` (CASCADE delete) |
| `user_name` | TEXT | — | Participant name |
| `value` | TEXT | — | Vote value (null = joined but not voted) |
| `voted_at` | TIMESTAMPTZ | `NOW()` | Vote timestamp |

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  value TEXT,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_per_session UNIQUE(session_id, user_name)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for votes" ON votes
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_votes_session_id ON votes(session_id);
```

### `rounds`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `session_id` | UUID | — | FK → `sessions.id` |
| `round_number` | INTEGER | — | Sequential round number |
| `task_name` | TEXT | — | Task estimated in this round |
| `consensus_value` | TEXT | — | Final agreed-upon value |
| `created_at` | TIMESTAMPTZ | `NOW()` | Round completion time |

## Realtime Subscriptions

The app subscribes to Postgres Changes on all three tables filtered by `session_id`:

| Table | Events | Purpose |
|-------|--------|---------|
| `votes` | INSERT, UPDATE, DELETE | Track participants joining, voting, leaving |
| `sessions` | UPDATE, DELETE | Track reveal state changes, session closure |
| `rounds` | INSERT | Track new round history entries |

## Key Constraints

- `unique_user_per_session` on `votes(session_id, user_name)` — one vote per user per session, enforced via `UPSERT`
- `ON DELETE CASCADE` on `votes.session_id` — deleting a session removes all votes
