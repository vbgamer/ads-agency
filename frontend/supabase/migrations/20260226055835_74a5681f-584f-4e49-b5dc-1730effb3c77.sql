
-- Add reward_hold_days column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN reward_hold_days integer NOT NULL DEFAULT 7;

-- Create validation trigger for reward_hold_days (1-90 range)
CREATE OR REPLACE FUNCTION public.validate_reward_hold_days()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reward_hold_days < 1 OR NEW.reward_hold_days > 90 THEN
    RAISE EXCEPTION 'Reward hold days must be between 1 and 90';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_reward_hold_days_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_reward_hold_days();
