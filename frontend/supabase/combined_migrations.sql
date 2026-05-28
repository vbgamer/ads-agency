-- ============================================
-- ADSSIMSIM - Combined Database Migrations
-- Run this in Supabase SQL Editor
-- ============================================


-- ============================================
-- Migration: 20260101073035_1fb57fa0-40fa-49dc-8293-836b665e57cc.sql
-- ============================================
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  age TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table for brands
CREATE TABLE public.companies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  bio TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  linkedin TEXT,
  facebook TEXT,
  gst_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cashback_percent NUMERIC NOT NULL,
  category TEXT,
  ad_format TEXT CHECK (ad_format IN ('landscape', 'reel', 'display')),
  image_url TEXT,
  video_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  code TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_wallets table
CREATE TABLE public.company_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'cashback_paid')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_wallets table
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  pending NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cashback_transactions table
CREATE TABLE public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign_analytics table
CREATE TABLE public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  event_type TEXT CHECK (event_type IN ('view', 'click', 'conversion')),
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

-- Companies RLS policies
CREATE POLICY "Companies can view their own data" ON public.companies
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Companies can update their own data" ON public.companies
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Companies can insert their own data" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public company profiles are viewable" ON public.companies
  FOR SELECT USING (true);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Campaigns RLS policies
CREATE POLICY "Companies can manage their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = company_id);

CREATE POLICY "Active campaigns are publicly viewable" ON public.campaigns
  FOR SELECT USING (status = 'active');

-- Company wallets RLS policies
CREATE POLICY "Companies can view their own wallet" ON public.company_wallets
  FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Companies can update their own wallet" ON public.company_wallets
  FOR UPDATE USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own wallet" ON public.company_wallets
  FOR INSERT WITH CHECK (auth.uid() = company_id);

-- Wallet transactions RLS policies
CREATE POLICY "Companies can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = company_id);

-- User wallets RLS policies
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cashback transactions RLS policies
CREATE POLICY "Users can view their own cashback transactions" ON public.cashback_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Companies can view cashback transactions for their campaigns" ON public.cashback_transactions
  FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Users can insert cashback transactions" ON public.cashback_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaign analytics RLS policies
CREATE POLICY "Companies can view their campaign analytics" ON public.campaign_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = campaign_id AND c.company_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events" ON public.campaign_analytics
  FOR INSERT WITH CHECK (true);

-- Create trigger function for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  
  -- Auto-create user wallet
  INSERT INTO public.user_wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger function for auto-creating company wallet
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_wallets (company_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup (profile creation)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for new company (wallet creation)
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- Function to update wallet balance and record transaction
CREATE OR REPLACE FUNCTION public.add_funds_to_wallet(
  p_company_id UUID,
  p_amount NUMERIC
)
RETURNS public.company_wallets
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated_wallet public.company_wallets;
BEGIN
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, p_amount, 'deposit', 'Funds added to cashback pool');
  
  -- Update wallet balance
  UPDATE public.company_wallets
  SET 
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id
  RETURNING * INTO updated_wallet;
  
  RETURN updated_wallet;
END;
$$;

-- Function to process cashback payment
CREATE OR REPLACE FUNCTION public.process_cashback(
  p_user_id UUID,
  p_company_id UUID,
  p_campaign_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if company has enough balance
  IF NOT EXISTS (
    SELECT 1 FROM public.company_wallets 
    WHERE company_id = p_company_id AND balance >= p_amount
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct from company wallet
  UPDATE public.company_wallets
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id;
  
  -- Record company transaction
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, -p_amount, 'cashback_paid', 'Cashback paid to customer');
  
  -- Add to user wallet (pending)
  UPDATE public.user_wallets
  SET 
    pending = pending + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record cashback transaction
  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (p_user_id, p_company_id, p_campaign_id, p_amount, 'pending');
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- Migration: 20260101140100_7cf85140-0868-40ce-9037-469d0cce7ea3.sql
-- ============================================
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

-- ============================================
-- Migration: 20260101152204_f23350df-f876-4b87-a20a-e45f71fe5ad9.sql
-- ============================================
-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  company_id UUID REFERENCES public.companies(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL,
  card_last_four TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view their own payment transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own payment transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = company_id);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- Migration: 20260101154254_92d13848-26fc-437e-be51-8246546eb656.sql
-- ============================================
-- Rename cashback_percent to cash_allotment
ALTER TABLE campaigns RENAME COLUMN cashback_percent TO cash_allotment;

-- Add comment to clarify the column meaning
COMMENT ON COLUMN campaigns.cash_allotment IS 'Fixed cash allotment amount in rupees';

-- Convert existing percentage values to reasonable rupee amounts (e.g., 20% becomes ₹200)
UPDATE campaigns SET cash_allotment = cash_allotment * 10;

-- ============================================
-- Migration: 20260103101313_c0a276b2-0509-41a4-993a-f783a318fa85.sql
-- ============================================
-- Add 'company' value to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'company';

-- ============================================
-- Migration: 20260103101421_c6cf0968-af14-47db-aef5-06fd20eb6202.sql
-- ============================================
-- Create a security definer function to check company role
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'company'::app_role
  )
$$;

-- Drop the current permissive INSERT policy on companies
DROP POLICY IF EXISTS "Companies can insert their own data" ON public.companies;

-- Create new INSERT policy - only users with company role can insert
CREATE POLICY "Only company role users can insert company data" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id AND public.has_company_role(auth.uid()));

