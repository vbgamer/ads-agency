-- Add tracking infrastructure columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN tracking_method text NOT NULL DEFAULT 'manual' 
  CHECK (tracking_method IN ('webhook', 'manual', 'hybrid'));

ALTER TABLE public.campaigns 
ADD COLUMN webhook_endpoint text;

ALTER TABLE public.campaigns 
ADD COLUMN last_webhook_test timestamp with time zone;

-- Add comment explaining the tracking methods
COMMENT ON COLUMN public.campaigns.tracking_method IS 'How conversions are tracked: webhook (automatic postback), manual (user self-reports), hybrid (both methods)';
COMMENT ON COLUMN public.campaigns.webhook_endpoint IS 'Partner webhook endpoint for brands with their own tracking integration';
COMMENT ON COLUMN public.campaigns.last_webhook_test IS 'Timestamp of last successful webhook integration test';