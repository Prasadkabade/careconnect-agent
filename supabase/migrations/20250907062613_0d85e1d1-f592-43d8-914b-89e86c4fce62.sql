-- Fix security issues in the database

-- 1. Create trigger to auto-create user profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role)
  VALUES (NEW.id, 'patient'::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add INSERT policy for user_profiles (only allow creating own profile with patient role)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'patient'::user_role);

-- 3. Fix appointments RLS policies - tighten INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
CREATE POLICY "Users can create appointments for themselves" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

-- 4. Add comprehensive RLS policies for patients table
DROP POLICY IF EXISTS "Users can create their own patient record" ON public.patients;
CREATE POLICY "Users can create their own patient record" 
ON public.patients 
FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own patient data" ON public.patients;
CREATE POLICY "Users can update their own patient data" 
ON public.patients 
FOR UPDATE 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::user_role));

-- 5. Restrict doctors table to authenticated users only (reduce public PII exposure)
DROP POLICY IF EXISTS "Everyone can view doctors" ON public.doctors;
CREATE POLICY "Authenticated users can view doctors" 
ON public.doctors 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create a safe public view for doctors without sensitive data
DROP VIEW IF EXISTS public.safe_doctors;
CREATE VIEW public.safe_doctors AS
SELECT 
  id,
  first_name,
  last_name,
  specialty,
  bio,
  avatar_url,
  rating,
  years_experience,
  consultation_fee,
  is_available
FROM public.doctors
WHERE is_available = true;

-- Allow public access to the safe view
DROP POLICY IF EXISTS "Public can view safe doctor info" ON public.safe_doctors;

-- 6. Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;