import { supabase } from '../lib/supabase';
import { PayrollPeriod, Payroll } from '../types/database';

export const payrollService = {
  async getPeriods() {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('month_label', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createPeriod(period: Partial<PayrollPeriod>) {
    const { data, error } = await supabase
      .from('payroll_periods')
      .insert(period)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async toggleCreditWindow(periodId: string, isOpen: boolean) {
    const { error } = await supabase
      .from('payroll_periods')
      .update({ is_credit_window_open: isOpen })
      .eq('id', periodId);
    
    if (error) throw error;
  },

  async generatePayroll(periodId: string) {
    const { error } = await supabase.rpc('generate_payroll', {
      p_period_id: periodId
    });
    
    if (error) throw error;
  },

  async finalizePayroll(periodId: string) {
    const { error } = await supabase.rpc('finalize_payroll', {
      p_period_id: periodId
    });
    
    if (error) throw error;
  },

  async getPayrolls(periodId: string, filters?: any) {
    let query = supabase
      .from('payrolls')
      .select('*, employee:employees(*), sector:sectors(*)')
      .eq('payroll_period_id', periodId);
    
    if (filters?.sector_id) query = query.eq('sector_id', filters.sector_id);
    if (filters?.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getPayrollDetails(payrollId: string) {
    const { data, error } = await supabase
      .from('payrolls')
      .select('*, employee:employees(*), sector:sectors(*), deductions:payroll_deductions(*)')
      .eq('id', payrollId)
      .single();
    
    if (error) throw error;
    return data;
  }
};
