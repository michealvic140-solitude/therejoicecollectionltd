
-- We can't FK to profiles.user_id directly since it's not unique-constrained in the right way.
-- Instead, let's just use a view approach or fix the query. Let's add a unique constraint on profiles.user_id first.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Now add FK from ai_logs to profiles
ALTER TABLE public.ai_logs
ADD CONSTRAINT ai_logs_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
