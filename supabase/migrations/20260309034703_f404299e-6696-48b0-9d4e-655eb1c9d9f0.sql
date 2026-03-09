
-- Add new grade levels to the enum
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'grade_1_8';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'grade_9_10_see';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'grade_11_12_science';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'grade_11_12_management';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'grade_11_12_humanities';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'bachelors';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'masters';
ALTER TYPE public.grade_level ADD VALUE IF NOT EXISTS 'entrance_exam_prep';

-- Add Nepal-specific fields to student_profiles
ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS entrance_exam_target text,
  ADD COLUMN IF NOT EXISTS parent_contact text;

-- Add Nepal-specific fields to tutor_profiles  
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS teaching_city text,
  ADD COLUMN IF NOT EXISTS entrance_specializations text[] DEFAULT '{}'::text[];

-- Add Nepal-specific fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text;
