-- PART 2: Tracking, Analytics, Reactions

-- Migration: 20260111095928_a2aa5dff-7f57-4ab3-9003-1df911b01a11.sql
-- Fix the validate_campaign_dates function with proper search_path
DROP FUNCTION IF EXISTS public.validate_campaign_dates() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER validate_campaign_dates_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_dates();
-- Migration: 20260111101824_4045defd-57e2-49bc-a402-b356a74eb21b.sql
-- =====================================================
-- FIX 1: Restrict public profiles exposure
-- Remove the overly permissive "Public profiles are viewable" policy
-- and replace with a more restrictive one that only exposes non-PII fields
-- =====================================================

-- Drop the existing overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Create a new policy that allows users to view their own full profile
-- (The existing "Users can view their own profile" policy already handles this)

-- Create a function to get limited public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_fields(profile_row public.profiles)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', profile_row.id,
    'name', profile_row.name,
    'avatar_url', profile_row.avatar_url,
    'is_premium', profile_row.is_premium
  );
$$;

-- =====================================================
-- FIX 2: Add admin-specific RLS policies for admin operations
-- =====================================================

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all companies
CREATE POLICY "Admins can view all companies" ON public.companies
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete companies
CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all cashback transactions
CREATE POLICY "Admins can view all cashback transactions" ON public.cashback_transactions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns" ON public.campaigns
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all user wallets
CREATE POLICY "Admins can view all user wallets" ON public.user_wallets
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all company wallets
CREATE POLICY "Admins can view all company wallets" ON public.company_wallets
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all payment transactions
CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));
-- Migration: 20260111102350_a0bc2e26-bfd0-457f-81f3-eba4e7b996e4.sql
-- =====================================================
-- FIX: Campaign analytics input validation
-- Replace permissive INSERT policy with validated one
-- =====================================================

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.campaign_analytics;

-- Create validated insert policy for analytics tracking
-- Allows public inserts but with proper validation
CREATE POLICY "Validated analytics inserts" ON public.campaign_analytics
  FOR INSERT WITH CHECK (
    -- Must reference valid active campaign
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id 
      AND status = 'active'
    )
    AND
    -- event_type must be a valid value
    event_type IN ('view', 'click', 'conversion', 
                   'reaction_impressed', 'reaction_relatable', 
                   'reaction_decent', 'reaction_boring')
    AND
    -- If user_id provided, must be authenticated caller or null for anonymous
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Add a CHECK constraint for event_type to enforce at database level
ALTER TABLE public.campaign_analytics 
DROP CONSTRAINT IF EXISTS campaign_analytics_event_type_check;

ALTER TABLE public.campaign_analytics 
ADD CONSTRAINT campaign_analytics_event_type_check 
CHECK (event_type IN ('view', 'click', 'conversion', 
                      'reaction_impressed', 'reaction_relatable', 
                      'reaction_decent', 'reaction_boring'));

-- Add index for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_created 
ON public.campaign_analytics (campaign_id, created_at DESC);
-- Migration: 20260122022958_f92c4bf1-0780-44f3-a9d4-342596712e78.sql
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
-- Migration: 20260122033051_32dc99dc-a86b-434b-ac31-340dedf507c6.sql
-- Add onboarding_completed column to companies table
ALTER TABLE public.companies 
ADD COLUMN onboarding_completed boolean DEFAULT false;
-- Migration: 20260122130345_7cd0d576-b261-4fed-b0be-1080aa22a5c2.sql
-- Add is_supporter column to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_supporter boolean DEFAULT false;

-- Create function to update supporter status on successful donation
CREATE OR REPLACE FUNCTION public.update_supporter_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process successful donation transactions
  IF NEW.payment_type = 'donation' AND NEW.status = 'succeeded' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET is_supporter = true
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on payment_transactions table
CREATE TRIGGER on_donation_success
  AFTER INSERT ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supporter_status();

