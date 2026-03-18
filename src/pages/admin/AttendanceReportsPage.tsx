import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Loader2,
  Filter,
  Calendar,
  Download,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { supabase } from '../../lib/supabase';
import { Sector, Profile } from '../../types/database';
import { cn } from '../../lib/utils';

export function AttendanceReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sectorFilter, setSectorFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchMetadata();
    fetchReports();
  }, [startDate, endDate, sectorFilter, supervisorFilter, statusFilter]);

  const fetchMetadata = async () => {
    const [sectorsRes, supervisorsRes] = await Promise.all([
      supabase.from('sectors').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'supervisor').order('full_name')
    ]);
    if (sectorsRes.data) setSectors(sectorsRes.data);
    if (supervisorsRes.data) setSupervisors(supervisorsRes.data);
  };

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await attendanceService.getGlobalAttendanceReport({
      startDate,
      endDate,
      sectorId: sectorFilter || undefined,
      supervisorId: supervisorFilter || undefined,
      status: statusFilter || undefined
    });
    if (error) console.error(error);
    else setReports(data || []);
    setLoading(false);
  };

  const handleExport = () => {
    // Simple CSV export logic
    const headers = ['Date', 'Employee Code', 'Employee Name', 'Sector', 'Supervisor', 'Status', 'Notes'];
    const rows = reports.map(r => [
      r.attendance_date,
      r.employee.employee_code,
      r.employee.full_name,
      r.employee.sector?.name || '-',
      r.supervisor?.full_name || '-',
      r.status,
      r.notes || ''
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Attendance Reports</h1>
          <p className="text-stone-500">Global view and exports of all attendance records.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={reports.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">Sector</label>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">Supervisor</label>
          <select
            value={supervisorFilter}
            onChange={(e) => setSupervisorFilter(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Supervisors</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4">Supervisor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                reports.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-stone-600">
                      {new Date(record.attendance_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{record.employee.full_name}</div>
                      <div className="text-xs font-mono text-emerald-600">{record.employee.employee_code}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {record.employee.sector?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {record.supervisor?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        record.status === 'present' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 italic truncate max-w-[150px]">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
