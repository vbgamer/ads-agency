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