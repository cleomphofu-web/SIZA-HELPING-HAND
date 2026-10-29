-- The Supabase helper is not used by SIZA and must not be exposed through PostgREST if it exists.
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  END IF;
END $$;