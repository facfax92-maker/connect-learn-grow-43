
-- Add a security-definer function to get booked time slots for a tutor
-- This allows any user to check scheduling availability without exposing sensitive booking data
CREATE OR REPLACE FUNCTION public.get_tutor_booked_slots(
  p_tutor_id uuid,
  p_date_start date,
  p_date_end date
)
RETURNS TABLE(slot_date date, slot_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date AS slot_date, start_time AS slot_time
  FROM public.bookings
  WHERE tutor_id = p_tutor_id
    AND date >= p_date_start
    AND date < p_date_end
    AND status IN ('confirmed', 'pending_payment');
$$;
