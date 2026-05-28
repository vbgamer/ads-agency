-- PART 3: Fraud, Support, Subscriptions

-- Migration: 20260123170749_dc0b7b38-191f-4eef-aa94-1ef9a03c8641.sql
-- processed_webhook_events is only accessed by edge functions using service role key
-- No user-facing RLS policies needed, but we'll add a placeholder to satisfy the linter
-- The table is purely for internal duplicate detection

-- Note: This table is accessed via service role key from edge functions only
-- No policies needed since service role bypasses RLS
-- Migration: 20260123171754_d35f663a-535f-4170-ae63-67bb92c76833.sql
-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role for cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
-- Migration: 20260123172709_9cb29286-a3c5-4810-8f58-6077d89ebc6f.sql
-- Add destination_url column to campaigns table for tracking redirects
ALTER TABLE public.campaigns 
ADD COLUMN destination_url TEXT;

COMMENT ON COLUMN public.campaigns.destination_url IS 
  'The URL where users are redirected when clicking the tracking link';
-- Migration: 20260123173756_71dc3228-6831-4968-9a21-6acdb5ccaf9f.sql
-- Create fraud_rules table for configurable detection rules
CREATE TABLE public.fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('velocity', 'pattern', 'amount', 'duplicate')),
  parameters JSONB NOT NULL DEFAULT '{}',
  action TEXT NOT NULL DEFAULT 'flag' CHECK (action IN ('flag', 'auto_reject', 'extend_hold')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fraud_flags table to track suspicious activity
CREATE TABLE public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.cashback_transactions(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.fraud_rules(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fraud_settings table for global configuration
CREATE TABLE public.fraud_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  default_hold_days INTEGER NOT NULL DEFAULT 7,
  high_risk_hold_days INTEGER NOT NULL DEFAULT 14,
  critical_risk_hold_days INTEGER NOT NULL DEFAULT 30,
  max_conversions_per_user_per_day INTEGER DEFAULT 3,
  max_conversions_per_user_per_campaign INTEGER DEFAULT 1,
  auto_reject_risk_threshold INTEGER DEFAULT 90,
  auto_verify_risk_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add fraud columns to cashback_transactions
ALTER TABLE public.cashback_transactions 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extended_hold_until TIMESTAMPTZ;

-- Enable RLS on fraud tables
ALTER TABLE public.fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for fraud_rules (admin only)
CREATE POLICY "Admins can manage fraud rules"
ON public.fraud_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for fraud_flags
CREATE POLICY "Admins can manage fraud flags"
ON public.fraud_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own fraud flags"
ON public.fraud_flags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cashback_transactions ct
    WHERE ct.id = fraud_flags.transaction_id AND ct.user_id = auth.uid()
  )
);

-- RLS policies for fraud_settings (admin only)
CREATE POLICY "Admins can manage fraud settings"
ON public.fraud_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default global fraud settings
INSERT INTO public.fraud_settings (company_id, default_hold_days, high_risk_hold_days, critical_risk_hold_days)
VALUES (NULL, 7, 14, 30);

-- Insert default fraud rules
INSERT INTO public.fraud_rules (name, description, rule_type, parameters, action, severity, is_active) VALUES
('Velocity Limit', 'More than N conversions per user per day', 'velocity', '{"max_per_day": 3, "time_window_hours": 24}', 'flag', 'medium', true),
('Duplicate Campaign', 'Same user claims same campaign twice', 'duplicate', '{}', 'auto_reject', 'critical', true),
('Rapid Conversion', 'Conversion within 60 seconds of click', 'pattern', '{"min_seconds": 60}', 'flag', 'high', true),
('High Value', 'Conversion amount above threshold', 'amount', '{"max_amount": 500}', 'flag', 'medium', true),
('New User Rush', 'Multiple conversions from account created within 24h', 'pattern', '{"max_conversions": 2, "account_age_hours": 24}', 'flag', 'high', true);

-- Create function to calculate fraud risk score
CREATE OR REPLACE FUNCTION public.calculate_fraud_risk(p_transaction_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
  v_rule RECORD;
  v_risk_score INTEGER := 0;
  v_flags_count INTEGER := 0;
  v_user_conversions_today INTEGER;
  v_campaign_conversions INTEGER;
  v_click_to_conversion_seconds INTEGER;
  v_user_account_age_hours INTEGER;
  v_user_recent_conversions INTEGER;
BEGIN
  -- Get transaction details
  SELECT ct.*, tc.created_at as click_created_at, p.created_at as user_created_at
  INTO v_tx
  FROM public.cashback_transactions ct
  LEFT JOIN public.tracking_clicks tc ON ct.tracking_click_id = tc.id
  LEFT JOIN public.profiles p ON ct.user_id = p.id
  WHERE ct.id = p_transaction_id;
  
  IF v_tx.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate metrics
  SELECT COUNT(*) INTO v_user_conversions_today
  FROM public.cashback_transactions
  WHERE user_id = v_tx.user_id
    AND created_at > now() - interval '24 hours'
    AND id != p_transaction_id;
  
  SELECT COUNT(*) INTO v_campaign_conversions
  FROM public.cashback_transactions
  WHERE user_id = v_tx.user_id
    AND campaign_id = v_tx.campaign_id
    AND id != p_transaction_id;
  
  IF v_tx.click_created_at IS NOT NULL THEN
    v_click_to_conversion_seconds := EXTRACT(EPOCH FROM (v_tx.created_at - v_tx.click_created_at))::INTEGER;
  END IF;
  
  IF v_tx.user_created_at IS NOT NULL THEN
    v_user_account_age_hours := EXTRACT(EPOCH FROM (now() - v_tx.user_created_at)) / 3600;
  END IF;
  
  -- Check each active rule
  FOR v_rule IN SELECT * FROM public.fraud_rules WHERE is_active = true LOOP
    DECLARE
      v_triggered BOOLEAN := false;
      v_severity_score INTEGER;
    BEGIN
      -- Calculate severity score
      v_severity_score := CASE v_rule.severity
        WHEN 'low' THEN 10
        WHEN 'medium' THEN 25
        WHEN 'high' THEN 40
        WHEN 'critical' THEN 50
        ELSE 20
      END;
      
      -- Check velocity limit
      IF v_rule.rule_type = 'velocity' THEN
        IF v_user_conversions_today >= COALESCE((v_rule.parameters->>'max_per_day')::INTEGER, 3) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check duplicate campaign
      IF v_rule.rule_type = 'duplicate' THEN
        IF v_campaign_conversions > 0 THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check rapid conversion
      IF v_rule.rule_type = 'pattern' AND v_rule.name = 'Rapid Conversion' THEN
        IF v_click_to_conversion_seconds IS NOT NULL 
           AND v_click_to_conversion_seconds < COALESCE((v_rule.parameters->>'min_seconds')::INTEGER, 60) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check high value
      IF v_rule.rule_type = 'amount' THEN
        IF v_tx.amount > COALESCE((v_rule.parameters->>'max_amount')::NUMERIC, 500) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check new user rush
      IF v_rule.rule_type = 'pattern' AND v_rule.name = 'New User Rush' THEN
        IF v_user_account_age_hours IS NOT NULL 
           AND v_user_account_age_hours < COALESCE((v_rule.parameters->>'account_age_hours')::INTEGER, 24) THEN
          SELECT COUNT(*) INTO v_user_recent_conversions
          FROM public.cashback_transactions
          WHERE user_id = v_tx.user_id;
          
          IF v_user_recent_conversions >= COALESCE((v_rule.parameters->>'max_conversions')::INTEGER, 2) THEN
            v_triggered := true;
          END IF;
        END IF;
      END IF;
      
      -- Create flag if triggered
      IF v_triggered THEN
        INSERT INTO public.fraud_flags (transaction_id, rule_id, flag_type, severity, details)
        VALUES (
          p_transaction_id, 
          v_rule.id, 
          v_rule.rule_type || '_' || lower(replace(v_rule.name, ' ', '_')),
          v_rule.severity,
          jsonb_build_object(
            'rule_name', v_rule.name,
            'user_conversions_today', v_user_conversions_today,
            'campaign_conversions', v_campaign_conversions,
            'click_to_conversion_seconds', v_click_to_conversion_seconds,
            'user_account_age_hours', v_user_account_age_hours
          )
        );
        
        v_risk_score := v_risk_score + v_severity_score;
        v_flags_count := v_flags_count + 1;
      END IF;
    END;
  END LOOP;
  
  -- Cap risk score at 100
  v_risk_score := LEAST(v_risk_score, 100);
  
  -- Update transaction with risk score and flags count
  UPDATE public.cashback_transactions
  SET risk_score = v_risk_score, fraud_flags_count = v_flags_count
  WHERE id = p_transaction_id;
  
  RETURN v_risk_score;
END;
$$;

-- Create function to apply fraud actions based on risk score
CREATE OR REPLACE FUNCTION public.apply_fraud_actions(p_transaction_id UUID, p_risk_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_action TEXT := 'none';
  v_new_hold_until TIMESTAMPTZ;
BEGIN
  -- Get global fraud settings
  SELECT * INTO v_settings
  FROM public.fraud_settings
  WHERE company_id IS NULL
  LIMIT 1;
  
  IF v_settings IS NULL THEN
    v_settings := ROW(NULL, NULL, 7, 14, 30, 3, 1, 90, 10, now(), now());
  END IF;
  
  -- Apply actions based on risk score
  IF p_risk_score >= v_settings.auto_reject_risk_threshold THEN
    -- Auto-reject high risk transactions
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'rejected',
      status = 'rejected',
      rejection_reason = 'Auto-rejected due to high fraud risk score: ' || p_risk_score
    WHERE id = p_transaction_id;
    v_action := 'auto_rejected';
    
  ELSIF p_risk_score >= 70 THEN
    -- Extend hold for critical risk
    v_new_hold_until := now() + (v_settings.critical_risk_hold_days || ' days')::INTERVAL;
    UPDATE public.cashback_transactions
    SET 
      extended_hold_until = v_new_hold_until,
      hold_until = v_new_hold_until
    WHERE id = p_transaction_id;
    v_action := 'extended_hold_critical';
    
  ELSIF p_risk_score >= 40 THEN
    -- Extend hold for high risk
    v_new_hold_until := now() + (v_settings.high_risk_hold_days || ' days')::INTERVAL;
    UPDATE public.cashback_transactions
    SET 
      extended_hold_until = v_new_hold_until,
      hold_until = v_new_hold_until
    WHERE id = p_transaction_id;
    v_action := 'extended_hold_high';
    
  ELSIF p_risk_score <= v_settings.auto_verify_risk_threshold THEN
    v_action := 'low_risk';
  END IF;
  
  RETURN jsonb_build_object(
    'action', v_action,
    'risk_score', p_risk_score,
    'new_hold_until', v_new_hold_until
  );
END;
$$;

-- Update process_conversion to include fraud checks
CREATE OR REPLACE FUNCTION public.process_conversion(p_tracking_id text, p_conversion_type text, p_conversion_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
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
    v_settings RECORD;
  BEGIN
    SELECT cash_allotment INTO v_amount
    FROM public.campaigns
    WHERE id = v_click.campaign_id;
    
    -- Get default hold period
    SELECT COALESCE(default_hold_days, 7) as default_hold_days INTO v_settings
    FROM public.fraud_settings
    WHERE company_id IS NULL
    LIMIT 1;
    
    -- Create cashback transaction with pending verification
    INSERT INTO public.cashback_transactions (
      user_id, company_id, campaign_id, amount, status,
      tracking_click_id, verification_status, hold_until
    )
    VALUES (
      v_click.user_id, v_click.company_id, v_click.campaign_id, v_amount, 'pending',
      v_click.id, 'pending', now() + (COALESCE(v_settings.default_hold_days, 7) || ' days')::INTERVAL
    )
    RETURNING id INTO v_tx_id;
  END;
  
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
    'risk_score', v_risk_score,
    'fraud_action', v_fraud_result->>'action'
  );
END;
$$;
-- Migration: 20260123174628_157b0717-fe1c-4035-bc44-e6dc05eec670.sql
-- Create fraud notification settings table
CREATE TABLE public.fraud_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notify_high_risk BOOLEAN DEFAULT true,
  notify_critical_risk BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification settings
CREATE POLICY "Admins can manage notification settings" 
ON public.fraud_notification_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to send fraud alerts via edge function
CREATE OR REPLACE FUNCTION public.send_fraud_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only notify for high or critical severity
  IF NEW.severity IN ('high', 'critical') THEN
    -- Get Supabase URL from environment
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);
    
    -- If settings not available, use direct approach with pg_net
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on fraud_flags table
CREATE TRIGGER trigger_fraud_alert
AFTER INSERT ON public.fraud_flags
FOR EACH ROW
EXECUTE FUNCTION public.send_fraud_alert();

-- Add index for faster notification queries
CREATE INDEX idx_fraud_notification_settings_user_id 
ON public.fraud_notification_settings(user_id);
-- Migration: 20260127153715_7b92a35d-e76e-4ba3-b01d-d32ec7816fda.sql
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_tracking_id text, 
  p_conversion_type text, 
  p_conversion_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
  v_amount NUMERIC;
  v_final_amount NUMERIC;
  v_is_premium BOOLEAN;
  v_settings RECORD;
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
  SELECT cash_allotment INTO v_amount
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
  
  -- Get default hold period
  SELECT COALESCE(default_hold_days, 7) as default_hold_days INTO v_settings
  FROM public.fraud_settings
  WHERE company_id IS NULL
  LIMIT 1;
  
  -- Create cashback transaction with calculated amount
  INSERT INTO public.cashback_transactions (
    user_id, company_id, campaign_id, amount, status,
    tracking_click_id, verification_status, hold_until
  )
  VALUES (
    v_click.user_id, v_click.company_id, v_click.campaign_id, 
    v_final_amount, 'pending',
    v_click.id, 'pending', 
    now() + (COALESCE(v_settings.default_hold_days, 7) || ' days')::INTERVAL
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
$$;
-- Migration: 20260128051609_66ee9dca-3aee-469f-bbb9-cce0fe407cc3.sql
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('cashback_issue', 'account_problem', 'technical_bug', 'payment_issue', 'general_inquiry')),
  subject TEXT NOT NULL CHECK (char_length(subject) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_ticket_messages table
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL CHECK (char_length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();

-- RLS Policies for support_tickets

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited - mainly for closing)
CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for support_ticket_messages

-- Users can view messages for their own tickets
CREATE POLICY "Users can view messages for their tickets"
  ON public.support_ticket_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = support_ticket_messages.ticket_id
    AND user_id = auth.uid()
  ));

-- Users can insert messages for their own tickets
CREATE POLICY "Users can insert messages for their tickets"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'user' AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = support_ticket_messages.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.support_ticket_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages for any ticket
CREATE POLICY "Admins can insert messages for any ticket"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'admin' AND
    sender_id = auth.uid() AND
    has_role(auth.uid(), 'admin'::app_role)
  );
