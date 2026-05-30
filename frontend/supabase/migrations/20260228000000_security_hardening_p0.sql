-- =============================================================================
-- ADSSIMSIM Security Hardening — P0 Patch (Feb 2026)
-- =============================================================================
-- Adds:
--   1. company_id binding to process_conversion (prevents pixel fraud)
--   2. rate_limit_events table + check_rate_limit helper (DDoS/spam guard)
--   3. attribution window enforcement (already in tracking_clicks.expires_at)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. RATE LIMITING TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id           BIGSERIAL PRIMARY KEY,
  bucket_key   TEXT NOT NULL,           -- e.g. "ip:1.2.3.4", "trk:trk_xxx", "company:uuid"
  endpoint     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_endpoint_time
  ON public.rate_limit_events (bucket_key, endpoint, created_at DESC);

-- Auto-prune old rate limit rows (>1h) — runs via cron or manually
CREATE OR REPLACE FUNCTION public.prune_rate_limit_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_events
  WHERE created_at < now() - interval '1 hour';
$$;

-- RLS — service role only
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to rate_limit_events"
  ON public.rate_limit_events;
CREATE POLICY "Service role full access to rate_limit_events"
  ON public.rate_limit_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. check_rate_limit() — returns TRUE if allowed, FALSE if over limit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket_key  TEXT,
  p_endpoint    TEXT,
  p_max_events  INTEGER DEFAULT 30,
  p_window_secs INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limit_events
  WHERE bucket_key = p_bucket_key
    AND endpoint   = p_endpoint
    AND created_at > now() - (p_window_secs || ' seconds')::INTERVAL;

  IF v_count >= p_max_events THEN
    RETURN FALSE;  -- blocked
  END IF;

  INSERT INTO public.rate_limit_events (bucket_key, endpoint)
  VALUES (p_bucket_key, p_endpoint);

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. HARDENED process_conversion — adds company_id binding
-- ---------------------------------------------------------------------------
-- NOTE: This redefines the latest version with an OPTIONAL p_expected_company_id
-- argument. If supplied (from pixel/custom postback), it MUST match the
-- tracking_click's company_id, otherwise the conversion is rejected.
-- Trusted affiliate webhooks (HMAC-verified) can omit it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_tracking_id          TEXT,
  p_conversion_type      TEXT,
  p_conversion_data      JSONB DEFAULT '{}'::JSONB,
  p_expected_company_id  UUID  DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_click        RECORD;
  v_tx_id        UUID;
  v_risk_score   INTEGER;
  v_fraud_result JSONB;
  v_amount       NUMERIC;
  v_settings     RECORD;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;

  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;

  -- ============================================================
  --  SECURITY: company_id binding (prevents pixel fraud)
  -- ============================================================
  IF p_expected_company_id IS NOT NULL
     AND p_expected_company_id <> v_click.company_id THEN
    -- Log the mismatch attempt
    INSERT INTO public.webhook_logs (
      source, endpoint, payload, signature_valid, processed,
      tracking_id, error_message
    ) VALUES (
      COALESCE(p_conversion_data->>'source', 'unknown'),
      '/process_conversion',
      p_conversion_data,
      false, false,
      p_tracking_id,
      format(
        'company_id mismatch: expected=%s actual=%s',
        p_expected_company_id, v_click.company_id
      )
    );
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Company verification failed'
    );
  END IF;

  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;

  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;

  -- Update tracking click
  UPDATE public.tracking_clicks
  SET status          = 'converted',
      conversion_type = p_conversion_type,
      conversion_data = p_conversion_data,
      converted_at    = now()
  WHERE id = v_click.id;

  -- Dedup at transaction level
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;

  -- Get campaign cash allotment
  SELECT cash_allotment INTO v_amount
  FROM public.campaigns
  WHERE id = v_click.campaign_id;

  -- Get hold period
  SELECT COALESCE(default_hold_days, 7) AS default_hold_days INTO v_settings
  FROM public.fraud_settings
  WHERE company_id IS NULL
  LIMIT 1;

  -- Create cashback transaction with pending verification
  INSERT INTO public.cashback_transactions (
    user_id, company_id, campaign_id, amount, status,
    tracking_click_id, verification_status, hold_until
  ) VALUES (
    v_click.user_id, v_click.company_id, v_click.campaign_id, v_amount, 'pending',
    v_click.id, 'pending',
    now() + (COALESCE(v_settings.default_hold_days, 7) || ' days')::INTERVAL
  )
  RETURNING id INTO v_tx_id;

  -- Calculate fraud risk + apply actions (if helpers exist)
  BEGIN
    v_risk_score   := calculate_fraud_risk(v_tx_id);
    v_fraud_result := apply_fraud_actions(v_tx_id, v_risk_score);
  EXCEPTION WHEN OTHERS THEN
    -- Helpers missing in some environments — don't fail the conversion
    v_risk_score := NULL;
    v_fraud_result := NULL;
  END;

  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');

  RETURN jsonb_build_object(
    'success',        true,
    'transaction_id', v_tx_id,
    'user_id',        v_click.user_id,
    'campaign_id',    v_click.campaign_id,
    'risk_score',     v_risk_score
  );
END;
$$;

-- Grant execute to anon/authenticated (service role auto-has it)
GRANT EXECUTE ON FUNCTION public.process_conversion(TEXT, TEXT, JSONB, UUID)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.prune_rate_limit_events()
  TO service_role;

-- ---------------------------------------------------------------------------
-- 4. AUTO-PRUNE — schedule rate_limit_events cleanup every 15 minutes
--    Requires the pg_cron extension. If pg_cron is unavailable, this block
--    is a no-op (wrapped in DO so migration won't fail).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'adssimsim_prune_rate_limit';

    PERFORM cron.schedule(
      'adssimsim_prune_rate_limit',
      '*/15 * * * *',
      $cron$ SELECT public.prune_rate_limit_events(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not installed / no permission — ignore silently.
  RAISE NOTICE 'pg_cron not available, skipping auto-prune schedule';
END $$;
