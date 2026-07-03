-- Migration: Fix NULL token columns in auth.users causing GoTrue scan failures

-- 1. Update all existing users with NULL columns dynamically
DO $$
DECLARE
    column_names text[] := ARRAY[
        'confirmation_token',
        'recovery_token',
        'email_change_token_new',
        'email_change_token_current',
        'phone_change_token',
        'reauthentication_token',
        'email_change'
    ];
    col text;
    sql_query text;
BEGIN
    FOREACH col IN ARRAY column_names LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'auth' 
              AND table_name = 'users' 
              AND column_name = col
        ) THEN
            sql_query := format('UPDATE auth.users SET %I = COALESCE(%I, '''') WHERE %I IS NULL', col, col, col);
            EXECUTE sql_query;
        END IF;
    END LOOP;
END $$;

-- 2. Trigger function to sanitize nullable columns automatically on insert/update
CREATE OR REPLACE FUNCTION public.clean_auth_users_nullable_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Coalesce confirmation and recovery tokens
  NEW.confirmation_token := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token := COALESCE(NEW.recovery_token, '');
  
  -- Dynamically coalesce other change/reauth tokens if they are defined on the row
  BEGIN
    NEW.email_change_token_new := COALESCE(NEW.email_change_token_new, '');
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;

  BEGIN
    NEW.email_change_token_current := COALESCE(NEW.email_change_token_current, '');
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  
  BEGIN
    NEW.phone_change_token := COALESCE(NEW.phone_change_token, '');
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;

  BEGIN
    NEW.reauthentication_token := COALESCE(NEW.reauthentication_token, '');
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- 3. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS tr_clean_auth_users ON auth.users;
CREATE TRIGGER tr_clean_auth_users
  BEFORE INSERT OR UPDATE OF confirmation_token, recovery_token ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.clean_auth_users_nullable_columns();
