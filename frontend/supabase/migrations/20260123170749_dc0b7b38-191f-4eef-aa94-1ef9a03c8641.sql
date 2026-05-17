-- processed_webhook_events is only accessed by edge functions using service role key
-- No user-facing RLS policies needed, but we'll add a placeholder to satisfy the linter
-- The table is purely for internal duplicate detection

-- Note: This table is accessed via service role key from edge functions only
-- No policies needed since service role bypasses RLS