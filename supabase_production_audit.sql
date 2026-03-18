-- Production Readiness Audit: Schema Improvements, Indexes, and Security

-- 1. Missing Indexes for Foreign Keys (Performance)
CREATE INDEX IF NOT EXISTS idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX IF NOT EXISTS idx_employees_sector_id ON public.employees(sector_id);
CREATE INDEX IF NOT EXISTS idx_employees_supervisor_id ON public.employees(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_employees_team_leader_id ON public.employees(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_supervisor_id ON public.attendance(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_credit_requests_employee_id ON public.credit_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_supervisor_id ON public.credit_requests(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_sector_id ON public.credit_requests(sector_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_approved_by ON public.credit_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_credit_request_items_request_id ON public.credit_request_items(credit_request_id);
CREATE INDEX IF NOT EXISTS idx_credit_request_items_product_id ON public.credit_request_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period_id ON public.payrolls(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON public.payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_sector_id ON public.payrolls(sector_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_supervisor_id ON public.payrolls(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_team_leader_id ON public.payrolls(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_payroll_id ON public.payroll_deductions(payroll_id);

-- 2. Tighten RLS for Credit Request Items
DROP POLICY IF EXISTS "Users can view credit request items" ON public.credit_request_items;
CREATE POLICY "Users can view items of accessible credit requests" ON public.credit_request_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.credit_requests cr
            WHERE cr.id = credit_request_id
            AND (
                cr.supervisor_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() 
                    AND p.role IN ('admin', 'accountant', 'team_leader')
                )
            )
        )
    );

-- 3. Security: Add role check to approve_credit_request RPC
CREATE OR REPLACE FUNCTION public.approve_credit_request(p_request_id UUID, p_admin_id UUID)
RETURNS VOID AS $$
DECLARE
    r_item RECORD;
    v_status TEXT;
    v_role user_role;
BEGIN
    -- Security Check: Ensure caller is an admin
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    IF v_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve credit requests';
    END IF;

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

-- 4. Add missing updated_at triggers for other tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_credit_requests_updated_at BEFORE UPDATE ON public.credit_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_payrolls_updated_at BEFORE UPDATE ON public.payrolls FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Ensure PII Protection: Profiles RLS
-- Already restricted to own profile or admin, but let's be explicit about email access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 6. Add audit fields to employees if missing
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE TRIGGER tr_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
