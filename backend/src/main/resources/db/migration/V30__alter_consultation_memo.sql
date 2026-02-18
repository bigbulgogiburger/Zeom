-- Add unique constraint on session_id for consultation_memo (one memo per session)
ALTER TABLE consultation_memo ADD CONSTRAINT uq_memo_session UNIQUE (session_id);
