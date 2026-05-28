-- PART 4: Final migrations and fixes

-- Migration: 20260131125030_38253c2e-788f-418d-9beb-21a08eb12196.sql
-- Drop and recreate the send_fraud_alert function to gracefully handle missing pg_net extension
CREATE OR REPLACE FUNCTION public.send_fraud_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify for high or critical severity
  IF NEW.severity IN ('high', 'critical') THEN
    -- Check if pg_net extension is available before trying to use it
    -- If not available, just skip the HTTP call (the flag is still recorded)
    BEGIN
      PERFORM net.http_post(
        url := 'https://fgugwcgrhepgkareudlc.supabase.co/functions/v1/fraud-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'flag_id', NEW.id,
          'transaction_id', NEW.transaction_id,
          'severity', NEW.severity,
          'flag_type', NEW.flag_type,
          'rule_id', NEW.rule_id
        )::text
      );
    EXCEPTION WHEN undefined_function THEN
      -- pg_net not available, silently continue
      -- The fraud flag is still recorded, just no HTTP notification
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
-- Migration: 20260201142007_e1d2df7d-c2e3-4802-b58c-8fe5ffb60362.sql
-- Add tracking infrastructure columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN tracking_method text NOT NULL DEFAULT 'manual' 
  CHECK (tracking_method IN ('webhook', 'manual', 'hybrid'));

ALTER TABLE public.campaigns 
ADD COLUMN webhook_endpoint text;

ALTER TABLE public.campaigns 
ADD COLUMN last_webhook_test timestamp with time zone;

-- Add comment explaining the tracking methods
COMMENT ON COLUMN public.campaigns.tracking_method IS 'How conversions are tracked: webhook (automatic postback), manual (user self-reports), hybrid (both methods)';
COMMENT ON COLUMN public.campaigns.webhook_endpoint IS 'Partner webhook endpoint for brands with their own tracking integration';
COMMENT ON COLUMN public.campaigns.last_webhook_test IS 'Timestamp of last successful webhook integration test';
-- Migration: 20260203103452_d527bff7-c1ca-4524-911f-1b79774ce836.sql
-- Remove tracking_method and webhook_endpoint columns from campaigns table
-- These are no longer needed as all tracking is now destination URL-based

-- First, set a placeholder destination_url for any campaigns that don't have one
UPDATE public.campaigns 
SET destination_url = 'https://example.com/configure-destination' 
WHERE destination_url IS NULL;

-- Now drop the obsolete columns
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS tracking_method;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS webhook_endpoint;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS last_webhook_test;

-- Ensure destination_url is required going forward
ALTER TABLE public.campaigns ALTER COLUMN destination_url SET NOT NULL;
-- Migration: 20260217093330_24f9b112-56d2-4182-b358-fce4d5531d30.sql

CREATE OR REPLACE FUNCTION public.process_cashback(p_user_id uuid, p_company_id uuid, p_campaign_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign_amount NUMERIC;
BEGIN
  -- Authorization: only admins or service role (auth.uid() IS NULL) can call this
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Validate campaign belongs to company and get the official cash_allotment
  SELECT cash_allotment INTO v_campaign_amount
  FROM public.campaigns
  WHERE id = p_campaign_id AND company_id = p_company_id;

  IF v_campaign_amount IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or does not belong to company';
  END IF;

  -- Check if company has enough balance using the campaign's actual amount
  IF NOT EXISTS (
    SELECT 1 FROM public.company_wallets 
    WHERE company_id = p_company_id AND balance >= v_campaign_amount
  ) THEN
    RETURN FALSE;
  END IF;

  -- Deduct from company wallet using validated amount
  UPDATE public.company_wallets
  SET 
    balance = balance - v_campaign_amount,
    total_spent = total_spent + v_campaign_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id;

  -- Record company transaction
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, -v_campaign_amount, 'cashback_paid', 'Cashback paid to customer');

  -- Add to user wallet (pending)
  UPDATE public.user_wallets
  SET 
    pending = pending + v_campaign_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record cashback transaction
  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (p_user_id, p_company_id, p_campaign_id, v_campaign_amount, 'pending');

  RETURN TRUE;
END;
$function$;

-- Migration: 20260217111036_a03d11fe-299a-479e-b2db-e8511e6aa1c7.sql

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true);

CREATE POLICY "Authenticated users can upload campaign media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view campaign media"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated users can update their media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their media"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);

-- Migration: 20260226055835_74a5681f-584f-4e49-b5dc-1730effb3c77.sql

-- Add reward_hold_days column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN reward_hold_days integer NOT NULL DEFAULT 7;

-- Create validation trigger for reward_hold_days (1-90 range)
CREATE OR REPLACE FUNCTION public.validate_reward_hold_days()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reward_hold_days < 1 OR NEW.reward_hold_days > 90 THEN
    RAISE EXCEPTION 'Reward hold days must be between 1 and 90';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_reward_hold_days_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_reward_hold_days();

-- Migration: 20260226061731_b07df90c-5c3f-423d-8f00-d118d482caec.sql

CREATE OR REPLACE FUNCTION public.process_conversion(p_tracking_id text, p_conversion_type text, p_conversion_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
  v_amount NUMERIC;
  v_hold_days INTEGER;
  v_final_amount NUMERIC;
  v_is_premium BOOLEAN;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;
  
  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;
  
  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;
  
  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;
  
  -- Update tracking click
  UPDATE public.tracking_clicks
  SET 
    status = 'converted',
    conversion_type = p_conversion_type,
    conversion_data = p_conversion_data,
    converted_at = now()
  WHERE id = v_click.id;
  
  -- Check if cashback transaction already exists
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;
  
  -- Get campaign cash allotment AND reward_hold_days
  SELECT cash_allotment, reward_hold_days INTO v_amount, v_hold_days
  FROM public.campaigns
  WHERE id = v_click.campaign_id;
  
  -- Get user's premium status
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM public.profiles
  WHERE id = v_click.user_id;
  
  -- Calculate final amount: 100% for premium, 70% for non-premium
  v_final_amount := CASE 
    WHEN v_is_premium = true THEN v_amount
    ELSE ROUND(v_amount * 0.70, 2)
  END;
  
  -- Create cashback transaction using the campaign's reward_hold_days
  INSERT INTO public.cashback_transactions (
    user_id, company_id, campaign_id, amount, status,
    tracking_click_id, verification_status, hold_until
  )
  VALUES (
    v_click.user_id, v_click.company_id, v_click.campaign_id, 
    v_final_amount, 'pending',
    v_click.id, 'pending', 
    now() + (COALESCE(v_hold_days, 7) || ' days')::INTERVAL
  )
  RETURNING id INTO v_tx_id;
  
  -- Calculate fraud risk
  v_risk_score := calculate_fraud_risk(v_tx_id);
  
  -- Apply fraud actions based on risk score
  v_fraud_result := apply_fraud_actions(v_tx_id, v_risk_score);
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id,
    'amount', v_final_amount,
    'is_premium_rate', v_is_premium,
    'risk_score', v_risk_score,
    'fraud_action', v_fraud_result->>'action'
  );
END;
$function$;
