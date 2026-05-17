-- Fix the function search path for validate_campaign_dates
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