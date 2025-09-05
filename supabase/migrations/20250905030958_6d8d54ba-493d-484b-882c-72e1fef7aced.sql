-- Create a SECURITY DEFINER helper to avoid recursive RLS lookups
create or replace function public.has_role(_user_id uuid, _role user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = _user_id
      and role = _role
  );
$$;

-- USER PROFILES: fix recursive policy
drop policy if exists "Admins can view all profiles" on public.user_profiles;
create policy "Admins can view all profiles"
  on public.user_profiles
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- DOCTORS: use helper in restrictive admin policy
drop policy if exists "Admins can manage doctors" on public.doctors;
create policy "Admins can manage doctors"
  on public.doctors
  as restrictive
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- DOCTOR SCHEDULES: use helper
drop policy if exists "Admins can manage doctor schedules" on public.doctor_schedules;
create policy "Admins can manage doctor schedules"
  on public.doctor_schedules
  as restrictive
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- PATIENTS: fix policies to avoid recursion
drop policy if exists "Admins can manage all patients" on public.patients;
create policy "Admins can manage all patients"
  on public.patients
  as restrictive
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Patients can view their own data" on public.patients;
create policy "Patients can view their own data"
  on public.patients
  for select
  using ((auth.uid()::text = id::text) or public.has_role(auth.uid(), 'admin'));

-- APPOINTMENTS: use helper and keep patient/doctor self-access
drop policy if exists "Admins can manage all appointments" on public.appointments;
create policy "Admins can manage all appointments"
  on public.appointments
  as restrictive
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view relevant appointments" on public.appointments;
create policy "Users can view relevant appointments"
  on public.appointments
  for select
  using ((auth.uid()::text = patient_id::text) or (auth.uid()::text = doctor_id::text) or public.has_role(auth.uid(), 'admin'));
