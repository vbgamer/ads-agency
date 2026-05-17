-- Fix 1: add_funds_to_wallet authorization + validation
CREATE OR REPLACE FUNCTION public.add_funds_to_wallet(p_company_id uuid, p_amount numeric)
RETURNS public.company_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_wallet public.company_wallets;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> p_company_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot add funds to another company wallet';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, p_amount, 'deposit', 'Funds added to cashback pool');

  UPDATE public.company_wallets
  SET
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id
  RETURNING * INTO updated_wallet;

  IF updated_wallet.company_id IS NULL THEN
    RAISE EXCEPTION 'Company wallet not found';
  END IF;

  RETURN updated_wallet;
END;
$$;

-- Fix 2: Prevent client-controlled cashback amounts by forcing server-side insert via RPC
DROP POLICY IF EXISTS "Users can insert cashback transactions" ON public.cashback_transactions;

CREATE POLICY "No direct cashback inserts"
ON public.cashback_transactions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.create_cashback_transaction(p_campaign_id uuid)
RETURNS public.cashback_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign RECORD;
  v_tx public.cashback_transactions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, company_id, cash_allotment, status
  INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'Campaign is not active';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.cashback_transactions ct
    WHERE ct.campaign_id = p_campaign_id
      AND ct.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Deal already grabbed';
  END IF;

  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (auth.uid(), v_campaign.company_id, p_campaign_id, v_campaign.cash_allotment, 'pending')
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- Fix 3: Prevent users from self-granting premium by removing column privilege and moving premium upgrade to RPC
DO $$
BEGIN
  -- Remove direct update permission on is_premium from authenticated users
  REVOKE UPDATE (is_premium) ON public.profiles FROM authenticated;
EXCEPTION WHEN undefined_object THEN
  -- ignore if role doesn't exist in this environment
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_plan_id text,
  p_amount numeric,
  p_card_last_four text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := now();
  v_period_end timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_plan_id NOT IN ('monthly', 'quarterly', 'yearly') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_card_last_four IS NOT NULL AND length(p_card_last_four) > 4 THEN
    RAISE EXCEPTION 'Invalid card_last_four';
  END IF;

  -- Record transaction
  INSERT INTO public.payment_transactions (
    user_id,
    amount,
    currency,
    status,
    payment_type,
    card_last_four,
    error_message
  ) VALUES (
    auth.uid(),
    p_amount,
    'INR',
    CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    'subscription',
    p_card_last_four,
    NULLIF(p_error_message, '')
  );

  IF NOT p_success THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  IF p_plan_id = 'monthly' THEN
    v_period_end := v_now + interval '1 month';
  ELSIF p_plan_id = 'quarterly' THEN
    v_period_end := v_now + interval '3 months';
  ELSE
    v_period_end := v_now + interval '1 year';
  END IF;

  -- Upsert subscription (expects a unique constraint on subscriptions.user_id)
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, updated_at)
  VALUES (auth.uid(), p_plan_id, 'active', v_now, v_period_end, v_now)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = EXCLUDED.updated_at;

  UPDATE public.profiles
  SET is_premium = true
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;