import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { Payroll, PayrollPeriod, Sector } from '../../types/database';
import { 
  BarChart3, 
  Download, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export function AccountantNetSalaryReports() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [periodsData, sectorsData] = await Promise.all([
        payrollService.getPeriods(),
        supabase.from('sectors').select('*')
      ]);
      setPeriods(periodsData);
      setSectors(sectorsData.data || []);
      if (periodsData.length > 0) {
        setSelectedPeriodId(periodsData[0].id);
        loadPayrolls(periodsData[0].id, '');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPayrolls = async (periodId: string, sectorId: string) => {
    setLoading(true);
    try {
      const data = await payrollService.getPayrolls(periodId, { sector_id: sectorId });
      setPayrolls(data);
    } catch (error) {
      console.error('Error loading payrolls:', error);
      toast.error('Failed to load net salary report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (selectedPeriodId) {
      loadPayrolls(selectedPeriodId, selectedSectorId);
    }
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedPeriodId, selectedSectorId]);

  const stats = {
    totalNet: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
    totalGross: payrolls.reduce((sum, p) => sum + p.gross_salary, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.total_deductions, 0),
    avgNet: payrolls.length > 0 ? payrolls.reduce((sum, p) => sum + p.net_salary, 0) / payrolls.length : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Net Salary Reports</h1>
          <p className="text-stone-500">Detailed analysis of net payments and deductions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Payroll Period</label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Sector</label>
          <select
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            className="w-full rounded-lg border-stone-300 text-sm"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Net Pay</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalNet)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Avg Net Pay</p>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.avgNet)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Deduction %</p>
          <p className="text-2xl font-bold text-stone-900">
            {stats.totalGross > 0 ? ((stats.totalDeductions / stats.totalGross) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Sector</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Gross</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Deductions</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Net Pay</th>
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
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-900">{p.employee?.full_name}</td>
                    <td className="px-6 py-4 text-stone-600">{p.sector?.name}</td>
                    <td className="px-6 py-4 text-stone-600">{formatCurrency(p.gross_salary)}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatCurrency(p.total_deductions)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">{formatCurrency(p.net_salary)}</td>
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
