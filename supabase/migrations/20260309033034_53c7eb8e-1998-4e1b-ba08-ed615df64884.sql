-- Add missing columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tutor_reply text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reply_at timestamptz;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;

-- Add unique constraint: one review per booking
ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- Create review_flags table
CREATE TABLE IF NOT EXISTS public.review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag reviews" ON public.review_flags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Users can view their own flags" ON public.review_flags
  FOR SELECT TO authenticated USING (auth.uid() = flagged_by);

-- Trigger to recalculate tutor rating/review_count after review insert/update
CREATE OR REPLACE FUNCTION public.recalculate_tutor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.tutor_profiles
  SET
    rating = (SELECT COALESCE(AVG(r.rating), 0) FROM public.reviews r WHERE r.tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id) AND r.flagged = false),
    review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id) AND r.flagged = false)
  WHERE id = COALESCE(NEW.tutor_id, OLD.tutor_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalculate_tutor_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalculate_tutor_rating();