-- Add onboarding_completed column to companies table
ALTER TABLE public.companies 
ADD COLUMN onboarding_completed boolean DEFAULT false;