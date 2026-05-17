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