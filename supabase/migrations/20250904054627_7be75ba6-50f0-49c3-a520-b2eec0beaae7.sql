-- Create enum types for better data consistency
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE patient_type AS ENUM ('new', 'returning');
CREATE TYPE user_role AS ENUM ('admin', 'patient', 'doctor');

-- Create patients table
CREATE TABLE public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    insurance_carrier TEXT,
    insurance_member_id TEXT,
    insurance_group_number TEXT,
    patient_type patient_type DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialty TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0,
    years_experience INTEGER,
    consultation_fee DECIMAL(10,2),
    avatar_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    reason_for_visit TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctor schedules table
CREATE TABLE public.doctor_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table for admin access
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'patient',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "Patients can view their own data" ON public.patients
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage all patients" ON public.patients
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for doctors
CREATE POLICY "Everyone can view doctors" ON public.doctors
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage doctors" ON public.doctors
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for appointments
CREATE POLICY "Users can view relevant appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid()::text = patient_id::text OR 
        auth.uid()::text = doctor_id::text OR 
        EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all appointments" ON public.appointments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for doctor schedules
CREATE POLICY "Everyone can view doctor schedules" ON public.doctor_schedules
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage doctor schedules" ON public.doctor_schedules
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for user profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample doctors
INSERT INTO public.doctors (first_name, last_name, email, specialty, phone, bio, rating, years_experience, consultation_fee) VALUES
('Sarah', 'Johnson', 'dr.sarah@clinic.com', 'Cardiology', '+1-555-0101', 'Experienced cardiologist specializing in heart disease prevention and treatment.', 4.8, 12, 250.00),
('Michael', 'Chen', 'dr.chen@clinic.com', 'Neurology', '+1-555-0102', 'Neurologist with expertise in brain and nervous system disorders.', 4.9, 15, 300.00),
('Emily', 'Rodriguez', 'dr.emily@clinic.com', 'Pediatrics', '+1-555-0103', 'Dedicated pediatrician providing comprehensive care for children.', 4.7, 8, 180.00),
('David', 'Thompson', 'dr.david@clinic.com', 'Orthopedics', '+1-555-0104', 'Orthopedic surgeon specializing in bone and joint procedures.', 4.6, 20, 350.00),
('Lisa', 'Anderson', 'dr.lisa@clinic.com', 'Dermatology', '+1-555-0105', 'Dermatologist focused on skin health and cosmetic procedures.', 4.9, 10, 200.00);

-- Insert sample doctor schedules (Monday to Friday, 9 AM to 5 PM)
INSERT INTO public.doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT d.id, generate_series(1, 5) as day_of_week, '09:00'::time, '17:00'::time
FROM public.doctors d;

