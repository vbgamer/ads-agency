-- Remove tracking_method and webhook_endpoint columns from campaigns table
-- These are no longer needed as all tracking is now destination URL-based

-- First, set a placeholder destination_url for any campaigns that don't have one
UPDATE public.campaigns 
SET destination_url = 'https://example.com/configure-destination' 
WHERE destination_url IS NULL;

-- Now drop the obsolete columns
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS tracking_method;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS webhook_endpoint;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS last_webhook_test;

-- Ensure destination_url is required going forward
ALTER TABLE public.campaigns ALTER COLUMN destination_url SET NOT NULL;