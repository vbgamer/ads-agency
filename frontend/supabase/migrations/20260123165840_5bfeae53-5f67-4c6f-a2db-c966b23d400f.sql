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