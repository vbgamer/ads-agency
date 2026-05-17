-- Add auto_verified column to cashback_transactions
ALTER TABLE public.cashback_transactions 
ADD COLUMN IF NOT EXISTS auto_verified boolean DEFAULT false;

-- Add index for efficient auto-verification queries
CREATE INDEX IF NOT EXISTS idx_cashback_pending_hold 
ON public.cashback_transactions (verification_status, hold_until) 
WHERE verification_status = 'pending';

-- Add processed_webhook_events table for duplicate detection
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id text NOT NULL,
  event_type text NOT NULL,
  event_hash text NOT NULL UNIQUE,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_processed_events_hash 
ON public.processed_webhook_events (event_hash);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processed_events_created 
ON public.processed_webhook_events (created_at);

-- Update verify_conversion function to support auto-verification
CREATE OR REPLACE FUNCTION public.verify_conversion(
  p_transaction_id uuid, 
  p_action text, 
  p_reason text DEFAULT NULL,
  p_auto_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Allow admin role OR system auto-verification (when p_auto_verified is true and called from service role)
  IF NOT p_auto_verified AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  IF p_action NOT IN ('verify', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: must be verify or reject';
  END IF;
  
  SELECT * INTO v_tx
  FROM public.cashback_transactions
  WHERE id = p_transaction_id;
  
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  IF v_tx.verification_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already processed');
  END IF;
  
  IF p_action = 'verify' THEN
    -- Update transaction to verified
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'verified',
      verified_at = now(),
      verified_by = CASE WHEN p_auto_verified THEN NULL ELSE auth.uid() END,
      auto_verified = p_auto_verified
    WHERE id = p_transaction_id;
    
    -- Credit user wallet
    UPDATE public.user_wallets
    SET 
      pending = pending + v_tx.amount,
      updated_at = now()
    WHERE user_id = v_tx.user_id;
    
  ELSE
    -- Reject the transaction
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'rejected',
      status = 'rejected',
      verified_at = now(),
      verified_by = CASE WHEN p_auto_verified THEN NULL ELSE auth.uid() END,
      rejection_reason = p_reason,
      auto_verified = p_auto_verified
    WHERE id = p_transaction_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'action', p_action, 'auto_verified', p_auto_verified);
END;
$$;