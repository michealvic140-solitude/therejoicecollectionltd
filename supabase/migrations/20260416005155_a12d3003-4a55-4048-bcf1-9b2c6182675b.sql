
-- ==========================================
-- 1. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==========================================
-- 2. CHATS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can insert chats" ON public.chats FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;

-- ==========================================
-- 3. ORDER_TRACKING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order tracking" ON public.order_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order tracking" ON public.order_tracking FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- 4. ADD COLUMNS TO ORDERS
-- ==========================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_name text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS screenshot_url text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_location text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status text DEFAULT '';

-- ==========================================
-- 5. ADD COLUMNS TO PRODUCTS
-- ==========================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS out_of_stock boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping boolean DEFAULT false;

-- ==========================================
-- 6. ADD COLUMNS TO ANNOUNCEMENTS
-- ==========================================
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title text DEFAULT '';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS tag text DEFAULT 'ANNOUNCEMENT';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- ==========================================
-- 7. ADD COLUMNS TO EVENTS
-- ==========================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ends_at timestamptz DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS promo_code text DEFAULT '';

-- ==========================================
-- 8. ADD COLUMNS TO PROFILES
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS landmark text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge text DEFAULT 'Regular';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restricted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS warning_message text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob text DEFAULT '';

-- ==========================================
-- 9. ADD COLUMNS TO POPUP_ADS
-- ==========================================
ALTER TABLE public.popup_ads ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.popup_ads ADD COLUMN IF NOT EXISTS link_type text DEFAULT 'shop';
ALTER TABLE public.popup_ads ADD COLUMN IF NOT EXISTS link_id text DEFAULT '';
ALTER TABLE public.popup_ads ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;

-- ==========================================
-- 10. ADD COLUMNS TO SPIN_WHEELS
-- ==========================================
ALTER TABLE public.spin_wheels ADD COLUMN IF NOT EXISTS title text DEFAULT 'Spin & Win';
ALTER TABLE public.spin_wheels ADD COLUMN IF NOT EXISTS prizes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.spin_wheels ADD COLUMN IF NOT EXISTS max_spins_per_user integer DEFAULT 1;

-- ==========================================
-- 11. ADD COLUMNS TO CATEGORY_DISCOUNTS
-- ==========================================
ALTER TABLE public.category_discounts ADD COLUMN IF NOT EXISTS ends_at timestamptz DEFAULT NULL;

-- ==========================================
-- 12. STORAGE BUCKET FOR UPLOADS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can delete uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
