
-- Allow admins to insert messages (reply to users)
CREATE POLICY "Admins can insert messages" ON public.messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
