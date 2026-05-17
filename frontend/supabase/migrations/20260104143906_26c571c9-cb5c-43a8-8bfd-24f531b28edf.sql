-- Function to check and update subscription status (handles expiration)
CREATE OR REPLACE FUNCTION public.check_subscription_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Find active subscription for user
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  IF v_subscription IS NULL THEN
    -- No active subscription, ensure is_premium is false
    UPDATE public.profiles SET is_premium = false WHERE id = p_user_id;
    RETURN false;
  END IF;
  
  -- Check if subscription has expired
  IF v_subscription.current_period_end < NOW() THEN
    -- Mark subscription as expired
    UPDATE public.subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_subscription.id;
    
    -- Remove premium status
    UPDATE public.profiles SET is_premium = false WHERE id = p_user_id;
    RETURN false;
  END IF;
  
  -- Subscription is still active
  RETURN true;
END;
$$;