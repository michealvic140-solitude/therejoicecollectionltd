
-- Add escalation and admin reply support to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS escalated boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;

-- Allow admins to update messages (to add replies)
CREATE POLICY "Admins can update messages"
  ON public.messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
