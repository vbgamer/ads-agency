
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