-- Migration: 20260128052252_badeea8d-e778-4a81-aa0d-6bc453fcd15d.sql
-- Create cashback_disputes table
CREATE TABLE public.cashback_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.cashback_transactions(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  order_id TEXT NOT NULL,
  expected_amount NUMERIC NOT NULL CHECK (expected_amount > 0 AND expected_amount <= 10000),
  actual_amount NUMERIC NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('missing_cashback', 'incorrect_amount', 'delayed_cashback', 'rejected_cashback')),
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution_notes TEXT,
  resolution_amount NUMERIC CHECK (resolution_amount >= 0),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashback_disputes ENABLE ROW LEVEL SECURITY;

-- Users can create their own disputes
CREATE POLICY "Users can create their own disputes"
  ON public.cashback_disputes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own disputes
CREATE POLICY "Users can view their own disputes"
  ON public.cashback_disputes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
  ON public.cashback_disputes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all disputes
CREATE POLICY "Admins can update all disputes"
  ON public.cashback_disputes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_cashback_disputes_user_id ON public.cashback_disputes(user_id);
CREATE INDEX idx_cashback_disputes_status ON public.cashback_disputes(status);
CREATE INDEX idx_cashback_disputes_created_at ON public.cashback_disputes(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_cashback_disputes_updated_at
  BEFORE UPDATE ON public.cashback_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();
-- Migration: 20260130144256_5936aea9-fe0b-4de8-b688-1e01a3c7f226.sql
-- Create push_subscriptions table for storing user push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own push subscriptions
CREATE POLICY "Users can view own push subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions" 
  ON public.push_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions" 
  ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Create trigger to update updated_at on changes
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();
-- Migration: 20260131114444_40b146e1-6575-43fb-9ab1-aea5373ba1cf.sql
-- Add referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referral_discounts_available INTEGER DEFAULT 0;

-- Create index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  referred_reward NUMERIC DEFAULT 50,
  converted_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals table
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral as referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique 8-character referral code
CREATE OR REPLACE FUNCTION public.generate_user_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code TEXT;
  i INTEGER;
  existing_code TEXT;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO existing_code
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  LOOP
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
      -- Update user's profile with the new code
      UPDATE public.profiles
      SET referral_code = new_code
      WHERE id = p_user_id;
      
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to record a referral when a new user signs up with a referral code
CREATE OR REPLACE FUNCTION public.record_referral(p_referred_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, 'pending');
  
  RETURN TRUE;
END;
$$;

-- Function to process referral rewards when a referred user subscribes
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_id UUID;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
    AND status = 'pending';
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'No pending referral found');
  END IF;
  
  v_referrer_id := v_referral.referrer_id;
  
  -- Increment referrer's available discounts
  UPDATE public.profiles
  SET referral_discounts_available = COALESCE(referral_discounts_available, 0) + 1
  WHERE id = v_referrer_id;
  
  -- Credit ₹50 to referred user's wallet (pending balance)
  UPDATE public.user_wallets
  SET pending = COALESCE(pending, 0) + 50,
      updated_at = now()
  WHERE user_id = p_referred_user_id;
  
  -- Update referral status
  UPDATE public.referrals
  SET status = 'rewarded',
      converted_at = now(),
      rewarded_at = now()
  WHERE id = v_referral.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'referred_bonus', 50
  );
