-- Drop all existing tables and recreate with proper structure
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP VIEW IF EXISTS public.safe_doctors CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.patient_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create enums
CREATE TYPE public.user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.patient_type AS ENUM ('new', 'returning');

-- Create user_profiles table (linked to auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2),
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    date_of_birth DATE NOT NULL,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    insurance_carrier TEXT,
    insurance_member_id TEXT,
    insurance_group_number TEXT,
    patient_type patient_type DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create doctor_schedules table
CREATE TABLE public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status appointment_status DEFAULT 'pending',
    reason_for_visit TEXT,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create role checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'patient'::user_role
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for doctors
CREATE POLICY "Everyone can view doctors"
ON public.doctors FOR SELECT
USING (true);

CREATE POLICY "Doctors can update their own profile"
ON public.doctors FOR UPDATE
USING (user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage doctors"
ON public.doctors FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for patients
CREATE POLICY "Users can view their own patient data"
ON public.patients FOR SELECT
USING (user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can create their own patient record"
ON public.patients FOR INSERT
WITH CHECK (user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own patient data"
ON public.patients FOR UPDATE
USING (user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can manage all patients"
ON public.patients FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for doctor_schedules
CREATE POLICY "Everyone can view doctor schedules"
ON public.doctor_schedules FOR SELECT
USING (true);

CREATE POLICY "Admins can manage doctor schedules"
ON public.doctor_schedules FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid())) 
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Users can create appointments for themselves"
ON public.appointments FOR INSERT
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()))
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = (SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create safe doctors view for public access
CREATE VIEW public.safe_doctors AS
SELECT 
    d.id,
    up.first_name,
    up.last_name,
    d.specialty,
    d.bio,
    up.avatar_url,
    d.years_experience,
    d.consultation_fee,
    d.rating,
    d.is_available
FROM public.doctors d
JOIN public.user_profiles up ON d.user_id = up.user_id
WHERE d.is_available = true;

-- Insert sample data
INSERT INTO public.user_profiles (user_id, email, first_name, last_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@medibook.com', 'Admin', 'User', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'dr.smith@medibook.com', 'Dr. John', 'Smith', 'doctor'),
('550e8400-e29b-41d4-a716-446655440002', 'dr.jones@medibook.com', 'Dr. Sarah', 'Jones', 'doctor');

INSERT INTO public.doctors (user_id, specialty, bio, years_experience, consultation_fee, rating) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Cardiology', 'Experienced cardiologist with 15 years of practice.', 15, 200.00, 4.8),
('550e8400-e29b-41d4-a716-446655440002', 'Dermatology', 'Specialist in skin care and dermatological treatments.', 10, 150.00, 4.9);

INSERT INTO public.doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES
((SELECT id FROM public.doctors WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), 1, '09:00', '17:00'),
((SELECT id FROM public.doctors WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'), 2, '09:00', '17:00'),
((SELECT id FROM public.doctors WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), 1, '10:00', '16:00'),
((SELECT id FROM public.doctors WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'), 3, '10:00', '16:00');