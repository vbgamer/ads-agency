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