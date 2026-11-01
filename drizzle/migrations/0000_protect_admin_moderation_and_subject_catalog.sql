ALTER TYPE public.tutor_status ADD VALUE IF NOT EXISTS 'suspended';

CREATE OR REPLACE FUNCTION public.protect_tutor_moderation() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('postgres','service_role','supabase_admin') OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending_approval' THEN RAISE EXCEPTION 'Admin privileges required to approve tutors' USING ERRCODE = '42501'; END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Admin privileges required to change tutor status' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_tutor_moderation BEFORE INSERT OR UPDATE ON public.tutor_profiles FOR EACH ROW EXECUTE FUNCTION public.protect_tutor_moderation();

CREATE OR REPLACE FUNCTION public.protect_review_moderation() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('postgres','service_role','supabase_admin') OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.flagged, false) THEN RAISE EXCEPTION 'Admin privileges required to moderate reviews' USING ERRCODE = '42501'; END IF;
  ELSIF NEW.flagged IS DISTINCT FROM OLD.flagged THEN
    RAISE EXCEPTION 'Admin privileges required to moderate reviews' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_review_moderation BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.protect_review_moderation();

CREATE OR REPLACE FUNCTION public.get_subject_categories() RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE raw text;
BEGIN
 SELECT value INTO raw FROM public.platform_settings WHERE key = 'subjects_offered';
 IF raw IS NULL THEN RETURN NULL; END IF;
 IF left(trim(raw),1) = '[' THEN RETURN ARRAY(SELECT jsonb_array_elements_text(raw::jsonb)); END IF;
 RETURN string_to_array(raw, ',');
END; $$;
REVOKE ALL ON FUNCTION public.get_subject_categories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subject_categories() TO anon, authenticated, service_role;