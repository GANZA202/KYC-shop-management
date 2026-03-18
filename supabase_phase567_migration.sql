-- PHASE 5, 6, 7 Migration: Credit, Debt Reports, and Payroll

-- 1. Credit Requests Table
CREATE TABLE public.credit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    supervisor_id UUID REFERENCES public.profiles(id) NOT NULL,
    sector_id UUID REFERENCES public.sectors(id) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    credit_limit NUMERIC(12,2) NOT NULL,
    status TEXT CHECK (status IN ('pending','approved','rejected','deducted')) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    deduction_month TEXT, -- Format: YYYY-MM
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Credit Request Items Table
CREATE TABLE public.credit_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_request_id UUID REFERENCES public.credit_requests(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payroll Periods Table
CREATE TABLE public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_label TEXT UNIQUE NOT NULL,   -- example: 2026-03
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    credit_window_start DATE NOT NULL,
    credit_window_end DATE NOT NULL,
    is_credit_window_open BOOLEAN DEFAULT TRUE,
    is_payroll_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payrolls Table
CREATE TABLE public.payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID REFERENCES public.payroll_periods(id) NOT NULL,
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    sector_id UUID REFERENCES public.sectors(id) NOT NULL,
    supervisor_id UUID REFERENCES public.profiles(id),
    team_leader_id UUID REFERENCES public.profiles(id),
    days_present INTEGER NOT NULL DEFAULT 0,
    days_absent INTEGER NOT NULL DEFAULT 0,
    daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_debt NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    carried_forward_debt NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('draft','finalized','paid')) NOT NULL DEFAULT 'draft',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(payroll_period_id, employee_id)
);

-- 5. Payroll Deductions Table
CREATE TABLE public.payroll_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID REFERENCES public.payrolls(id) ON DELETE CASCADE,
    deduction_type TEXT NOT NULL,
    reference_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Credit Requests
CREATE POLICY "Supervisors can view their own credit requests" ON public.credit_requests
    FOR SELECT USING (supervisor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'team_leader')));

CREATE POLICY "Supervisors can create credit requests" ON public.credit_requests
    FOR INSERT WITH CHECK (supervisor_id = auth.uid());

CREATE POLICY "Admins can update credit requests" ON public.credit_requests
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for Credit Request Items
CREATE POLICY "Users can view credit request items" ON public.credit_request_items
    FOR SELECT USING (TRUE);

CREATE POLICY "Supervisors can insert credit request items" ON public.credit_request_items
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.credit_requests WHERE id = credit_request_id AND supervisor_id = auth.uid()));

-- RLS Policies for Payroll
CREATE POLICY "Admins and Accountants can view all payroll" ON public.payrolls
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant')));

CREATE POLICY "Team Leaders can view their sector payroll" ON public.payrolls
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'team_leader' AND sector_id = public.payrolls.sector_id));

-- RPC: Approve Credit Request
CREATE OR REPLACE FUNCTION public.approve_credit_request(p_request_id UUID, p_admin_id UUID)
RETURNS VOID AS $$
DECLARE
    r_item RECORD;
    v_status TEXT;
BEGIN
    -- Check current status
    SELECT status INTO v_status FROM public.credit_requests WHERE id = p_request_id;
    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Request is not pending';
    END IF;

    -- Check stock for all items
    FOR r_item IN SELECT product_id, quantity FROM public.credit_request_items WHERE credit_request_id = p_request_id LOOP
        IF (SELECT quantity_in_stock FROM public.products WHERE id = r_item.product_id) < r_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', (SELECT product_name FROM public.products WHERE id = r_item.product_id);
        END IF;
    END LOOP;

    -- Deduct stock and record movement
    FOR r_item IN SELECT product_id, quantity, unit_price FROM public.credit_request_items WHERE credit_request_id = p_request_id LOOP
        UPDATE public.products 
        SET quantity_in_stock = quantity_in_stock - r_item.quantity,
            updated_at = NOW()
        WHERE id = r_item.product_id;

        INSERT INTO public.stock_movements (product_id, movement_type, quantity, unit_price, reference_type, reference_id, created_by)
        VALUES (r_item.product_id, 'stock_out', r_item.quantity, r_item.unit_price, 'credit_request', p_request_id, p_admin_id);
    END LOOP;

    -- Update request status
    UPDATE public.credit_requests
    SET status = 'approved',
        approved_by = p_admin_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Generate Payroll
CREATE OR REPLACE FUNCTION public.generate_payroll(p_period_id UUID)
RETURNS VOID AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_month_label TEXT;
    r_emp RECORD;
    v_days_present INTEGER;
    v_days_absent INTEGER;
    v_gross NUMERIC;
    v_debt NUMERIC;
    v_net NUMERIC;
    v_carried NUMERIC;
    v_payroll_id UUID;
    r_debt RECORD;
