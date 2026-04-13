
-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank_transfer',
  status text NOT NULL DEFAULT 'pending',
  reference text,
  proof_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Tracking table
CREATE TABLE public.tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  tracking_number text,
  carrier text,
  notes text,
  estimated_delivery timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tracking" ON public.tracking FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tracking" ON public.tracking FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Negotiations table
CREATE TABLE public.negotiations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  original_price numeric NOT NULL,
  offered_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own negotiations" ON public.negotiations FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create negotiations" ON public.negotiations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update negotiations" ON public.negotiations FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Refunds table
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own refunds" ON public.refunds FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can request refunds" ON public.refunds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update refunds" ON public.refunds FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promos" ON public.promo_codes FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage promos" ON public.promo_codes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Coupons table
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'percentage',
  value numeric NOT NULL DEFAULT 0,
  min_purchase numeric DEFAULT 0,
  max_uses integer DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  start_date timestamptz,
  end_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Spin wheels table
CREATE TABLE public.spin_wheels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  prize_type text NOT NULL DEFAULT 'discount',
  prize_value text NOT NULL DEFAULT '0',
  probability numeric NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spin_wheels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active spins" ON public.spin_wheels FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage spins" ON public.spin_wheels FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Popup ads table
CREATE TABLE public.popup_ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  image_url text,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  show_on_pages text[] DEFAULT '{"home"}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active popups" ON public.popup_ads FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage popups" ON public.popup_ads FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Category discounts table
CREATE TABLE public.category_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active category discounts" ON public.category_discounts FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage category discounts" ON public.category_discounts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add trigger for handle_new_user if not exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
