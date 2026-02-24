-- =====================================================
-- IAOMS: Role Recipients Table Migration
-- Run this in Supabase SQL Editor (supabase.com/dashboard)
-- Project: nriwzgorpkwskdqmoiav
-- =====================================================

-- Create role_recipients table
CREATE TABLE IF NOT EXISTS public.role_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  department TEXT,
  branch TEXT,
  designation TEXT,
  phone TEXT,
  employee_id TEXT,
  bio TEXT,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.role_recipients ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated users to READ all active recipients
CREATE POLICY "Allow read access to active recipients"
  ON public.role_recipients
  FOR SELECT
  USING (is_active = TRUE);

-- Create function to auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_role_recipients_updated_at
  BEFORE UPDATE ON public.role_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA: Add your real institutional members here
-- Replace these with actual staff/faculty records
-- =====================================================
-- INSERT INTO public.role_recipients (name, email, role, department, branch, designation, is_active)
-- VALUES
--   ('Dr. S. Srinivasa Rao', 'principal@hitam.org', 'Principal', 'Administration', 'Main', 'Principal', true),
--   ('Mr. A. Ramesh', 'registrar@hitam.org', 'Registrar', 'Administration', 'Main', 'Registrar', true),
--   ('Dr. B. Venkateswara Rao', 'hod.cse@hitam.org', 'HOD', 'Computer Science', 'Main', 'Head of Department', true),
--   ('Dr. C. Priyanka', 'programhead.cse@hitam.org', 'Program Department Head', 'Computer Science', 'Main', 'Program Department Head', true),
--   ('Mr. D. Naresh Kumar', 'employee@hitam.org', 'Employee', 'Administration', 'Main', 'Staff', true);