BEGIN
    SELECT start_date, end_date, month_label INTO v_start_date, v_end_date, v_month_label 
    FROM public.payroll_periods WHERE id = p_period_id;

    -- Loop through active employees
    FOR r_emp IN SELECT * FROM public.employees WHERE status = 'active' LOOP
        -- Calculate attendance
        SELECT COUNT(*) FILTER (WHERE status = 'present'),
               COUNT(*) FILTER (WHERE status = 'absent')
        INTO v_days_present, v_days_absent
        FROM public.attendance
        WHERE employee_id = r_emp.id AND attendance_date BETWEEN v_start_date AND v_end_date;

        -- Calculate gross salary (capped)
        v_gross := LEAST(v_days_present * r_emp.daily_rate, r_emp.monthly_max);

        -- Calculate total debt (approved requests for this month)
        SELECT COALESCE(SUM(total_amount), 0) INTO v_debt
        FROM public.credit_requests
        WHERE employee_id = r_emp.id AND status = 'approved' AND deduction_month = v_month_label;

        -- Calculate net and carry forward
        IF v_gross >= v_debt THEN
            v_net := v_gross - v_debt;
            v_carried := 0;
        ELSE
            v_net := 0;
            v_carried := v_debt - v_gross;
        END IF;

        -- Insert or Update Payroll
        INSERT INTO public.payrolls (
            payroll_period_id, employee_id, sector_id, supervisor_id, team_leader_id,
            days_present, days_absent, daily_rate, gross_salary, total_debt, net_salary, carried_forward_debt, status
        ) VALUES (
            p_period_id, r_emp.id, r_emp.sector_id, r_emp.supervisor_id, r_emp.team_leader_id,
            v_days_present, v_days_absent, r_emp.daily_rate, v_gross, v_debt, v_net, v_carried, 'draft'
        )
        ON CONFLICT (payroll_period_id, employee_id) DO UPDATE SET
            days_present = EXCLUDED.days_present,
            days_absent = EXCLUDED.days_absent,
            gross_salary = EXCLUDED.gross_salary,
            total_debt = EXCLUDED.total_debt,
            net_salary = EXCLUDED.net_salary,
            carried_forward_debt = EXCLUDED.carried_forward_debt,
            updated_at = NOW();
            
        -- Get payroll id
        SELECT id INTO v_payroll_id FROM public.payrolls WHERE payroll_period_id = p_period_id AND employee_id = r_emp.id;
        
        -- Clear old deductions for this payroll
        DELETE FROM public.payroll_deductions WHERE payroll_id = v_payroll_id;
        
        -- Insert deductions
        FOR r_debt IN SELECT id, total_amount, request_number FROM public.credit_requests 
                      WHERE employee_id = r_emp.id AND status = 'approved' AND deduction_month = v_month_label LOOP
            INSERT INTO public.payroll_deductions (payroll_id, deduction_type, reference_id, amount, description)
            VALUES (v_payroll_id, 'credit_request', r_debt.id, r_debt.total_amount, 'Credit Request ' || r_debt.request_number);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Finalize Payroll
CREATE OR REPLACE FUNCTION public.finalize_payroll(p_period_id UUID)
RETURNS VOID AS $$
DECLARE
    v_month_label TEXT;
BEGIN
    SELECT month_label INTO v_month_label FROM public.payroll_periods WHERE id = p_period_id;

    -- Mark payrolls as finalized
    UPDATE public.payrolls SET status = 'finalized', updated_at = NOW() WHERE payroll_period_id = p_period_id;

    -- Mark credit requests as deducted
    UPDATE public.credit_requests 
    SET status = 'deducted', updated_at = NOW() 
    WHERE status = 'approved' AND deduction_month = v_month_label;

    -- Lock the period
    UPDATE public.payroll_periods SET is_payroll_locked = TRUE WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Debt Report View
CREATE OR REPLACE VIEW public.debt_report_view AS
SELECT 
    cr.id AS request_id,
    cr.request_number,
    cr.request_date,
    cr.total_amount,
    cr.credit_limit,
    cr.status,
    cr.deduction_month,
    cr.approved_at,
    e.full_name AS employee_name,
    e.employee_code,
    e.national_id,
    e.phone,
    e.worker_type,
    s.name AS sector_name,
    p_sup.full_name AS supervisor_name,
    p_tl.full_name AS team_leader_name,
    cr.supervisor_id,
    cr.sector_id,
    e.team_leader_id
FROM public.credit_requests cr
JOIN public.employees e ON cr.employee_id = e.id
JOIN public.sectors s ON cr.sector_id = s.id
JOIN public.profiles p_sup ON cr.supervisor_id = p_sup.id
LEFT JOIN public.profiles p_tl ON e.team_leader_id = p_tl.id;
