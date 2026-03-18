-- KYC Shop Credit, Inventory, Attendance & Payroll Management System
-- Database Schema for Supabase

-- 1. Create Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'team_leader', 'supervisor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'supervisor',
    avatar_url TEXT,
    sector_id UUID, -- Added later via foreign key to avoid circular dependency
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sectors table
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles now that sectors exists
DO $$ BEGIN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT fk_profiles_sector 
    FOREIGN KEY (sector_id) REFERENCES public.sectors(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    worker_type TEXT NOT NULL CHECK (worker_type IN ('casual', 'supervisor')),
    daily_rate NUMERIC NOT NULL DEFAULT 0,
    monthly_max NUMERIC NOT NULL DEFAULT 0,
    bank_name TEXT,
    bank_account TEXT,
    sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    team_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Tables
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment')),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC,
    reference_type TEXT CHECK (reference_type IN ('purchase', 'credit_request', 'manual_adjustment')),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- 7. Credit & Debt Tables
CREATE TABLE IF NOT EXISTS public.credit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    credit_limit NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deducted')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    deduction_month TEXT, -- Format: YYYY-MM
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_request_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_request_id UUID REFERENCES public.credit_requests(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    line_total NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payroll Tables
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_label TEXT NOT NULL UNIQUE, -- e.g., "March 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    credit_window_start DATE NOT NULL,
    credit_window_end DATE NOT NULL,
    is_credit_window_open BOOLEAN DEFAULT TRUE,
    is_payroll_locked BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'processing', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payrolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    team_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    days_present INTEGER NOT NULL DEFAULT 0,
    days_absent INTEGER NOT NULL DEFAULT 0,
    daily_rate NUMERIC NOT NULL DEFAULT 0,
    gross_salary NUMERIC NOT NULL DEFAULT 0,
    total_debt NUMERIC NOT NULL DEFAULT 0,
    total_deductions NUMERIC NOT NULL DEFAULT 0,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    carried_forward_debt NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(payroll_period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.payroll_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID REFERENCES public.payrolls(id) ON DELETE CASCADE,
    deduction_type TEXT NOT NULL,
    reference_id UUID,
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified for now, can be hardened later)
DO $$ BEGIN
    CREATE POLICY "Public read access" ON public.profiles FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.sectors FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.employees FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.product_categories FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.products FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.stock_movements FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.attendance FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.credit_requests FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.credit_request_items FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.payroll_periods FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.payrolls FOR SELECT USING (true);
    CREATE POLICY "Public read access" ON public.payroll_deductions FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Allow all authenticated users to insert/update for now (prototyping)
DO $$ BEGIN
    CREATE POLICY "Auth insert" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.sectors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.sectors FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.employees FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.product_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.product_categories FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.stock_movements FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.attendance FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.credit_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.credit_requests FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.credit_request_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.credit_request_items FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.payroll_periods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.payroll_periods FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.payrolls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.payrolls FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Auth insert" ON public.payroll_deductions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Auth update" ON public.payroll_deductions FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'supervisor'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
