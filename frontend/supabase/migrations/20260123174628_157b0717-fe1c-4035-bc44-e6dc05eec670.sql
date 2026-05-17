-- Create fraud notification settings table
CREATE TABLE public.fraud_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notify_high_risk BOOLEAN DEFAULT true,
  notify_critical_risk BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification settings
CREATE POLICY "Admins can manage notification settings" 
ON public.fraud_notification_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to send fraud alerts via edge function
CREATE OR REPLACE FUNCTION public.send_fraud_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only notify for high or critical severity
  IF NEW.severity IN ('high', 'critical') THEN
    -- Get Supabase URL from environment
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);
    
    -- If settings not available, use direct approach with pg_net
    PERFORM net.http_post(
      url := 'https://fgugwcgrhepgkareudlc.supabase.co/functions/v1/fraud-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'flag_id', NEW.id,
        'transaction_id', NEW.transaction_id,
        'severity', NEW.severity,
        'flag_type', NEW.flag_type,
        'rule_id', NEW.rule_id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on fraud_flags table
CREATE TRIGGER trigger_fraud_alert
AFTER INSERT ON public.fraud_flags
FOR EACH ROW
EXECUTE FUNCTION public.send_fraud_alert();

-- Add index for faster notification queries
CREATE INDEX idx_fraud_notification_settings_user_id 
ON public.fraud_notification_settings(user_id);