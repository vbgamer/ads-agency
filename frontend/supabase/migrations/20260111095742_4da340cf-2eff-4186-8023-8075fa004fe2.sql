-- Add database constraints for campaign validation
-- Using triggers instead of CHECK constraints for time-based validations

-- Add constraint for title length (1-200 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_title_length 
CHECK (length(title) BETWEEN 1 AND 200);

-- Add constraint for positive cash_allotment
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_cash_positive 
CHECK (cash_allotment > 0);

-- Add constraint for date order using a trigger (since CHECK with dates can be problematic)
CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_campaign_dates_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_dates();

-- Add constraint for description length (max 2000 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_description_length 
CHECK (description IS NULL OR length(description) <= 2000);

-- Add constraint for code length (max 50 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_code_length 
CHECK (code IS NULL OR length(code) <= 50);

-- Add constraint for valid status values
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_status_values 
CHECK (status IS NULL OR status IN ('draft', 'active', 'paused', 'expired'));

-- Add constraint for valid ad_format values
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_ad_format_values 
CHECK (ad_format IS NULL OR ad_format IN ('landscape', 'reel', 'display'));