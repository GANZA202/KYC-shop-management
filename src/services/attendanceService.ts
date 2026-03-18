import { supabase } from '../lib/supabase';
import { Attendance, Employee } from '../types/database';

export const attendanceService = {
  async getAssignedEmployees(supervisorId: string) {
    return await supabase
      .from('employees')
      .select('*, sector:sectors(*)')
      .eq('supervisor_id', supervisorId)
      .eq('status', 'active')
      .order('full_name');
  },

  async getAttendanceForDate(date: string, supervisorId: string) {
    return await supabase
      .from('attendance')
      .select('*, employee:employees(*)')
      .eq('attendance_date', date)
      .eq('supervisor_id', supervisorId);
  },

  async submitAttendance(records: Partial<Attendance>[]) {
    return await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'employee_id,attendance_date' });
  },

  async getAttendanceHistory(filters: { 
    supervisorId?: string; 
    employeeId?: string; 
    startDate?: string; 
    endDate?: string;
    status?: string;
  }) {
    let query = supabase
      .from('attendance')
      .select('*, employee:employees(*)');

    if (filters.supervisorId) query = query.eq('supervisor_id', filters.supervisorId);
    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.startDate) query = query.gte('attendance_date', filters.startDate);
    if (filters.endDate) query = query.lte('attendance_date', filters.endDate);
    if (filters.status) query = query.eq('status', filters.status);

    return await query.order('attendance_date', { ascending: false });
  },

  async getSectorAttendanceSummary(sectorId: string, startDate: string, endDate: string) {
    // This is a more complex query, typically we'd use a RPC or a view
    // For now, we fetch the data and aggregate in JS
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employee:employees!inner(*)
      `)
      .eq('employee.sector_id', sectorId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);

    if (error) return { data: null, error };

    // Aggregate by employee
    const summary: Record<string, any> = {};
    data.forEach(record => {
      const empId = record.employee_id;
      if (!summary[empId]) {
        summary[empId] = {
          employee: record.employee,
          presentDays: 0,
          absentDays: 0,
          totalDays: 0
        };
      }
      if (record.status === 'present') summary[empId].presentDays++;
      else summary[empId].absentDays++;
      summary[empId].totalDays++;
    });

    return { data: Object.values(summary), error: null };
  },

  async getGlobalAttendanceReport(filters: {
    startDate: string;
    endDate: string;
    sectorId?: string;
    supervisorId?: string;
    status?: string;
  }) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees!inner(*, sector:sectors(*)),
        supervisor:profiles!attendance_supervisor_id_fkey(*)
      `)
      .gte('attendance_date', filters.startDate)
      .lte('attendance_date', filters.endDate);

    if (filters.sectorId) query = query.eq('employee.sector_id', filters.sectorId);
    if (filters.supervisorId) query = query.eq('supervisor_id', filters.supervisorId);
    if (filters.status) query = query.eq('status', filters.status);

    return await query.order('attendance_date', { ascending: false });
  }
};
