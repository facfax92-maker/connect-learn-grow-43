-- Add 'admin' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Add new platform_settings keys
INSERT INTO public.platform_settings (key, value) VALUES
  ('message_limit', '10'),
  ('payment_name', 'TutorConnect'),
  ('admin_email', 'facfax92@gmail.com'),
  ('support_phone', '9808031193'),
  ('support_email', 'facfax92@gmail.com'),
  ('platform_name', 'TutorConnect'),
  ('auto_approve_tutors', 'false'),
  ('auto_expire_connections', 'true'),
  ('auto_reminder_24hr', 'true'),
  ('sms_notifications', 'false'),
  ('maintenance_mode', 'false'),
  ('cities_served', 'Kathmandu,Pokhara,Lalitpur,Bhaktapur,Biratnagar,Birgunj,Dharan,Butwal,Hetauda'),
  ('subjects_offered', 'Math,Science,English,Nepali,Social Studies,Computer Science,Physics,Chemistry,Biology,Accounting,Economics,History')
ON CONFLICT (key) DO NOTHING;