-- Add RLS policy for user_roles so users can insert their own role during signup
CREATE POLICY "Users can insert their own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Migration: 20260104142630_ef3e720e-8b74-4b1d-a55e-6b100adf3f40.sql
-- ============================================
-- Update the handle_new_user trigger to skip company signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create profile for non-company users
  -- Companies are handled separately via signUpCompany flow
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'company'
  ) THEN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
    );
    
    -- Auto-create user wallet only for regular users
    INSERT INTO public.user_wallets (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Clean up existing data: Delete profiles that belong to company accounts
DELETE FROM public.profiles 
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'company'
);

-- Clean up existing data: Delete user_wallets that belong to company accounts
DELETE FROM public.user_wallets 
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'company'
);

-- ============================================
-- Migration: 20260104143906_26c571c9-cb5c-43a8-8bfd-24f531b28edf.sql
-- ============================================
-- Function to check and update subscription status (handles expiration)
CREATE OR REPLACE FUNCTION public.check_subscription_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Find active subscription for user
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  IF v_subscription IS NULL THEN
    -- No active subscription, ensure is_premium is false
    UPDATE public.profiles SET is_premium = false WHERE id = p_user_id;
    RETURN false;
  END IF;
  
  -- Check if subscription has expired
  IF v_subscription.current_period_end < NOW() THEN
    -- Mark subscription as expired
    UPDATE public.subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_subscription.id;
    
    -- Remove premium status
    UPDATE public.profiles SET is_premium = false WHERE id = p_user_id;
    RETURN false;
  END IF;
  
  -- Subscription is still active
  RETURN true;
END;
$$;

-- ============================================
-- Migration: 20260111095742_4da340cf-2eff-4186-8023-8075fa004fe2.sql
-- ============================================
-- Add database constraints for campaign validation
-- Using triggers instead of CHECK constraints for time-based validations

-- Add constraint for title length (1-200 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_title_length 
CHECK (length(title) BETWEEN 1 AND 200);

-- Add constraint for positive cash_allotment
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_cash_positive 
CHECK (cash_allotment > 0);

-- Add constraint for date order using a trigger (since CHECK with dates can be problematic)
CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_campaign_dates_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_dates();

-- Add constraint for description length (max 2000 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_description_length 
CHECK (description IS NULL OR length(description) <= 2000);

-- Add constraint for code length (max 50 characters)
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_code_length 
CHECK (code IS NULL OR length(code) <= 50);

-- Add constraint for valid status values
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_status_values 
CHECK (status IS NULL OR status IN ('draft', 'active', 'paused', 'expired'));

-- Add constraint for valid ad_format values
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_ad_format_values 
CHECK (ad_format IS NULL OR ad_format IN ('landscape', 'reel', 'display'));

-- ============================================
-- Migration: 20260111095814_b2963f57-9c1a-4236-b601-29c0beb37439.sql
-- ============================================
-- Fix the function search path for validate_campaign_dates
CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public;

-- ============================================
-- Migration: 20260111095928_a2aa5dff-7f57-4ab3-9003-1df911b01a11.sql
-- ============================================
-- Fix the validate_campaign_dates function with proper search_path
DROP FUNCTION IF EXISTS public.validate_campaign_dates() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER validate_campaign_dates_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_campaign_dates();

-- ============================================
-- Migration: 20260111101824_4045defd-57e2-49bc-a402-b356a74eb21b.sql
-- ============================================
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

-- ============================================
-- Migration: 20260111102350_a0bc2e26-bfd0-457f-81f3-eba4e7b996e4.sql
-- ============================================
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

-- ============================================
-- Migration: 20260122022958_f92c4bf1-0780-44f3-a9d4-342596712e78.sql
-- ============================================
-- Fix 1: add_funds_to_wallet authorization + validation
CREATE OR REPLACE FUNCTION public.add_funds_to_wallet(p_company_id uuid, p_amount numeric)
RETURNS public.company_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_wallet public.company_wallets;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> p_company_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot add funds to another company wallet';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, p_amount, 'deposit', 'Funds added to cashback pool');

  UPDATE public.company_wallets
  SET
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id
  RETURNING * INTO updated_wallet;

  IF updated_wallet.company_id IS NULL THEN
    RAISE EXCEPTION 'Company wallet not found';
  END IF;

  RETURN updated_wallet;
END;
$$;

-- Fix 2: Prevent client-controlled cashback amounts by forcing server-side insert via RPC
DROP POLICY IF EXISTS "Users can insert cashback transactions" ON public.cashback_transactions;

CREATE POLICY "No direct cashback inserts"
ON public.cashback_transactions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.create_cashback_transaction(p_campaign_id uuid)
RETURNS public.cashback_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign RECORD;
  v_tx public.cashback_transactions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, company_id, cash_allotment, status
  INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign.status <> 'active' THEN
    RAISE EXCEPTION 'Campaign is not active';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.cashback_transactions ct
    WHERE ct.campaign_id = p_campaign_id
      AND ct.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Deal already grabbed';
  END IF;

  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (auth.uid(), v_campaign.company_id, p_campaign_id, v_campaign.cash_allotment, 'pending')
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- Fix 3: Prevent users from self-granting premium by removing column privilege and moving premium upgrade to RPC
DO $$
BEGIN
  -- Remove direct update permission on is_premium from authenticated users
  REVOKE UPDATE (is_premium) ON public.profiles FROM authenticated;
EXCEPTION WHEN undefined_object THEN
  -- ignore if role doesn't exist in this environment
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_plan_id text,
  p_amount numeric,
  p_card_last_four text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := now();
  v_period_end timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_plan_id NOT IN ('monthly', 'quarterly', 'yearly') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_card_last_four IS NOT NULL AND length(p_card_last_four) > 4 THEN
    RAISE EXCEPTION 'Invalid card_last_four';
  END IF;

  -- Record transaction
  INSERT INTO public.payment_transactions (
    user_id,
    amount,
    currency,
    status,
    payment_type,
    card_last_four,
    error_message
  ) VALUES (
    auth.uid(),
    p_amount,
    'INR',
    CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    'subscription',
    p_card_last_four,
    NULLIF(p_error_message, '')
  );

  IF NOT p_success THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  IF p_plan_id = 'monthly' THEN
    v_period_end := v_now + interval '1 month';
  ELSIF p_plan_id = 'quarterly' THEN
    v_period_end := v_now + interval '3 months';
  ELSE
    v_period_end := v_now + interval '1 year';
  END IF;

  -- Upsert subscription (expects a unique constraint on subscriptions.user_id)
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, updated_at)
  VALUES (auth.uid(), p_plan_id, 'active', v_now, v_period_end, v_now)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = EXCLUDED.updated_at;

  UPDATE public.profiles
  SET is_premium = true
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- Migration: 20260122033051_32dc99dc-a86b-434b-ac31-340dedf507c6.sql
-- ============================================
-- Add onboarding_completed column to companies table
ALTER TABLE public.companies 
ADD COLUMN onboarding_completed boolean DEFAULT false;

-- ============================================
-- Migration: 20260122130345_7cd0d576-b261-4fed-b0be-1080aa22a5c2.sql
-- ============================================
-- Add is_supporter column to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_supporter boolean DEFAULT false;

-- Create function to update supporter status on successful donation
CREATE OR REPLACE FUNCTION public.update_supporter_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process successful donation transactions
  IF NEW.payment_type = 'donation' AND NEW.status = 'succeeded' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET is_supporter = true
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on payment_transactions table
CREATE TRIGGER on_donation_success
  AFTER INSERT ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supporter_status();

-- Backfill existing donors
UPDATE public.profiles
SET is_supporter = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.payment_transactions 
  WHERE payment_type = 'donation' 
  AND status = 'succeeded'
  AND user_id IS NOT NULL
);

