-- =====================================================
-- FIX: Campaign analytics input validation
-- Replace permissive INSERT policy with validated one
-- =====================================================

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.campaign_analytics;

-- Create validated insert policy for analytics tracking
-- Allows public inserts but with proper validation
CREATE POLICY "Validated analytics inserts" ON public.campaign_analytics
  FOR INSERT WITH CHECK (
    -- Must reference valid active campaign
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id 
      AND status = 'active'
    )
    AND
    -- event_type must be a valid value
    event_type IN ('view', 'click', 'conversion', 
                   'reaction_impressed', 'reaction_relatable', 
                   'reaction_decent', 'reaction_boring')
    AND
    -- If user_id provided, must be authenticated caller or null for anonymous
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Add a CHECK constraint for event_type to enforce at database level
ALTER TABLE public.campaign_analytics 
DROP CONSTRAINT IF EXISTS campaign_analytics_event_type_check;

ALTER TABLE public.campaign_analytics 
ADD CONSTRAINT campaign_analytics_event_type_check 
CHECK (event_type IN ('view', 'click', 'conversion', 
                      'reaction_impressed', 'reaction_relatable', 
                      'reaction_decent', 'reaction_boring'));

-- Add index for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_created 
ON public.campaign_analytics (campaign_id, created_at DESC);