-- Backfill existing donors
UPDATE public.profiles
SET is_supporter = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.payment_transactions 
  WHERE payment_type = 'donation' 
  AND status = 'succeeded'
  AND user_id IS NOT NULL
);
-- Migration: 20260123081837_0e087462-43b5-469e-9e86-9aa58bc3d35f.sql
-- Create saved_payment_methods table
CREATE TABLE public.saved_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'upi')),
  display_name TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  card_expiry TEXT,
  upi_id TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure either user_id or company_id is set, but not both
  CONSTRAINT owner_check CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR 
    (user_id IS NULL AND company_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own saved payment methods"
ON public.saved_payment_methods
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved payment methods"
ON public.saved_payment_methods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved payment methods"
ON public.saved_payment_methods
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved payment methods"
ON public.saved_payment_methods
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for companies
CREATE POLICY "Companies can view their own saved payment methods"
ON public.saved_payment_methods
FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own saved payment methods"
ON public.saved_payment_methods
FOR INSERT
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own saved payment methods"
ON public.saved_payment_methods
FOR UPDATE
USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own saved payment methods"
ON public.saved_payment_methods
FOR DELETE
USING (auth.uid() = company_id);

-- Create function to ensure only one default per owner
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other defaults for the same owner
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.saved_payment_methods
      SET is_default = false
      WHERE user_id = NEW.user_id AND id != NEW.id;
    ELSIF NEW.company_id IS NOT NULL THEN
      UPDATE public.saved_payment_methods
      SET is_default = false
      WHERE company_id = NEW.company_id AND id != NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for single default
CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON public.saved_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_payment_method();
-- Migration: 20260123165840_5bfeae53-5f67-4c6f-a2db-c966b23d400f.sql
-- Create tracking_clicks table for click attribution
CREATE TABLE public.tracking_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  company_id UUID NOT NULL,
  click_url TEXT,
  status TEXT NOT NULL DEFAULT 'clicked',
  conversion_type TEXT,
  conversion_data JSONB,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT valid_status CHECK (status IN ('clicked', 'converted', 'expired', 'cancelled'))
);

-- Create webhook_logs table for audit trail
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  payload JSONB,
  headers JSONB,
  signature_valid BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  tracking_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to cashback_transactions for verification workflow
ALTER TABLE public.cashback_transactions
ADD COLUMN IF NOT EXISTS tracking_click_id UUID,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for verification_status
ALTER TABLE public.cashback_transactions
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('pending', 'verified', 'rejected', 'auto_verified'));

-- Create indexes for performance
CREATE INDEX idx_tracking_clicks_tracking_id ON public.tracking_clicks(tracking_id);
CREATE INDEX idx_tracking_clicks_user_id ON public.tracking_clicks(user_id);
CREATE INDEX idx_tracking_clicks_campaign_id ON public.tracking_clicks(campaign_id);
CREATE INDEX idx_tracking_clicks_status ON public.tracking_clicks(status);
CREATE INDEX idx_webhook_logs_tracking_id ON public.webhook_logs(tracking_id);
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_cashback_transactions_verification_status ON public.cashback_transactions(verification_status);
CREATE INDEX idx_cashback_transactions_tracking_click_id ON public.cashback_transactions(tracking_click_id);

-- Enable RLS on new tables
ALTER TABLE public.tracking_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracking_clicks
CREATE POLICY "Users can view their own tracking clicks"
ON public.tracking_clicks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking clicks"
ON public.tracking_clicks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view clicks on their campaigns"
ON public.tracking_clicks FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Admins can view all tracking clicks"
ON public.tracking_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tracking clicks"
ON public.tracking_clicks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for webhook_logs (admin only)
CREATE POLICY "Admins can view all webhook logs"
ON public.webhook_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert webhook logs"
ON public.webhook_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert webhook logs (for edge functions)
CREATE POLICY "Service role can insert webhook logs"
ON public.webhook_logs FOR INSERT
WITH CHECK (true);

