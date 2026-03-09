
-- Add phone and email to profiles for contact sharing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create tutor_student_connections table
CREATE TABLE public.tutor_student_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id uuid NOT NULL,
  tutor_user_id uuid NOT NULL,
  student_id uuid NOT NULL,
  subject text NOT NULL DEFAULT '',
  monthly_rate numeric NOT NULL,
  platform_fee numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_screenshot_url text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  confirmed_at timestamptz,
  UNIQUE(tutor_user_id, student_id)
);

-- Create platform_settings table
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '25'),
  ('connection_expiry_hours', '48'),
  ('esewa_number', '9818207798'),
  ('khalti_number', '9818207798'),
  ('min_monthly_rate', '500'),
  ('max_monthly_rate', '20000');

-- Enable RLS
ALTER TABLE public.tutor_student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS for connections: tutors and students can see their own
CREATE POLICY "Users can view their own connections"
  ON public.tutor_student_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_user_id OR auth.uid() = student_id);

-- Tutors can create connections (initiate agreement)
CREATE POLICY "Tutors can create connections"
  ON public.tutor_student_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_user_id);

-- Tutors can update their own connections (upload screenshot)
CREATE POLICY "Tutors can update their connections"
  ON public.tutor_student_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_user_id);

-- Admin can manage all connections via service role (edge function)

-- Platform settings readable by all authenticated
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update settings (via edge function with service role)

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their folder
CREATE POLICY "Users can upload payment screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own screenshots
CREATE POLICY "Users can view own payment screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutor_student_connections;
