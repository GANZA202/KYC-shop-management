import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/reportService';
import { DebtReportRow, Sector, Profile } from '../../types/database';
import { 
  Search, 
  Filter, 
  Download, 
  Printer,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency, formatDate, exportToCSV } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export function DebtReports() {
  const { role } = useAuth();
  const [data, setData] = useState<DebtReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    sector_id: '',
    supervisor_id: '',
    status: '',
    worker_type: ''
  });

  useEffect(() => {
    loadMetadata();
    loadData();
  }, [filters]);

  const loadMetadata = async () => {
    try {
      const [secData, supData] = await Promise.all([
        supabase.from('sectors').select('*'),
        supabase.from('profiles').select('*').eq('role', 'supervisor')
      ]);
      setSectors(secData.data || []);
      setSupervisors(supData.data || []);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const reportData = await reportService.getDebtReport(filters);
      setData(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load debt report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportToCSV(data, `Debt_Report_${filters.month}`);
    toast.success('Report exported to CSV');
  };

  const stats = {
    totalDebt: data.reduce((sum, row) => sum + (row.status !== 'rejected' ? row.total_amount : 0), 0),
    pending: data.filter(row => row.status === 'pending').length,
    approved: data.filter(row => row.status === 'approved').length,
    deducted: data.filter(row => row.status === 'deducted').length,
    rejected: data.filter(row => row.status === 'rejected').length,
    avgDebt: data.length > 0 ? data.reduce((sum, row) => sum + row.total_amount, 0) / data.length : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Debt & Credit Reports</h1>
          <p className="text-stone-500">Comprehensive view of all worker debts and credit history.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <Printer size={18} />
            Print
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Total Debt</span>
            <TrendingDown className="text-red-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalDebt)}</p>
          <p className="text-xs text-stone-500 mt-1">For selected period</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Pending</span>
            <Clock className="text-amber-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.pending}</p>
          <p className="text-xs text-stone-500 mt-1">Awaiting approval</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Approved</span>
            <CheckCircle2 className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.approved}</p>
          <p className="text-xs text-stone-500 mt-1">Ready for deduction</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Deducted</span>
            <CreditCard className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.deducted}</p>
          <p className="text-xs text-stone-500 mt-1">Processed in payroll</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Month</label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="w-full rounded-lg border-stone-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Sector</label>
          <select
            value={filters.sector_id}
            onChange={(e) => setFilters({ ...filters, sector_id: e.target.value })}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Supervisor</label>
          <select
            value={filters.supervisor_id}
            onChange={(e) => setFilters({ ...filters, supervisor_id: e.target.value })}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            <option value="">All Supervisors</option>
            {supervisors.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="deducted">Deducted</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Worker Type</label>
          <select
            value={filters.worker_type}
            onChange={(e) => setFilters({ ...filters, worker_type: e.target.value })}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            <option value="">All Types</option>
            <option value="casual">Casual</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Request Info</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Sector / Supervisor</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No data found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.request_id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{row.employee_name}</span>
                        <span className="text-xs text-stone-500">{row.employee_code} | {row.worker_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-900">{row.request_number}</span>
                        <span className="text-xs text-stone-500">{formatDate(row.request_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-900">{row.sector_name}</span>
                        <span className="text-xs text-stone-500">Sup: {row.supervisor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{formatCurrency(row.total_amount)}</span>
                        <span className="text-[10px] text-stone-400">Limit: {formatCurrency(row.credit_limit)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        row.status === 'deducted' ? 'bg-blue-100 text-blue-700' :
                        row.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {row.status}
                      </span>
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
