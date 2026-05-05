
CREATE POLICY "Users can submit inactive teach-back drafts"
ON public.ai_knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND active = false
);