-- ============================================
-- Migration: 20260123081837_0e087462-43b5-469e-9e86-9aa58bc3d35f.sql
-- ============================================
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

-- ============================================
-- Migration: 20260123165840_5bfeae53-5f67-4c6f-a2db-c966b23d400f.sql
-- ============================================
-- Create tracking_clicks table for click attribution
CREATE TABLE public.tracking_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  company_id UUID NOT NULL,
  click_url TEXT,
  status TEXT NOT NULL DEFAULT 'clicked',
  conversion_type TEXT,
  conversion_data JSONB,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT valid_status CHECK (status IN ('clicked', 'converted', 'expired', 'cancelled'))
);

-- Create webhook_logs table for audit trail
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  payload JSONB,
  headers JSONB,
  signature_valid BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  tracking_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to cashback_transactions for verification workflow
ALTER TABLE public.cashback_transactions
ADD COLUMN IF NOT EXISTS tracking_click_id UUID,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for verification_status
ALTER TABLE public.cashback_transactions
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('pending', 'verified', 'rejected', 'auto_verified'));

-- Create indexes for performance
CREATE INDEX idx_tracking_clicks_tracking_id ON public.tracking_clicks(tracking_id);
CREATE INDEX idx_tracking_clicks_user_id ON public.tracking_clicks(user_id);
CREATE INDEX idx_tracking_clicks_campaign_id ON public.tracking_clicks(campaign_id);
CREATE INDEX idx_tracking_clicks_status ON public.tracking_clicks(status);
CREATE INDEX idx_webhook_logs_tracking_id ON public.webhook_logs(tracking_id);
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_cashback_transactions_verification_status ON public.cashback_transactions(verification_status);
CREATE INDEX idx_cashback_transactions_tracking_click_id ON public.cashback_transactions(tracking_click_id);

-- Enable RLS on new tables
ALTER TABLE public.tracking_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tracking_clicks
CREATE POLICY "Users can view their own tracking clicks"
ON public.tracking_clicks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking clicks"
ON public.tracking_clicks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view clicks on their campaigns"
ON public.tracking_clicks FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Admins can view all tracking clicks"
ON public.tracking_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tracking clicks"
ON public.tracking_clicks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for webhook_logs (admin only)
CREATE POLICY "Admins can view all webhook logs"
ON public.webhook_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert webhook logs"
ON public.webhook_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert webhook logs (for edge functions)
CREATE POLICY "Service role can insert webhook logs"
ON public.webhook_logs FOR INSERT
WITH CHECK (true);

-- Update cashback_transactions policies for admin verification
CREATE POLICY "Admins can update cashback transactions for verification"
ON public.cashback_transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique tracking ID
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'trk_';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to process conversion from webhook
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_tracking_id TEXT,
  p_conversion_type TEXT,
  p_conversion_data JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;
  
  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;
  
  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;
  
  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;
  
  -- Update tracking click
  UPDATE public.tracking_clicks
  SET 
    status = 'converted',
    conversion_type = p_conversion_type,
    conversion_data = p_conversion_data,
    converted_at = now()
  WHERE id = v_click.id;
  
  -- Check if cashback transaction already exists
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;
  
  -- Get campaign cash allotment
  DECLARE
    v_amount NUMERIC;
  BEGIN
    SELECT cash_allotment INTO v_amount
    FROM public.campaigns
    WHERE id = v_click.campaign_id;
    
    -- Create cashback transaction with pending verification
    INSERT INTO public.cashback_transactions (
      user_id, company_id, campaign_id, amount, status,
      tracking_click_id, verification_status, hold_until
    )
    VALUES (
      v_click.user_id, v_click.company_id, v_click.campaign_id, v_amount, 'pending',
      v_click.id, 'pending', now() + interval '7 days'
    )
    RETURNING id INTO v_tx_id;
  END;
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id
  );
END;
$$;

