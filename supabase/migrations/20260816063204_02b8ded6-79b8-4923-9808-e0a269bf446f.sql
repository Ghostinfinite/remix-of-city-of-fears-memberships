-- allow a signed-in user to create their own profile row
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 250;

DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert own member role" ON public.user_roles;
CREATE POLICY "insert own member role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member'::app_role);