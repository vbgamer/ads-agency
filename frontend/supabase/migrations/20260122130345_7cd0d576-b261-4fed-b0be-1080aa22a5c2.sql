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