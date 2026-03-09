-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending_payment', 'confirmed', 'completed', 'cancelled');

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL,
  student_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutor_availability table
CREATE TABLE public.tutor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  subject TEXT NOT NULL,
  note TEXT,
  status booking_status NOT NULL DEFAULT 'pending_payment',
  price DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews table
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Students can insert reviews for their completed sessions" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = student_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.student_id = auth.uid() 
    AND bookings.tutor_id = reviews.tutor_id 
    AND bookings.status = 'completed'
  )
);

CREATE POLICY "Students can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = student_id);

-- RLS policies for tutor_availability table
CREATE POLICY "Tutor availability is viewable by everyone" 
ON public.tutor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Tutors can manage their own availability" 
ON public.tutor_availability 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tutor_profiles 
    WHERE tutor_profiles.user_id = auth.uid() 
    AND tutor_profiles.id = tutor_availability.tutor_id
  )
);

-- RLS policies for bookings table
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = student_id OR auth.uid() = (
  SELECT user_id FROM public.tutor_profiles WHERE id = tutor_id
));

CREATE POLICY "Students can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = student_id OR auth.uid() = (
  SELECT user_id FROM public.tutor_profiles WHERE id = tutor_id
));

-- Create indexes for better performance
CREATE INDEX idx_reviews_tutor_id ON public.reviews(tutor_id);
CREATE INDEX idx_tutor_availability_tutor_id ON public.tutor_availability(tutor_id);
CREATE INDEX idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX idx_bookings_tutor_id ON public.bookings(tutor_id);
CREATE INDEX idx_bookings_date ON public.bookings(date);

-- Add triggers for updated_at columns
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at
BEFORE UPDATE ON public.tutor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();