
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Allow authenticated users to insert their own notifications (for edge functions with user context)
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
