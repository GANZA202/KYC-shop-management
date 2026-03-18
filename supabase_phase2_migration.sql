-- Phase 2 Migration: Employee Management Enhancements

-- 1. Add sector_id to profiles to associate Team Leaders with specific sectors
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- 2. Update employees table with new requirements
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS worker_type TEXT CHECK (worker_type IN ('casual', 'supervisor')),
ADD COLUMN IF NOT EXISTS daily_rate NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_max NUMERIC,
ADD COLUMN IF NOT EXISTS team_leader_id UUID REFERENCES public.profiles(id);

-- 3. Function to auto-generate employee code
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    last_num INTEGER;
BEGIN
    -- Get the last number from the highest employee_code
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 5) AS INTEGER)), 0)
    INTO last_num
    FROM public.employees
    WHERE employee_code LIKE 'EMP-%';

    -- Generate new code
    new_code := 'EMP-' || LPAD((last_num + 1)::TEXT, 4, '0');
    
    NEW.employee_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for auto-generating employee code on insert
DROP TRIGGER IF EXISTS tr_generate_employee_code ON public.employees;
CREATE TRIGGER tr_generate_employee_code
    BEFORE INSERT ON public.employees
    FOR EACH ROW
    WHEN (NEW.employee_code IS NULL)
    EXECUTE FUNCTION generate_employee_code();

-- 5. Update RLS for employees to handle Team Leader restrictions
DROP POLICY IF EXISTS "Supervisors can view their employees" ON public.employees;

CREATE POLICY "Admins and Accountants can view all employees" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'accountant')
        )
    );

CREATE POLICY "Team Leaders can view employees in their sector" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'team_leader' AND sector_id = employees.sector_id
        )
    );

CREATE POLICY "Supervisors can view their assigned employees" ON public.employees
    FOR SELECT USING (
        supervisor_id = auth.uid()
    );

-- 6. Insert policies for registration
CREATE POLICY "Admins can register anyone" ON public.employees
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Team Leaders can register in their sector" ON public.employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'team_leader' AND sector_id = employees.sector_id
        )
    );
