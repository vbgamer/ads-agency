-- Store Integrations Table for Order Tracking
-- Supports Shopify, WooCommerce, and Custom API integrations

-- Create enum for integration platforms
CREATE TYPE public.integration_platform AS ENUM ('shopify', 'woocommerce', 'custom_api');

-- Create enum for integration status
CREATE TYPE public.integration_status AS ENUM ('pending', 'connected', 'disconnected', 'error');

-- Create enum for order event types
CREATE TYPE public.order_event_type AS ENUM ('order_placed', 'order_paid', 'order_fulfilled', 'order_shipped', 'custom');

-- Store integrations table
CREATE TABLE public.store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  platform integration_platform NOT NULL,
  status integration_status DEFAULT 'pending',
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Store details
  store_url TEXT,
  store_name TEXT,
  store_id TEXT,
  
  -- For custom API integrations
  api_endpoint TEXT,
  api_key TEXT,
  
  -- Webhook configuration
  webhook_id TEXT,
  webhook_secret TEXT,
  
  -- Settings
  auto_verify_conversions BOOLEAN DEFAULT true,
  tracked_events order_event_type[] DEFAULT ARRAY['order_paid']::order_event_type[],
  
  -- Metadata
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one integration per platform per company
  UNIQUE (company_id, platform)
);

-- Integration event logs for debugging and audit
CREATE TABLE public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.store_integrations(id) ON DELETE CASCADE NOT NULL,
  event_type order_event_type NOT NULL,
  
  -- Order details from the platform
  external_order_id TEXT NOT NULL,
  order_total NUMERIC,
  order_currency TEXT DEFAULT 'INR',
  customer_email TEXT,
  
  -- Tracking correlation
  tracking_id TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  conversion_created BOOLEAN DEFAULT false,
  error_message TEXT,
  
  -- Raw payload for debugging
  raw_payload JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_integrations
CREATE POLICY "Companies can view their own integrations" ON public.store_integrations
  FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own integrations" ON public.store_integrations
  FOR INSERT WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own integrations" ON public.store_integrations
  FOR UPDATE USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own integrations" ON public.store_integrations
  FOR DELETE USING (auth.uid() = company_id);

-- RLS Policies for integration_events
CREATE POLICY "Companies can view their integration events" ON public.integration_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_integrations si 
      WHERE si.id = integration_id AND si.company_id = auth.uid()
    )
  );

-- Function to process integration order event and create conversion
CREATE OR REPLACE FUNCTION public.process_integration_order(
  p_integration_id UUID,
  p_external_order_id TEXT,
  p_order_total NUMERIC,
  p_customer_email TEXT,
  p_tracking_id TEXT,
  p_event_type order_event_type,
  p_raw_payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_integration store_integrations%ROWTYPE;
  v_tracking tracking_clicks%ROWTYPE;
  v_campaign campaigns%ROWTYPE;
  v_event_id UUID;
  v_cashback_amount NUMERIC;
BEGIN
  -- Get integration details
  SELECT * INTO v_integration FROM store_integrations WHERE id = p_integration_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;
  
  -- Check if this event type is tracked
  IF NOT (p_event_type = ANY(v_integration.tracked_events)) THEN
    RETURN NULL;
  END IF;
  
  -- Create event log
  INSERT INTO integration_events (
    integration_id, event_type, external_order_id, order_total,
    customer_email, tracking_id, raw_payload
  ) VALUES (
    p_integration_id, p_event_type, p_external_order_id, p_order_total,
    p_customer_email, p_tracking_id, p_raw_payload
  ) RETURNING id INTO v_event_id;
  
  -- Try to find tracking click by tracking_id
  IF p_tracking_id IS NOT NULL THEN
    SELECT * INTO v_tracking FROM tracking_clicks 
    WHERE tracking_id = p_tracking_id AND status = 'clicked';
    
    IF FOUND THEN
      -- Get campaign details
      SELECT * INTO v_campaign FROM campaigns WHERE id = v_tracking.campaign_id;
      
      IF FOUND THEN
        -- Calculate cashback
        v_cashback_amount := (p_order_total * v_campaign.cashback_percent / 100);
        
        -- Update event with correlation
        UPDATE integration_events SET
          campaign_id = v_tracking.campaign_id,
          user_id = v_tracking.user_id,
          processed = true
        WHERE id = v_event_id;
        
        -- Auto-verify if enabled
        IF v_integration.auto_verify_conversions THEN
          -- Update tracking click status
          UPDATE tracking_clicks SET
            status = 'converted',
            converted_at = NOW(),
            order_value = p_order_total,
            cashback_amount = v_cashback_amount
          WHERE id = v_tracking.id;
          
          -- Create cashback transaction
          INSERT INTO cashback_transactions (
            user_id, company_id, campaign_id, amount, status
          ) VALUES (
            v_tracking.user_id, v_campaign.company_id, v_campaign.id, 
            v_cashback_amount, 'approved'
          );
          
          -- Update user wallet
          UPDATE user_wallets SET
            balance = balance + v_cashback_amount,
            updated_at = NOW()
          WHERE user_id = v_tracking.user_id;
          
          -- Update campaign conversions count
          UPDATE campaigns SET
            conversions = conversions + 1
          WHERE id = v_campaign.id;
          
          -- Mark conversion created
          UPDATE integration_events SET conversion_created = true WHERE id = v_event_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN v_event_id;
END;
$$;

-- Index for faster lookups
CREATE INDEX idx_store_integrations_company ON public.store_integrations(company_id);
CREATE INDEX idx_integration_events_integration ON public.integration_events(integration_id);
CREATE INDEX idx_integration_events_tracking ON public.integration_events(tracking_id);
CREATE INDEX idx_integration_events_order ON public.integration_events(external_order_id);