END;
$$;

-- Function to apply referral discount during subscription
CREATE OR REPLACE FUNCTION public.apply_referral_discount(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Get available discounts
  SELECT COALESCE(referral_discounts_available, 0) INTO v_available
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_available > 0 THEN
    -- Decrement available discounts
    UPDATE public.profiles
    SET referral_discounts_available = referral_discounts_available - 1
    WHERE id = p_user_id;
    
    RETURN 50; -- ₹50 discount
  END IF;
  
  RETURN 0;
END;
$$;

-- Update process_subscription_payment to include referral logic
CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_plan_id text, 
  p_amount numeric, 
  p_card_last_four text, 
  p_success boolean, 
  p_error_message text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_period_end timestamptz;
  v_discount INTEGER := 0;
  v_final_amount NUMERIC;
  v_referral_result JSONB;
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

  -- Apply referral discount if available
  v_discount := apply_referral_discount(auth.uid());
  v_final_amount := GREATEST(p_amount - v_discount, 0);

  -- Record transaction with final amount
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
    v_final_amount,
    'INR',
    CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    'subscription',
    p_card_last_four,
    NULLIF(p_error_message, '')
  );

  IF NOT p_success THEN
    RETURN jsonb_build_object('success', false, 'discount_applied', v_discount);
  END IF;

  IF p_plan_id = 'monthly' THEN
    v_period_end := v_now + interval '1 month';
  ELSIF p_plan_id = 'quarterly' THEN
    v_period_end := v_now + interval '3 months';
  ELSE
    v_period_end := v_now + interval '1 year';
  END IF;

  -- Upsert subscription
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

  -- Process referral reward if this user was referred
  v_referral_result := process_referral_reward(auth.uid());

  RETURN jsonb_build_object(
    'success', true, 
    'discount_applied', v_discount,
    'final_amount', v_final_amount,
    'referral_reward', v_referral_result
  );
END;
$$;