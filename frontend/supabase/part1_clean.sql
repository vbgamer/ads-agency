-- PART 1: Core Tables (profiles, companies, campaigns, wallets)

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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for new company
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- Function to update wallet balance
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
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, p_amount, 'deposit', 'Funds added to cashback pool');
  
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
  IF NOT EXISTS (
    SELECT 1 FROM public.company_wallets 
    WHERE company_id = p_company_id AND balance >= p_amount
  ) THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.company_wallets
  SET 
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE company_id = p_company_id;
  
  INSERT INTO public.wallet_transactions (company_id, amount, type, description)
  VALUES (p_company_id, -p_amount, 'cashback_paid', 'Cashback paid to customer');
  
  UPDATE public.user_wallets
  SET 
    pending = pending + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.cashback_transactions (user_id, company_id, campaign_id, amount, status)
  VALUES (p_user_id, p_company_id, p_campaign_id, p_amount, 'pending');
  
  RETURN TRUE;
END;
$$;
