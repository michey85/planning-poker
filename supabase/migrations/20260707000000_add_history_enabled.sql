-- add history_enabled flag to sessions
ALTER TABLE sessions
  ADD COLUMN history_enabled BOOLEAN NOT NULL DEFAULT true;