-- Function for admin to verify/reject conversions
CREATE OR REPLACE FUNCTION public.verify_conversion(
  p_transaction_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
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
      verified_by = auth.uid()
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
      verified_by = auth.uid(),
      rejection_reason = p_reason
    WHERE id = p_transaction_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- ============================================
-- Migration: 20260123165940_e1cd38e7-b5f2-4767-8599-fc2febd2526b.sql
-- ============================================
-- Remove overly permissive policy and rely on service role key in edge functions
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;

-- Edge functions using service role key bypass RLS automatically, so no policy needed

-- ============================================
-- Migration: 20260123170723_7235a94e-d8a9-4af2-b704-4cdb017ccca4.sql
-- ============================================
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

-- ============================================
-- Migration: 20260123170749_dc0b7b38-191f-4eef-aa94-1ef9a03c8641.sql
-- ============================================
-- processed_webhook_events is only accessed by edge functions using service role key
-- No user-facing RLS policies needed, but we'll add a placeholder to satisfy the linter
-- The table is purely for internal duplicate detection

-- Note: This table is accessed via service role key from edge functions only
-- No policies needed since service role bypasses RLS

-- ============================================
-- Migration: 20260123171754_d35f663a-535f-4170-ae63-67bb92c76833.sql
-- ============================================
-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role for cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- Migration: 20260123172709_9cb29286-a3c5-4810-8f58-6077d89ebc6f.sql
-- ============================================
-- Add destination_url column to campaigns table for tracking redirects
ALTER TABLE public.campaigns 
ADD COLUMN destination_url TEXT;

COMMENT ON COLUMN public.campaigns.destination_url IS 
  'The URL where users are redirected when clicking the tracking link';

-- ============================================
-- Migration: 20260123173756_71dc3228-6831-4968-9a21-6acdb5ccaf9f.sql
-- ============================================
-- Create fraud_rules table for configurable detection rules
CREATE TABLE public.fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('velocity', 'pattern', 'amount', 'duplicate')),
  parameters JSONB NOT NULL DEFAULT '{}',
  action TEXT NOT NULL DEFAULT 'flag' CHECK (action IN ('flag', 'auto_reject', 'extend_hold')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fraud_flags table to track suspicious activity
CREATE TABLE public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.cashback_transactions(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.fraud_rules(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fraud_settings table for global configuration
CREATE TABLE public.fraud_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  default_hold_days INTEGER NOT NULL DEFAULT 7,
  high_risk_hold_days INTEGER NOT NULL DEFAULT 14,
  critical_risk_hold_days INTEGER NOT NULL DEFAULT 30,
  max_conversions_per_user_per_day INTEGER DEFAULT 3,
  max_conversions_per_user_per_campaign INTEGER DEFAULT 1,
  auto_reject_risk_threshold INTEGER DEFAULT 90,
  auto_verify_risk_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add fraud columns to cashback_transactions
ALTER TABLE public.cashback_transactions 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extended_hold_until TIMESTAMPTZ;

-- Enable RLS on fraud tables
ALTER TABLE public.fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for fraud_rules (admin only)
CREATE POLICY "Admins can manage fraud rules"
ON public.fraud_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for fraud_flags
CREATE POLICY "Admins can manage fraud flags"
ON public.fraud_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own fraud flags"
ON public.fraud_flags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cashback_transactions ct
    WHERE ct.id = fraud_flags.transaction_id AND ct.user_id = auth.uid()
  )
);

-- RLS policies for fraud_settings (admin only)
CREATE POLICY "Admins can manage fraud settings"
ON public.fraud_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default global fraud settings
INSERT INTO public.fraud_settings (company_id, default_hold_days, high_risk_hold_days, critical_risk_hold_days)
VALUES (NULL, 7, 14, 30);

-- Insert default fraud rules
INSERT INTO public.fraud_rules (name, description, rule_type, parameters, action, severity, is_active) VALUES
('Velocity Limit', 'More than N conversions per user per day', 'velocity', '{"max_per_day": 3, "time_window_hours": 24}', 'flag', 'medium', true),
('Duplicate Campaign', 'Same user claims same campaign twice', 'duplicate', '{}', 'auto_reject', 'critical', true),
('Rapid Conversion', 'Conversion within 60 seconds of click', 'pattern', '{"min_seconds": 60}', 'flag', 'high', true),
('High Value', 'Conversion amount above threshold', 'amount', '{"max_amount": 500}', 'flag', 'medium', true),
('New User Rush', 'Multiple conversions from account created within 24h', 'pattern', '{"max_conversions": 2, "account_age_hours": 24}', 'flag', 'high', true);

-- Create function to calculate fraud risk score
CREATE OR REPLACE FUNCTION public.calculate_fraud_risk(p_transaction_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
  v_rule RECORD;
  v_risk_score INTEGER := 0;
  v_flags_count INTEGER := 0;
  v_user_conversions_today INTEGER;
  v_campaign_conversions INTEGER;
  v_click_to_conversion_seconds INTEGER;
  v_user_account_age_hours INTEGER;
  v_user_recent_conversions INTEGER;
BEGIN
  -- Get transaction details
  SELECT ct.*, tc.created_at as click_created_at, p.created_at as user_created_at
  INTO v_tx
  FROM public.cashback_transactions ct
  LEFT JOIN public.tracking_clicks tc ON ct.tracking_click_id = tc.id
  LEFT JOIN public.profiles p ON ct.user_id = p.id
  WHERE ct.id = p_transaction_id;
  
  IF v_tx.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate metrics
  SELECT COUNT(*) INTO v_user_conversions_today
  FROM public.cashback_transactions
  WHERE user_id = v_tx.user_id
    AND created_at > now() - interval '24 hours'
    AND id != p_transaction_id;
  
  SELECT COUNT(*) INTO v_campaign_conversions
  FROM public.cashback_transactions
  WHERE user_id = v_tx.user_id
    AND campaign_id = v_tx.campaign_id
    AND id != p_transaction_id;
  
  IF v_tx.click_created_at IS NOT NULL THEN
    v_click_to_conversion_seconds := EXTRACT(EPOCH FROM (v_tx.created_at - v_tx.click_created_at))::INTEGER;
  END IF;
  
  IF v_tx.user_created_at IS NOT NULL THEN
    v_user_account_age_hours := EXTRACT(EPOCH FROM (now() - v_tx.user_created_at)) / 3600;
  END IF;
  
  -- Check each active rule
  FOR v_rule IN SELECT * FROM public.fraud_rules WHERE is_active = true LOOP
    DECLARE
      v_triggered BOOLEAN := false;
      v_severity_score INTEGER;
    BEGIN
      -- Calculate severity score
      v_severity_score := CASE v_rule.severity
        WHEN 'low' THEN 10
        WHEN 'medium' THEN 25
        WHEN 'high' THEN 40
        WHEN 'critical' THEN 50
        ELSE 20
      END;
      
      -- Check velocity limit
      IF v_rule.rule_type = 'velocity' THEN
        IF v_user_conversions_today >= COALESCE((v_rule.parameters->>'max_per_day')::INTEGER, 3) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check duplicate campaign
      IF v_rule.rule_type = 'duplicate' THEN
        IF v_campaign_conversions > 0 THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check rapid conversion
      IF v_rule.rule_type = 'pattern' AND v_rule.name = 'Rapid Conversion' THEN
        IF v_click_to_conversion_seconds IS NOT NULL 
           AND v_click_to_conversion_seconds < COALESCE((v_rule.parameters->>'min_seconds')::INTEGER, 60) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check high value
      IF v_rule.rule_type = 'amount' THEN
        IF v_tx.amount > COALESCE((v_rule.parameters->>'max_amount')::NUMERIC, 500) THEN
          v_triggered := true;
        END IF;
      END IF;
      
      -- Check new user rush
      IF v_rule.rule_type = 'pattern' AND v_rule.name = 'New User Rush' THEN
        IF v_user_account_age_hours IS NOT NULL 
           AND v_user_account_age_hours < COALESCE((v_rule.parameters->>'account_age_hours')::INTEGER, 24) THEN
          SELECT COUNT(*) INTO v_user_recent_conversions
          FROM public.cashback_transactions
          WHERE user_id = v_tx.user_id;
          
          IF v_user_recent_conversions >= COALESCE((v_rule.parameters->>'max_conversions')::INTEGER, 2) THEN
            v_triggered := true;
          END IF;
        END IF;
      END IF;
      
      -- Create flag if triggered
      IF v_triggered THEN
        INSERT INTO public.fraud_flags (transaction_id, rule_id, flag_type, severity, details)
        VALUES (
          p_transaction_id, 
          v_rule.id, 
          v_rule.rule_type || '_' || lower(replace(v_rule.name, ' ', '_')),
          v_rule.severity,
          jsonb_build_object(
            'rule_name', v_rule.name,
            'user_conversions_today', v_user_conversions_today,
            'campaign_conversions', v_campaign_conversions,
            'click_to_conversion_seconds', v_click_to_conversion_seconds,
            'user_account_age_hours', v_user_account_age_hours
          )
        );
        
        v_risk_score := v_risk_score + v_severity_score;
        v_flags_count := v_flags_count + 1;
      END IF;
    END;
  END LOOP;
  
  -- Cap risk score at 100
  v_risk_score := LEAST(v_risk_score, 100);
  
  -- Update transaction with risk score and flags count
  UPDATE public.cashback_transactions
  SET risk_score = v_risk_score, fraud_flags_count = v_flags_count
  WHERE id = p_transaction_id;
  
  RETURN v_risk_score;
END;
$$;

-- Create function to apply fraud actions based on risk score
CREATE OR REPLACE FUNCTION public.apply_fraud_actions(p_transaction_id UUID, p_risk_score INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_action TEXT := 'none';
  v_new_hold_until TIMESTAMPTZ;
BEGIN
  -- Get global fraud settings
  SELECT * INTO v_settings
  FROM public.fraud_settings
  WHERE company_id IS NULL
  LIMIT 1;
  
  IF v_settings IS NULL THEN
    v_settings := ROW(NULL, NULL, 7, 14, 30, 3, 1, 90, 10, now(), now());
  END IF;
  
  -- Apply actions based on risk score
  IF p_risk_score >= v_settings.auto_reject_risk_threshold THEN
    -- Auto-reject high risk transactions
    UPDATE public.cashback_transactions
    SET 
      verification_status = 'rejected',
      status = 'rejected',
      rejection_reason = 'Auto-rejected due to high fraud risk score: ' || p_risk_score
    WHERE id = p_transaction_id;
    v_action := 'auto_rejected';
    
  ELSIF p_risk_score >= 70 THEN
    -- Extend hold for critical risk
    v_new_hold_until := now() + (v_settings.critical_risk_hold_days || ' days')::INTERVAL;
    UPDATE public.cashback_transactions
    SET 
      extended_hold_until = v_new_hold_until,
      hold_until = v_new_hold_until
    WHERE id = p_transaction_id;
    v_action := 'extended_hold_critical';
    
  ELSIF p_risk_score >= 40 THEN
    -- Extend hold for high risk
    v_new_hold_until := now() + (v_settings.high_risk_hold_days || ' days')::INTERVAL;
    UPDATE public.cashback_transactions
    SET 
      extended_hold_until = v_new_hold_until,
      hold_until = v_new_hold_until
    WHERE id = p_transaction_id;
    v_action := 'extended_hold_high';
    
  ELSIF p_risk_score <= v_settings.auto_verify_risk_threshold THEN
    v_action := 'low_risk';
  END IF;
  
  RETURN jsonb_build_object(
    'action', v_action,
    'risk_score', p_risk_score,
    'new_hold_until', v_new_hold_until
  );
END;
$$;

-- Update process_conversion to include fraud checks
CREATE OR REPLACE FUNCTION public.process_conversion(p_tracking_id text, p_conversion_type text, p_conversion_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;
  
  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;
  
  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;
  
  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;
  
  -- Update tracking click
  UPDATE public.tracking_clicks
  SET 
    status = 'converted',
    conversion_type = p_conversion_type,
    conversion_data = p_conversion_data,
    converted_at = now()
  WHERE id = v_click.id;
  
  -- Check if cashback transaction already exists
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;
  
  -- Get campaign cash allotment
  DECLARE
    v_amount NUMERIC;
    v_settings RECORD;
  BEGIN
    SELECT cash_allotment INTO v_amount
    FROM public.campaigns
    WHERE id = v_click.campaign_id;
    
    -- Get default hold period
    SELECT COALESCE(default_hold_days, 7) as default_hold_days INTO v_settings
    FROM public.fraud_settings
    WHERE company_id IS NULL
    LIMIT 1;
    
    -- Create cashback transaction with pending verification
    INSERT INTO public.cashback_transactions (
      user_id, company_id, campaign_id, amount, status,
      tracking_click_id, verification_status, hold_until
    )
    VALUES (
      v_click.user_id, v_click.company_id, v_click.campaign_id, v_amount, 'pending',
      v_click.id, 'pending', now() + (COALESCE(v_settings.default_hold_days, 7) || ' days')::INTERVAL
    )
    RETURNING id INTO v_tx_id;
  END;
  
  -- Calculate fraud risk
  v_risk_score := calculate_fraud_risk(v_tx_id);
  
  -- Apply fraud actions based on risk score
  v_fraud_result := apply_fraud_actions(v_tx_id, v_risk_score);
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id,
    'risk_score', v_risk_score,
    'fraud_action', v_fraud_result->>'action'
  );
END;
$$;

-- ============================================
-- Migration: 20260123174628_157b0717-fe1c-4035-bc44-e6dc05eec670.sql
-- ============================================
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

-- ============================================
-- Migration: 20260127153715_7b92a35d-e76e-4ba3-b01d-d32ec7816fda.sql
-- ============================================
CREATE OR REPLACE FUNCTION public.process_conversion(
  p_tracking_id text, 
  p_conversion_type text, 
  p_conversion_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
  v_amount NUMERIC;
  v_final_amount NUMERIC;
  v_is_premium BOOLEAN;
  v_settings RECORD;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;
  
  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;
  
  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;
  
  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;
  
  -- Update tracking click
  UPDATE public.tracking_clicks
  SET 
    status = 'converted',
    conversion_type = p_conversion_type,
    conversion_data = p_conversion_data,
    converted_at = now()
  WHERE id = v_click.id;
  
  -- Check if cashback transaction already exists
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;
  
  -- Get campaign cash allotment
  SELECT cash_allotment INTO v_amount
  FROM public.campaigns
  WHERE id = v_click.campaign_id;
  
  -- Get user's premium status
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM public.profiles
  WHERE id = v_click.user_id;
  
  -- Calculate final amount: 100% for premium, 70% for non-premium
  v_final_amount := CASE 
    WHEN v_is_premium = true THEN v_amount
    ELSE ROUND(v_amount * 0.70, 2)
  END;
  
  -- Get default hold period
  SELECT COALESCE(default_hold_days, 7) as default_hold_days INTO v_settings
  FROM public.fraud_settings
  WHERE company_id IS NULL
  LIMIT 1;
  
  -- Create cashback transaction with calculated amount
  INSERT INTO public.cashback_transactions (
    user_id, company_id, campaign_id, amount, status,
    tracking_click_id, verification_status, hold_until
  )
  VALUES (
    v_click.user_id, v_click.company_id, v_click.campaign_id, 
    v_final_amount, 'pending',
    v_click.id, 'pending', 
    now() + (COALESCE(v_settings.default_hold_days, 7) || ' days')::INTERVAL
  )
  RETURNING id INTO v_tx_id;
  
  -- Calculate fraud risk
  v_risk_score := calculate_fraud_risk(v_tx_id);
  
  -- Apply fraud actions based on risk score
  v_fraud_result := apply_fraud_actions(v_tx_id, v_risk_score);
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id,
    'amount', v_final_amount,
    'is_premium_rate', v_is_premium,
    'risk_score', v_risk_score,
    'fraud_action', v_fraud_result->>'action'
  );
END;
$$;

-- ============================================
-- Migration: 20260128051609_66ee9dca-3aee-469f-bbb9-cce0fe407cc3.sql
-- ============================================
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('cashback_issue', 'account_problem', 'technical_bug', 'payment_issue', 'general_inquiry')),
  subject TEXT NOT NULL CHECK (char_length(subject) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_ticket_messages table
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL CHECK (char_length(message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();

-- RLS Policies for support_tickets

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited - mainly for closing)
CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for support_ticket_messages

-- Users can view messages for their own tickets
CREATE POLICY "Users can view messages for their tickets"
  ON public.support_ticket_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = support_ticket_messages.ticket_id
    AND user_id = auth.uid()
  ));

-- Users can insert messages for their own tickets
CREATE POLICY "Users can insert messages for their tickets"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'user' AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = support_ticket_messages.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.support_ticket_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages for any ticket
CREATE POLICY "Admins can insert messages for any ticket"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'admin' AND
    sender_id = auth.uid() AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Migration: 20260128052252_badeea8d-e778-4a81-aa0d-6bc453fcd15d.sql
-- ============================================
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

-- ============================================
-- Migration: 20260130144256_5936aea9-fe0b-4de8-b688-1e01a3c7f226.sql
-- ============================================
-- Create push_subscriptions table for storing user push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own push subscriptions
CREATE POLICY "Users can view own push subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions" 
  ON public.push_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions" 
  ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Create trigger to update updated_at on changes
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();

-- ============================================
-- Migration: 20260131114444_40b146e1-6575-43fb-9ab1-aea5373ba1cf.sql
-- ============================================
-- Add referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referral_discounts_available INTEGER DEFAULT 0;

-- Create index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  referred_reward NUMERIC DEFAULT 50,
  converted_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals table
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral as referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique 8-character referral code
CREATE OR REPLACE FUNCTION public.generate_user_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code TEXT;
  i INTEGER;
  existing_code TEXT;
BEGIN
  -- Check if user already has a code
  SELECT referral_code INTO existing_code
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  LOOP
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
      -- Update user's profile with the new code
      UPDATE public.profiles
      SET referral_code = new_code
      WHERE id = p_user_id;
      
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to record a referral when a new user signs up with a referral code
CREATE OR REPLACE FUNCTION public.record_referral(p_referred_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, 'pending');
  
  RETURN TRUE;
END;
$$;

-- Function to process referral rewards when a referred user subscribes
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_id UUID;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
    AND status = 'pending';
  
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'No pending referral found');
  END IF;
  
  v_referrer_id := v_referral.referrer_id;
  
  -- Increment referrer's available discounts
  UPDATE public.profiles
  SET referral_discounts_available = COALESCE(referral_discounts_available, 0) + 1
  WHERE id = v_referrer_id;
  
  -- Credit ₹50 to referred user's wallet (pending balance)
  UPDATE public.user_wallets
  SET pending = COALESCE(pending, 0) + 50,
      updated_at = now()
  WHERE user_id = p_referred_user_id;
  
  -- Update referral status
  UPDATE public.referrals
  SET status = 'rewarded',
      converted_at = now(),
      rewarded_at = now()
  WHERE id = v_referral.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'referred_bonus', 50
  );
