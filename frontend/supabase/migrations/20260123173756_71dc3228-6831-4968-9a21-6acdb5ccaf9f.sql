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