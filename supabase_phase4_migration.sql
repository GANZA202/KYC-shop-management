-- Phase 4 Migration: Attendance Management

-- 1. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    supervisor_id UUID REFERENCES auth.users(id) NOT NULL,
    attendance_date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- 2. Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Attendance

-- Supervisors: Manage attendance for their assigned workers
CREATE POLICY "Supervisors can manage attendance for their assigned workers" ON public.attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE id = attendance.employee_id AND supervisor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE id = attendance.employee_id AND supervisor_id = auth.uid()
        )
    );

-- Team Leaders: View attendance for their sector
CREATE POLICY "Team Leaders can view attendance for their sector" ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.employees e ON e.sector_id = p.sector_id
            WHERE p.id = auth.uid() AND p.role = 'team_leader' AND e.id = attendance.employee_id
        )
    );

-- Admins and Accountants: View all attendance
CREATE POLICY "Admins and Accountants can view all attendance" ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'accountant')
        )
    );

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();
