-- sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  value TEXT,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, user_name)
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS policies: public access for anonymous usage
CREATE POLICY "Allow public read on sessions"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on sessions"
  ON sessions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read on votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on votes"
  ON votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on votes"
  ON votes FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on votes"
  ON votes FOR DELETE
  USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
