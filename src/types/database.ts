export type UserRole = 'admin' | 'accountant' | 'team_leader' | 'supervisor';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  sector_id: string | null;
  created_at: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  national_id: string;
  email: string | null;
  phone: string | null;
  worker_type: 'casual' | 'supervisor';
  daily_rate: number;
  monthly_max: number;
  bank_name: string | null;
  bank_account: string | null;
  sector_id: string | null;
  team_leader_id: string | null;
  supervisor_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  product_name: string;
  category_id: string | null;
  unit_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: ProductCategory;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'stock_in' | 'stock_out' | 'adjustment';
  quantity: number;
  unit_price: number | null;
  reference_type: 'purchase' | 'credit_request' | 'manual_adjustment' | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Attendance {
  id: string;
  employee_id: string;
  supervisor_id: string;
  attendance_date: string;
  status: 'present' | 'absent';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: Employee;
}

export interface CreditRequest {
  id: string;
  request_number: string;
  employee_id: string;
  supervisor_id: string;
  sector_id: string;
  request_date: string;
  total_amount: number;
  credit_limit: number;
  status: 'pending' | 'approved' | 'rejected' | 'deducted';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  deduction_month: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: Employee;
  supervisor?: Profile;
  sector?: Sector;
  items?: CreditRequestItem[];
}

export interface CreditRequestItem {
  id: string;
  credit_request_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface PayrollPeriod {
  id: string;
  name: string;
  month_label: string;
  start_date: string;
  end_date: string;
  credit_window_start: string;
  credit_window_end: string;
  is_credit_window_open: boolean;
  is_payroll_locked: boolean;
  status: 'open' | 'processing' | 'closed';
  created_at: string;
}

export interface Payroll {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  sector_id: string;
  supervisor_id: string | null;
  team_leader_id: string | null;
  days_present: number;
  days_absent: number;
  daily_rate: number;
  gross_salary: number;
  total_debt: number;
  total_deductions: number;
  net_salary: number;
  carried_forward_debt: number;
  status: 'draft' | 'finalized' | 'paid';
  generated_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: Employee;
  period?: PayrollPeriod;
  sector?: Sector;
  deductions?: PayrollDeduction[];
}

export interface PayrollDeduction {
  id: string;
  payroll_id: string;
  deduction_type: string;
  reference_id: string | null;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface DebtReportRow {
  request_id: string;
  request_number: string;
  request_date: string;
  total_amount: number;
  credit_limit: number;
  status: string;
  deduction_month: string | null;
  approved_at: string | null;
  employee_name: string;
  employee_code: string;
  national_id: string;
  phone: string | null;
  worker_type: string;
  sector_name: string;
  supervisor_name: string;
  team_leader_name: string | null;
  supervisor_id: string;
  sector_id: string;
  team_leader_id: string | null;
}