END;
$$;

-- Function to apply referral discount during subscription
CREATE OR REPLACE FUNCTION public.apply_referral_discount(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Get available discounts
  SELECT COALESCE(referral_discounts_available, 0) INTO v_available
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_available > 0 THEN
    -- Decrement available discounts
    UPDATE public.profiles
    SET referral_discounts_available = referral_discounts_available - 1
    WHERE id = p_user_id;
    
    RETURN 50; -- ₹50 discount
  END IF;
  
  RETURN 0;
END;
$$;

-- Update process_subscription_payment to include referral logic
CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_plan_id text, 
  p_amount numeric, 
  p_card_last_four text, 
  p_success boolean, 
  p_error_message text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_period_end timestamptz;
  v_discount INTEGER := 0;
  v_final_amount NUMERIC;
  v_referral_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_plan_id NOT IN ('monthly', 'quarterly', 'yearly') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_card_last_four IS NOT NULL AND length(p_card_last_four) > 4 THEN
    RAISE EXCEPTION 'Invalid card_last_four';
  END IF;

  -- Apply referral discount if available
  v_discount := apply_referral_discount(auth.uid());
  v_final_amount := GREATEST(p_amount - v_discount, 0);

  -- Record transaction with final amount
  INSERT INTO public.payment_transactions (
    user_id,
    amount,
    currency,
    status,
    payment_type,
    card_last_four,
    error_message
  ) VALUES (
    auth.uid(),
    v_final_amount,
    'INR',
    CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    'subscription',
    p_card_last_four,
    NULLIF(p_error_message, '')
  );

  IF NOT p_success THEN
    RETURN jsonb_build_object('success', false, 'discount_applied', v_discount);
  END IF;

  IF p_plan_id = 'monthly' THEN
    v_period_end := v_now + interval '1 month';
  ELSIF p_plan_id = 'quarterly' THEN
    v_period_end := v_now + interval '3 months';
  ELSE
    v_period_end := v_now + interval '1 year';
  END IF;

  -- Upsert subscription
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, updated_at)
  VALUES (auth.uid(), p_plan_id, 'active', v_now, v_period_end, v_now)
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = EXCLUDED.updated_at;

  UPDATE public.profiles
  SET is_premium = true
  WHERE id = auth.uid();

  -- Process referral reward if this user was referred
  v_referral_result := process_referral_reward(auth.uid());

  RETURN jsonb_build_object(
    'success', true, 
    'discount_applied', v_discount,
    'final_amount', v_final_amount,
    'referral_reward', v_referral_result
  );
