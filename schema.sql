-- SQL DDL schema for the NayePankh Volunteer Registration System
-- You can run this directly in the Supabase SQL Editor.

-- 1. Create the volunteers table
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL CHECK (char_length(phone) >= 8),
    city TEXT NOT NULL CHECK (char_length(city) >= 2),
    causes TEXT[] NOT NULL, -- Values: 'Food Drives', 'Menstrual Hygiene Awareness', 'Clothing Distribution', 'Education'
    availability TEXT NOT NULL CHECK (availability IN ('Weekdays', 'Weekends', 'Both')),
    hours_per_week INTEGER NOT NULL DEFAULT 0 CHECK (hours_per_week >= 0 AND hours_per_week <= 168),
    skills TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Active', 'Inactive')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create index on email for faster searches and constraint checks
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON public.volunteers (email);
-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers (status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- Policy: Enable public registrations (NO login required to register)
CREATE POLICY "Enable insert for public" 
ON public.volunteers 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Enable read access for authenticated administrators only
CREATE POLICY "Enable select for authenticated users" 
ON public.volunteers 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Enable update access for authenticated administrators only (for status changes)
CREATE POLICY "Enable update for authenticated users" 
ON public.volunteers 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy: Enable delete access for authenticated administrators only
CREATE POLICY "Enable delete for authenticated users" 
ON public.volunteers 
FOR DELETE 
TO authenticated 
USING (true);

-- 5. Insert mock data for testing (optional)
-- Uncomment the block below if you want to seed your Supabase database.
/*
INSERT INTO public.volunteers (full_name, email, phone, city, causes, availability, hours_per_week, skills, status, registered_at) VALUES
('Aarav Sharma', 'aarav.sharma@gmail.com', '+91 98765 43210', 'New Delhi', ARRAY['Food Drives', 'Clothing Distribution'], 'Weekends', 6, 'Event management, coordination, public speaking.', 'Active', now() - INTERVAL '95 days'),
('Diya Patel', 'diya.patel@yahoo.com', '+91 91234 56789', 'Mumbai', ARRAY['Menstrual Hygiene Awareness', 'Education'], 'Both', 10, 'Trained educator, social work experience, content creation.', 'Active', now() - INTERVAL '80 days'),
('Rahul Verma', 'rahul.verma@outlook.com', '+91 98111 22233', 'Lucknow', ARRAY['Food Drives'], 'Weekdays', 4, 'Logistics, driving, local community network.', 'Approved', now() - INTERVAL '70 days'),
('Ananya Iyer', 'ananya.iyer@gmail.com', '+91 94440 55566', 'Bengaluru', ARRAY['Education'], 'Weekends', 8, 'Teaching Mathematics, English tutoring, mentoring kids.', 'Pending', now() - INTERVAL '3 days'),
('Kabir Mehta', 'kabir.mehta@gmail.com', '+91 99887 76655', 'Pune', ARRAY['Clothing Distribution', 'Food Drives'], 'Both', 12, 'Inventory management, sorting, drives management.', 'Active', now() - INTERVAL '58 days'),
('Sneha Reddy', 'sneha.reddy@gmail.com', '+91 88877 66554', 'Hyderabad', ARRAY['Menstrual Hygiene Awareness'], 'Weekdays', 5, 'Public health student, research, conducting workshops.', 'Pending', now() - INTERVAL '1 days'),
('Rohan Gupta', 'rohan.gupta@gmail.com', '+91 90000 11122', 'Lucknow', ARRAY['Food Drives', 'Education'], 'Weekends', 6, 'Photography, social media marketing, local outreach.', 'Inactive', now() - INTERVAL '102 days'),
('Meera Nair', 'meera.nair@gmail.com', '+91 93333 44455', 'Kochi', ARRAY['Education', 'Menstrual Hygiene Awareness'], 'Both', 15, 'Counseling, mental health advocate, teaching.', 'Active', now() - INTERVAL '30 days');
*/