-- Insert sample patients (50 patients with diverse data)
INSERT INTO public.patients (first_name, last_name, email, phone, date_of_birth, address, emergency_contact_name, emergency_contact_phone, insurance_carrier, insurance_member_id, insurance_group_number, patient_type) VALUES
('John', 'Smith', 'john.smith@email.com', '+1-555-1001', '1985-03-15', '123 Main St, City, State 12345', 'Jane Smith', '+1-555-1002', 'Blue Cross', 'BC123456789', 'GRP001', 'returning'),
('Maria', 'Garcia', 'maria.garcia@email.com', '+1-555-1003', '1990-07-22', '456 Oak Ave, City, State 12345', 'Carlos Garcia', '+1-555-1004', 'Aetna', 'AET987654321', 'GRP002', 'new'),
('Robert', 'Johnson', 'robert.johnson@email.com', '+1-555-1005', '1978-11-08', '789 Pine St, City, State 12345', 'Linda Johnson', '+1-555-1006', 'Cigna', 'CIG456789123', 'GRP003', 'returning'),
('Emma', 'Wilson', 'emma.wilson@email.com', '+1-555-1007', '1995-02-14', '321 Elm St, City, State 12345', 'David Wilson', '+1-555-1008', 'United Healthcare', 'UHC789123456', 'GRP004', 'new'),
('James', 'Brown', 'james.brown@email.com', '+1-555-1009', '1982-09-30', '654 Maple Ave, City, State 12345', 'Sarah Brown', '+1-555-1010', 'Blue Cross', 'BC234567890', 'GRP001', 'returning'),
('Isabella', 'Davis', 'isabella.davis@email.com', '+1-555-1011', '1988-05-18', '987 Cedar St, City, State 12345', 'Michael Davis', '+1-555-1012', 'Aetna', 'AET345678912', 'GRP002', 'new'),
('William', 'Miller', 'william.miller@email.com', '+1-555-1013', '1975-12-03', '147 Birch Ave, City, State 12345', 'Patricia Miller', '+1-555-1014', 'Cigna', 'CIG567891234', 'GRP003', 'returning'),
('Sophia', 'Moore', 'sophia.moore@email.com', '+1-555-1015', '1992-08-25', '258 Spruce St, City, State 12345', 'Christopher Moore', '+1-555-1016', 'United Healthcare', 'UHC891234567', 'GRP004', 'new'),
('Alexander', 'Taylor', 'alexander.taylor@email.com', '+1-555-1017', '1987-01-12', '369 Walnut Ave, City, State 12345', 'Jennifer Taylor', '+1-555-1018', 'Blue Cross', 'BC345678901', 'GRP001', 'returning'),
('Olivia', 'Anderson', 'olivia.anderson@email.com', '+1-555-1019', '1993-06-07', '741 Hickory St, City, State 12345', 'Daniel Anderson', '+1-555-1020', 'Aetna', 'AET456789123', 'GRP002', 'new'),
('Benjamin', 'Thomas', 'benjamin.thomas@email.com', '+1-555-1021', '1980-04-19', '852 Poplar Ave, City, State 12345', 'Lisa Thomas', '+1-555-1022', 'Cigna', 'CIG678912345', 'GRP003', 'returning'),
('Charlotte', 'Jackson', 'charlotte.jackson@email.com', '+1-555-1023', '1991-10-11', '963 Sycamore St, City, State 12345', 'Robert Jackson', '+1-555-1024', 'United Healthcare', 'UHC912345678', 'GRP004', 'new'),
('Henry', 'White', 'henry.white@email.com', '+1-555-1025', '1984-07-28', '159 Chestnut Ave, City, State 12345', 'Mary White', '+1-555-1026', 'Blue Cross', 'BC456789012', 'GRP001', 'returning'),
('Amelia', 'Harris', 'amelia.harris@email.com', '+1-555-1027', '1989-03-16', '357 Ash St, City, State 12345', 'John Harris', '+1-555-1028', 'Aetna', 'AET567891234', 'GRP002', 'new'),
('Lucas', 'Martin', 'lucas.martin@email.com', '+1-555-1029', '1977-11-05', '468 Beech Ave, City, State 12345', 'Susan Martin', '+1-555-1030', 'Cigna', 'CIG789123456', 'GRP003', 'returning'),
('Harper', 'Thompson', 'harper.thompson@email.com', '+1-555-1031', '1994-02-23', '579 Willow St, City, State 12345', 'Kevin Thompson', '+1-555-1032', 'United Healthcare', 'UHC123456789', 'GRP004', 'new'),
('Ethan', 'Garcia', 'ethan.garcia@email.com', '+1-555-1033', '1986-08-14', '681 Cherry Ave, City, State 12345', 'Angela Garcia', '+1-555-1034', 'Blue Cross', 'BC567890123', 'GRP001', 'returning'),
('Evelyn', 'Martinez', 'evelyn.martinez@email.com', '+1-555-1035', '1990-12-31', '792 Dogwood St, City, State 12345', 'Carlos Martinez', '+1-555-1036', 'Aetna', 'AET678912345', 'GRP002', 'new'),
('Mason', 'Robinson', 'mason.robinson@email.com', '+1-555-1037', '1983-05-09', '813 Magnolia Ave, City, State 12345', 'Jessica Robinson', '+1-555-1038', 'Cigna', 'CIG891234567', 'GRP003', 'returning'),
('Abigail', 'Clark', 'abigail.clark@email.com', '+1-555-1039', '1992-01-27', '924 Redwood St, City, State 12345', 'Michael Clark', '+1-555-1040', 'United Healthcare', 'UHC234567890', 'GRP004', 'new'),
('Logan', 'Rodriguez', 'logan.rodriguez@email.com', '+1-555-1041', '1979-09-15', '135 Sequoia Ave, City, State 12345', 'Maria Rodriguez', '+1-555-1042', 'Blue Cross', 'BC678901234', 'GRP001', 'returning'),
('Ella', 'Lewis', 'ella.lewis@email.com', '+1-555-1043', '1995-04-03', '246 Cypress St, City, State 12345', 'David Lewis', '+1-555-1044', 'Aetna', 'AET789123456', 'GRP002', 'new'),
('Jackson', 'Lee', 'jackson.lee@email.com', '+1-555-1045', '1988-10-21', '357 Juniper Ave, City, State 12345', 'Sarah Lee', '+1-555-1046', 'Cigna', 'CIG912345678', 'GRP003', 'returning'),
('Avery', 'Walker', 'avery.walker@email.com', '+1-555-1047', '1981-06-18', '468 Cedar St, City, State 12345', 'James Walker', '+1-555-1048', 'United Healthcare', 'UHC345678901', 'GRP004', 'new'),
('Sebastian', 'Hall', 'sebastian.hall@email.com', '+1-555-1049', '1993-12-06', '579 Fir Ave, City, State 12345', 'Jennifer Hall', '+1-555-1050', 'Blue Cross', 'BC789012345', 'GRP001', 'returning'),
('Luna', 'Allen', 'luna.allen@email.com', '+1-555-1051', '1987-03-24', '681 Hemlock St, City, State 12345', 'Robert Allen', '+1-555-1052', 'Aetna', 'AET891234567', 'GRP002', 'new'),
('Gabriel', 'Young', 'gabriel.young@email.com', '+1-555-1053', '1976-11-12', '792 Larch Ave, City, State 12345', 'Linda Young', '+1-555-1054', 'Cigna', 'CIG123456789', 'GRP003', 'returning'),
('Aria', 'Hernandez', 'aria.hernandez@email.com', '+1-555-1055', '1994-07-30', '813 Tamarack St, City, State 12345', 'Carlos Hernandez', '+1-555-1056', 'United Healthcare', 'UHC456789012', 'GRP004', 'new'),
('Owen', 'King', 'owen.king@email.com', '+1-555-1057', '1985-02-17', '924 Basswood Ave, City, State 12345', 'Patricia King', '+1-555-1058', 'Blue Cross', 'BC890123456', 'GRP001', 'returning'),
('Scarlett', 'Wright', 'scarlett.wright@email.com', '+1-555-1059', '1991-08-05', '135 Cottonwood St, City, State 12345', 'Daniel Wright', '+1-555-1060', 'Aetna', 'AET912345678', 'GRP002', 'new'),
('Carter', 'Lopez', 'carter.lopez@email.com', '+1-555-1061', '1982-04-23', '246 Elderberry Ave, City, State 12345', 'Maria Lopez', '+1-555-1062', 'Cigna', 'CIG234567890', 'GRP003', 'returning'),
('Violet', 'Hill', 'violet.hill@email.com', '+1-555-1063', '1989-10-10', '357 Ginkgo St, City, State 12345', 'John Hill', '+1-555-1064', 'United Healthcare', 'UHC567890123', 'GRP004', 'new'),
('Wyatt', 'Scott', 'wyatt.scott@email.com', '+1-555-1065', '1978-06-28', '468 Hawthorn Ave, City, State 12345', 'Susan Scott', '+1-555-1066', 'Blue Cross', 'BC901234567', 'GRP001', 'returning'),
('Grace', 'Green', 'grace.green@email.com', '+1-555-1067', '1996-01-15', '579 Ironwood St, City, State 12345', 'Kevin Green', '+1-555-1068', 'Aetna', 'AET123456789', 'GRP002', 'new'),
('Julian', 'Adams', 'julian.adams@email.com', '+1-555-1069', '1984-09-02', '681 Locust Ave, City, State 12345', 'Angela Adams', '+1-555-1070', 'Cigna', 'CIG345678901', 'GRP003', 'returning'),
('Chloe', 'Baker', 'chloe.baker@email.com', '+1-555-1071', '1992-05-20', '792 Mulberry St, City, State 12345', 'Michael Baker', '+1-555-1072', 'United Healthcare', 'UHC678901234', 'GRP004', 'new'),
('Isaac', 'Gonzalez', 'isaac.gonzalez@email.com', '+1-555-1073', '1980-11-08', '813 Olive Ave, City, State 12345', 'Jessica Gonzalez', '+1-555-1074', 'Blue Cross', 'BC012345678', 'GRP001', 'returning'),
('Zoe', 'Nelson', 'zoe.nelson@email.com', '+1-555-1075', '1993-07-26', '924 Pecan St, City, State 12345', 'David Nelson', '+1-555-1076', 'Aetna', 'AET234567890', 'GRP002', 'new'),
('Levi', 'Carter', 'levi.carter@email.com', '+1-555-1077', '1986-03-14', '135 Plum Ave, City, State 12345', 'Sarah Carter', '+1-555-1078', 'Cigna', 'CIG456789012', 'GRP003', 'returning'),
('Nora', 'Mitchell', 'nora.mitchell@email.com', '+1-555-1079', '1991-09-01', '246 Quince St, City, State 12345', 'James Mitchell', '+1-555-1080', 'United Healthcare', 'UHC789012345', 'GRP004', 'new'),
('Aaron', 'Perez', 'aaron.perez@email.com', '+1-555-1081', '1977-05-19', '357 Redbud Ave, City, State 12345', 'Maria Perez', '+1-555-1082', 'Blue Cross', 'BC123456789', 'GRP001', 'returning'),
('Hazel', 'Roberts', 'hazel.roberts@email.com', '+1-555-1083', '1994-11-07', '468 Serviceberry St, City, State 12345', 'Robert Roberts', '+1-555-1084', 'Aetna', 'AET345678901', 'GRP002', 'new'),
('Caleb', 'Turner', 'caleb.turner@email.com', '+1-555-1085', '1988-07-25', '579 Tulip Ave, City, State 12345', 'Linda Turner', '+1-555-1086', 'Cigna', 'CIG567890123', 'GRP003', 'returning'),
('Lily', 'Phillips', 'lily.phillips@email.com', '+1-555-1087', '1983-01-13', '681 Viburnum St, City, State 12345', 'Daniel Phillips', '+1-555-1088', 'United Healthcare', 'UHC890123456', 'GRP004', 'new'),
('Nathan', 'Campbell', 'nathan.campbell@email.com', '+1-555-1089', '1995-08-31', '792 Weeping Willow Ave, City, State 12345', 'Jennifer Campbell', '+1-555-1090', 'Blue Cross', 'BC234567890', 'GRP001', 'returning'),
('Aubrey', 'Parker', 'aubrey.parker@email.com', '+1-555-1091', '1981-04-18', '813 Yucca St, City, State 12345', 'Carlos Parker', '+1-555-1092', 'Aetna', 'AET456789012', 'GRP002', 'new'),
('Grayson', 'Evans', 'grayson.evans@email.com', '+1-555-1093', '1990-10-06', '924 Zelkova Ave, City, State 12345', 'Patricia Evans', '+1-555-1094', 'Cigna', 'CIG678901234', 'GRP003', 'returning'),
('Eleanor', 'Edwards', 'eleanor.edwards@email.com', '+1-555-1095', '1987-02-24', '135 Arborvitae St, City, State 12345', 'Michael Edwards', '+1-555-1096', 'United Healthcare', 'UHC901234567', 'GRP004', 'new'),
('Leo', 'Collins', 'leo.collins@email.com', '+1-555-1097', '1979-08-12', '246 Bald Cypress Ave, City, State 12345', 'Lisa Collins', '+1-555-1098', 'Blue Cross', 'BC345678901', 'GRP001', 'returning'),
('Penelope', 'Stewart', 'penelope.stewart@email.com', '+1-555-1099', '1992-12-30', '357 Dawn Redwood St, City, State 12345', 'John Stewart', '+1-555-1100', 'Aetna', 'AET567890123', 'GRP002', 'new');