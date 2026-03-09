-- Remove legacy Stripe column to avoid any Stripe references
ALTER TABLE public.bookings
DROP COLUMN IF EXISTS stripe_payment_id;