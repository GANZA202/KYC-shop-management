import { supabase } from '../lib/supabase';
import { DebtReportRow } from '../types/database';

export const reportService = {
  async getDebtReport(filters?: any) {
    let query = supabase
      .from('debt_report_view')
      .select('*');
    
    if (filters?.month) query = query.eq('deduction_month', filters.month);
    if (filters?.sector_id) query = query.eq('sector_id', filters.sector_id);
    if (filters?.supervisor_id) query = query.eq('supervisor_id', filters.supervisor_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.worker_type) query = query.eq('worker_type', filters.worker_type);
    if (filters?.employee_name) query = query.ilike('employee_name', `%${filters.employee_name}%`);
    if (filters?.employee_code) query = query.eq('employee_code', filters.employee_code);
    if (filters?.national_id) query = query.eq('national_id', filters.national_id);
    if (filters?.phone) query = query.ilike('phone', `%${filters.phone}%`);
    if (filters?.startDate) query = query.gte('request_date', filters.startDate);
    if (filters?.endDate) query = query.lte('request_date', filters.endDate);
    
    const { data, error } = await query.order('request_date', { ascending: false });
    
    if (error) throw error;
    return data as DebtReportRow[];
  },

  async getSectorDebtSummary(sectorId: string, month?: string) {
    let query = supabase
      .from('debt_report_view')
      .select('*')
      .eq('sector_id', sectorId);
    
    if (month) query = query.eq('deduction_month', month);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as DebtReportRow[];
  },

  async getSupervisorDebtSummary(supervisorId: string, month?: string) {
    let query = supabase
      .from('debt_report_view')
      .select('*')
      .eq('supervisor_id', supervisorId);
    
    if (month) query = query.eq('deduction_month', month);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as DebtReportRow[];
  }
};
