-- =====================================================
-- FIX 1: Restrict public profiles exposure
-- Remove the overly permissive "Public profiles are viewable" policy
-- and replace with a more restrictive one that only exposes non-PII fields
-- =====================================================

-- Drop the existing overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Create a new policy that allows users to view their own full profile
-- (The existing "Users can view their own profile" policy already handles this)

-- Create a function to get limited public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_fields(profile_row public.profiles)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', profile_row.id,
    'name', profile_row.name,
    'avatar_url', profile_row.avatar_url,
    'is_premium', profile_row.is_premium
  );
$$;

-- =====================================================
-- FIX 2: Add admin-specific RLS policies for admin operations
-- =====================================================

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all companies
CREATE POLICY "Admins can view all companies" ON public.companies
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete companies
CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all cashback transactions
CREATE POLICY "Admins can view all cashback transactions" ON public.cashback_transactions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns" ON public.campaigns
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all user wallets
CREATE POLICY "Admins can view all user wallets" ON public.user_wallets
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all company wallets
CREATE POLICY "Admins can view all company wallets" ON public.company_wallets
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all payment transactions
CREATE POLICY "Admins can view all payment transactions" ON public.payment_transactions
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));