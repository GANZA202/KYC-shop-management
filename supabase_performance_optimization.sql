-- Performance Optimization Migration
-- 1. Enable pg_trgm extension for faster text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add Trigram Indexes for ILIKE searches
-- Employees search
CREATE INDEX IF NOT EXISTS idx_employees_full_name_trgm ON public.employees USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_code_trgm ON public.employees USING gin (employee_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_national_id_trgm ON public.employees USING gin (national_id gin_trgm_ops);

-- Products search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON public.products USING gin (sku gin_trgm_ops);

-- 3. Additional Composite Indexes for common filter patterns
-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_date_supervisor ON public.attendance (attendance_date, supervisor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_employee ON public.attendance (attendance_date, employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_supervisor_status ON public.attendance (supervisor_id, status);

-- Credit Requests
CREATE INDEX IF NOT EXISTS idx_credit_requests_status_date ON public.credit_requests (status, request_date);
CREATE INDEX IF NOT EXISTS idx_credit_requests_supervisor ON public.credit_requests (supervisor_id, status);
CREATE INDEX IF NOT EXISTS idx_credit_requests_employee ON public.credit_requests (employee_id, status);

-- Payrolls
CREATE INDEX IF NOT EXISTS idx_payrolls_period_sector ON public.payrolls (payroll_period_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period_status ON public.payrolls (payroll_period_id, status);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee ON public.payrolls (employee_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON public.stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type_created ON public.stock_movements (movement_type, created_at DESC);

-- 4. Optimize Profiles fetch
-- Index on role for filtering users by role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. Analyze tables to update statistics for the query planner
ANALYZE public.employees;
ANALYZE public.products;
ANALYZE public.attendance;
ANALYZE public.credit_requests;
ANALYZE public.payrolls;
ANALYZE public.stock_movements;
ANALYZE public.profiles;