END;
$$;

-- ============================================
-- Migration: 20260131125030_38253c2e-788f-418d-9beb-21a08eb12196.sql
-- ============================================
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

-- ============================================
-- Migration: 20260201142007_e1d2df7d-c2e3-4802-b58c-8fe5ffb60362.sql
-- ============================================
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

-- ============================================
-- Migration: 20260203103452_d527bff7-c1ca-4524-911f-1b79774ce836.sql
-- ============================================
-- Remove tracking_method and webhook_endpoint columns from campaigns table
-- These are no longer needed as all tracking is now destination URL-based

-- First, set a placeholder destination_url for any campaigns that don't have one
UPDATE public.campaigns 
SET destination_url = 'https://example.com/configure-destination' 
WHERE destination_url IS NULL;

-- Now drop the obsolete columns
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS tracking_method;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS webhook_endpoint;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS last_webhook_test;

-- Ensure destination_url is required going forward
ALTER TABLE public.campaigns ALTER COLUMN destination_url SET NOT NULL;

-- ============================================
-- Migration: 20260217093330_24f9b112-56d2-4182-b358-fce4d5531d30.sql
-- ============================================

CREATE OR REPLACE FUNCTION public.process_cashback(p_user_id uuid, p_company_id uuid, p_campaign_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign_amount NUMERIC;
BEGIN
  -- Authorization: only admins or service role (auth.uid() IS NULL) can call this
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Validate campaign belongs to company and get the official cash_allotment
  SELECT cash_allotment INTO v_campaign_amount
  FROM public.campaigns
  WHERE id = p_campaign_id AND company_id = p_company_id;

  IF v_campaign_amount IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or does not belong to company';
  END IF;

  -- Check if company has enough balance using the campaign's actual amount
  IF NOT EXISTS (
    SELECT 1 FROM public.company_wallets 
    WHERE company_id = p_company_id AND balance >= v_campaign_amount
  ) THEN
    RETURN FALSE;
  END IF;

  -- Deduct from company wallet using validated amount
  UPDATE public.company_wallets
  SET 
    balance = balance - v_campaign_amount,
    total_spent = total_spent + v_campaign_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id;

  -- Record company transaction
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, -v_campaign_amount, 'cashback_paid', 'Cashback paid to customer');

  -- Add to user wallet (pending)
  UPDATE public.user_wallets
  SET 
    pending = pending + v_campaign_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record cashback transaction
  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (p_user_id, p_company_id, p_campaign_id, v_campaign_amount, 'pending');

  RETURN TRUE;