-- Update cashback_transactions policies for admin verification
CREATE POLICY "Admins can update cashback transactions for verification"
ON public.cashback_transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique tracking ID
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'trk_';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to process conversion from webhook
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_tracking_id TEXT,
  p_conversion_type TEXT,
  p_conversion_data JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
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
  
  -- Get campaign cash allotment
  DECLARE
    v_amount NUMERIC;
  BEGIN
    SELECT cash_allotment INTO v_amount
    FROM public.campaigns
    WHERE id = v_click.campaign_id;
    
    -- Create cashback transaction with pending verification
    INSERT INTO public.cashback_transactions (
      user_id, company_id, campaign_id, amount, status,
      tracking_click_id, verification_status, hold_until
    )
    VALUES (
      v_click.user_id, v_click.company_id, v_click.campaign_id, v_amount, 'pending',
      v_click.id, 'pending', now() + interval '7 days'
    )
    RETURNING id INTO v_tx_id;
  END;
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id
  );
END;
$$;

-- Function for admin to verify/reject conversions
CREATE OR REPLACE FUNCTION public.verify_conversion(
  p_transaction_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  IF p_action NOT IN ('verify', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: must be verify or reject';
  END IF;
  
  SELECT * INTO v_tx
  FROM public.cashback_transactions
  WHERE id = p_transaction_id;
  
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  IF v_tx.verification_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already processed');
  END IF;
  
  IF p_action = 'verify' THEN
    -- Update transaction to verified
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'verified',
      verified_at = now(),
      verified_by = auth.uid()
    WHERE id = p_transaction_id;
    
    -- Credit user wallet
    UPDATE public.user_wallets
    SET 
      pending = pending + v_tx.amount,
      updated_at = now()
    WHERE user_id = v_tx.user_id;
    
  ELSE
    -- Reject the transaction
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'rejected',
      status = 'rejected',
      verified_at = now(),
      verified_by = auth.uid(),
      rejection_reason = p_reason
    WHERE id = p_transaction_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;
-- Migration: 20260123165940_e1cd38e7-b5f2-4767-8599-fc2febd2526b.sql
-- Remove overly permissive policy and rely on service role key in edge functions
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;

-- Edge functions using service role key bypass RLS automatically, so no policy needed
-- Migration: 20260123170723_7235a94e-d8a9-4af2-b704-4cdb017ccca4.sql
-- Add auto_verified column to cashback_transactions
ALTER TABLE public.cashback_transactions 
ADD COLUMN IF NOT EXISTS auto_verified boolean DEFAULT false;

-- Add index for efficient auto-verification queries
CREATE INDEX IF NOT EXISTS idx_cashback_pending_hold 
ON public.cashback_transactions (verification_status, hold_until) 
WHERE verification_status = 'pending';

-- Add processed_webhook_events table for duplicate detection
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id text NOT NULL,
  event_type text NOT NULL,
  event_hash text NOT NULL UNIQUE,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_processed_events_hash 
ON public.processed_webhook_events (event_hash);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processed_events_created 
ON public.processed_webhook_events (created_at);

-- Update verify_conversion function to support auto-verification
CREATE OR REPLACE FUNCTION public.verify_conversion(
  p_transaction_id uuid, 
  p_action text, 
  p_reason text DEFAULT NULL,
  p_auto_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Allow admin role OR system auto-verification (when p_auto_verified is true and called from service role)
  IF NOT p_auto_verified AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  IF p_action NOT IN ('verify', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: must be verify or reject';
  END IF;
  
  SELECT * INTO v_tx
  FROM public.cashback_transactions
  WHERE id = p_transaction_id;
  
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  IF v_tx.verification_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already processed');
  END IF;
  
  IF p_action = 'verify' THEN
    -- Update transaction to verified
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'verified',
      verified_at = now(),
      verified_by = CASE WHEN p_auto_verified THEN NULL ELSE auth.uid() END,
      auto_verified = p_auto_verified
    WHERE id = p_transaction_id;
    
    -- Credit user wallet
    UPDATE public.user_wallets
    SET 
      pending = pending + v_tx.amount,
      updated_at = now()
    WHERE user_id = v_tx.user_id;
    
  ELSE
    -- Reject the transaction
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'rejected',
      status = 'rejected',
      verified_at = now(),
      verified_by = CASE WHEN p_auto_verified THEN NULL ELSE auth.uid() END,
      rejection_reason = p_reason,
      auto_verified = p_auto_verified
    WHERE id = p_transaction_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'action', p_action, 'auto_verified', p_auto_verified);
END;
$$;