-- Create saved_payment_methods table
CREATE TABLE public.saved_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'upi')),
  display_name TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  card_expiry TEXT,
  upi_id TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure either user_id or company_id is set, but not both
  CONSTRAINT owner_check CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR 
    (user_id IS NULL AND company_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own saved payment methods"
ON public.saved_payment_methods
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved payment methods"
ON public.saved_payment_methods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved payment methods"
ON public.saved_payment_methods
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved payment methods"
ON public.saved_payment_methods
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for companies
CREATE POLICY "Companies can view their own saved payment methods"
ON public.saved_payment_methods
FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own saved payment methods"
ON public.saved_payment_methods
FOR INSERT
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own saved payment methods"
ON public.saved_payment_methods
FOR UPDATE
USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own saved payment methods"
ON public.saved_payment_methods
FOR DELETE
USING (auth.uid() = company_id);

-- Create function to ensure only one default per owner
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other defaults for the same owner
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.saved_payment_methods
      SET is_default = false
      WHERE user_id = NEW.user_id AND id != NEW.id;
    ELSIF NEW.company_id IS NOT NULL THEN
      UPDATE public.saved_payment_methods
      SET is_default = false
      WHERE company_id = NEW.company_id AND id != NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for single default
CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON public.saved_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_payment_method();