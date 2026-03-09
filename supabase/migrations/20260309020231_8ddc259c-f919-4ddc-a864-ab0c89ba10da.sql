
-- Replace overly permissive notification insert policy with authenticated-only
DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);
