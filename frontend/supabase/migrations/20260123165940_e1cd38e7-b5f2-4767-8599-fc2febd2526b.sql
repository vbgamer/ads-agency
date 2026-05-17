-- Remove overly permissive policy and rely on service role key in edge functions
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;

-- Edge functions using service role key bypass RLS automatically, so no policy needed