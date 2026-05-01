
-- AI knowledge base for admin-curated answers the AI learns from
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  source_log_id uuid REFERENCES public.ai_logs(id) ON DELETE SET NULL,
  category text DEFAULT 'general',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_kb_active ON public.ai_knowledge_base(active);
CREATE INDEX IF NOT EXISTS idx_ai_kb_source ON public.ai_knowledge_base(source_log_id);

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_knowledge_base"
  ON public.ai_knowledge_base FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active kb"
  ON public.ai_knowledge_base FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

-- Mark which AI logs have been handled by admin
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS handled boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_ai_logs_type_handled ON public.ai_logs(type, handled);
