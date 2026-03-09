-- Tighten role assignment to prevent privilege escalation

-- user_roles: users may only self-assign student/tutor (never admin)
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert student/tutor roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('student'::public.app_role, 'tutor'::public.app_role)
);

-- profiles: prevent users from setting their own role to admin
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (role IS NULL OR role IN ('student'::public.app_role, 'tutor'::public.app_role))
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (role IS NULL OR role IN ('student'::public.app_role, 'tutor'::public.app_role))
);
