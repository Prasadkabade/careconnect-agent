-- Fix the security definer view warning by making it a regular view
-- Since we're restricting doctor access to authenticated users anyway, we can make this a regular view

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