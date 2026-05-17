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