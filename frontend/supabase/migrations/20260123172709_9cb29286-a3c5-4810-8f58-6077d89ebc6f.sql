-- Add destination_url column to campaigns table for tracking redirects
ALTER TABLE public.campaigns 
ADD COLUMN destination_url TEXT;

COMMENT ON COLUMN public.campaigns.destination_url IS 
  'The URL where users are redirected when clicking the tracking link';