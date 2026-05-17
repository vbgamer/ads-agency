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