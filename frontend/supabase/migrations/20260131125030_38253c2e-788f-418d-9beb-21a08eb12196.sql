-- Drop and recreate the send_fraud_alert function to gracefully handle missing pg_net extension
CREATE OR REPLACE FUNCTION public.send_fraud_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify for high or critical severity
  IF NEW.severity IN ('high', 'critical') THEN
    -- Check if pg_net extension is available before trying to use it
    -- If not available, just skip the HTTP call (the flag is still recorded)
    BEGIN
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
    EXCEPTION WHEN undefined_function THEN
      -- pg_net not available, silently continue
      -- The fraud flag is still recorded, just no HTTP notification
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;