-- 1) Lock down profiles: replace public read with owner+admin
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2) user_roles: prevent self-escalation; only admins can manage
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Restrict coupons & promo_codes to authenticated users (so non-signed-in scrapers can't list codes)
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view active promos" ON public.promo_codes;
CREATE POLICY "Authenticated can view active promos"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

-- 4) Storage uploads: scope to user folder (path must start with auth.uid())
DROP POLICY IF EXISTS "Authenticated can upload to uploads" ON storage.objects;
CREATE POLICY "Users upload to own folder in uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own files in uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own files in uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );