-- Create cashback_disputes table
CREATE TABLE public.cashback_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.cashback_transactions(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  order_id TEXT NOT NULL,
  expected_amount NUMERIC NOT NULL CHECK (expected_amount > 0 AND expected_amount <= 10000),
  actual_amount NUMERIC NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('missing_cashback', 'incorrect_amount', 'delayed_cashback', 'rejected_cashback')),
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution_notes TEXT,
  resolution_amount NUMERIC CHECK (resolution_amount >= 0),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashback_disputes ENABLE ROW LEVEL SECURITY;

-- Users can create their own disputes
CREATE POLICY "Users can create their own disputes"
  ON public.cashback_disputes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own disputes
CREATE POLICY "Users can view their own disputes"
  ON public.cashback_disputes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
  ON public.cashback_disputes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all disputes
CREATE POLICY "Admins can update all disputes"
  ON public.cashback_disputes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_cashback_disputes_user_id ON public.cashback_disputes(user_id);
CREATE INDEX idx_cashback_disputes_status ON public.cashback_disputes(status);
CREATE INDEX idx_cashback_disputes_created_at ON public.cashback_disputes(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_cashback_disputes_updated_at
  BEFORE UPDATE ON public.cashback_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();