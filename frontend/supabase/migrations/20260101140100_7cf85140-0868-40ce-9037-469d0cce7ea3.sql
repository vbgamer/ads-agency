-- Create campaign_reactions table for persistent reaction storage
CREATE TABLE public.campaign_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('impressed', 'relatable', 'decent', 'boring')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.campaign_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_reactions
CREATE POLICY "Users can view their own reactions"
ON public.campaign_reactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reactions"
ON public.campaign_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.campaign_reactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Companies can view reactions on their campaigns"
ON public.campaign_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_reactions.campaign_id
    AND c.company_id = auth.uid()
  )
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_reactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_campaign_reactions_updated_at
BEFORE UPDATE ON public.campaign_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_reactions_updated_at();