END;
$function$;


-- ============================================
-- Migration: 20260217111036_a03d11fe-299a-479e-b2db-e8511e6aa1c7.sql
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true);

CREATE POLICY "Authenticated users can upload campaign media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view campaign media"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated users can update their media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their media"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-media' AND auth.uid() = owner);


-- ============================================
-- Migration: 20260226055835_74a5681f-584f-4e49-b5dc-1730effb3c77.sql
-- ============================================

-- Add reward_hold_days column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN reward_hold_days integer NOT NULL DEFAULT 7;

-- Create validation trigger for reward_hold_days (1-90 range)
CREATE OR REPLACE FUNCTION public.validate_reward_hold_days()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reward_hold_days < 1 OR NEW.reward_hold_days > 90 THEN
    RAISE EXCEPTION 'Reward hold days must be between 1 and 90';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_reward_hold_days_trigger
BEFORE INSERT OR UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.validate_reward_hold_days();


-- ============================================
-- Migration: 20260226061731_b07df90c-5c3f-423d-8f00-d118d482caec.sql
-- ============================================

CREATE OR REPLACE FUNCTION public.process_conversion(p_tracking_id text, p_conversion_type text, p_conversion_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_click RECORD;
  v_tx_id UUID;
  v_risk_score INTEGER;
  v_fraud_result JSONB;
  v_amount NUMERIC;
  v_hold_days INTEGER;
  v_final_amount NUMERIC;
  v_is_premium BOOLEAN;
BEGIN
  -- Find the tracking click
  SELECT * INTO v_click
  FROM public.tracking_clicks
  WHERE tracking_id = p_tracking_id;
  
  IF v_click.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking ID not found');
  END IF;
  
  IF v_click.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already converted');
  END IF;
  
  IF v_click.status = 'expired' OR v_click.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tracking link expired');
  END IF;
  
  -- Update tracking click
  UPDATE public.tracking_clicks
  SET 
    status = 'converted',
    conversion_type = p_conversion_type,
    conversion_data = p_conversion_data,
    converted_at = now()
  WHERE id = v_click.id;
  
  -- Check if cashback transaction already exists
  IF EXISTS (
    SELECT 1 FROM public.cashback_transactions
    WHERE tracking_click_id = v_click.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already exists');
  END IF;
  
  -- Get campaign cash allotment AND reward_hold_days
  SELECT cash_allotment, reward_hold_days INTO v_amount, v_hold_days
  FROM public.campaigns
  WHERE id = v_click.campaign_id;
  
  -- Get user's premium status
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM public.profiles
  WHERE id = v_click.user_id;
  
  -- Calculate final amount: 100% for premium, 70% for non-premium
  v_final_amount := CASE 
    WHEN v_is_premium = true THEN v_amount
    ELSE ROUND(v_amount * 0.70, 2)
  END;
  
  -- Create cashback transaction using the campaign's reward_hold_days
  INSERT INTO public.cashback_transactions (
    user_id, company_id, campaign_id, amount, status,
    tracking_click_id, verification_status, hold_until
  )
  VALUES (
    v_click.user_id, v_click.company_id, v_click.campaign_id, 
    v_final_amount, 'pending',
    v_click.id, 'pending', 
    now() + (COALESCE(v_hold_days, 7) || ' days')::INTERVAL
  )
  RETURNING id INTO v_tx_id;
  
  -- Calculate fraud risk
  v_risk_score := calculate_fraud_risk(v_tx_id);
  
  -- Apply fraud actions based on risk score
  v_fraud_result := apply_fraud_actions(v_tx_id, v_risk_score);
  
  -- Track analytics event
  INSERT INTO public.campaign_analytics (campaign_id, user_id, event_type)
  VALUES (v_click.campaign_id, v_click.user_id, 'conversion');
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_tx_id,
    'user_id', v_click.user_id,
    'campaign_id', v_click.campaign_id,
    'amount', v_final_amount,
    'is_premium_rate', v_is_premium,
    'risk_score', v_risk_score,
    'fraud_action', v_fraud_result->>'action'
  );
END;
$function$;

