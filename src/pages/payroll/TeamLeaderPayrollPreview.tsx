import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { Payroll, PayrollPeriod, Sector } from '../../types/database';
import { 
  Users, 
  TrendingDown,
  Calendar,
  Search
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export function TeamLeaderPayrollPreview() {
  const { profile } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [sector, setSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.sector_id) {
      loadInitialData();
    }
  }, [profile]);

  const loadInitialData = async () => {
    try {
      const [periodsData, sectorData] = await Promise.all([
        payrollService.getPeriods(),
        supabase.from('sectors').select('*').eq('id', profile!.sector_id).single()
      ]);
      setPeriods(periodsData);
      setSector(sectorData.data);
      if (periodsData.length > 0) {
        setSelectedPeriodId(periodsData[0].id);
        loadPayrolls(periodsData[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPayrolls = async (periodId: string) => {
    setLoading(true);
    try {
      const data = await payrollService.getPayrolls(periodId, { sector_id: profile!.sector_id });
      setPayrolls(data);
    } catch (error) {
      console.error('Error loading payrolls:', error);
      toast.error('Failed to load payroll preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPeriodId(id);
    loadPayrolls(id);
  };

  const filteredPayrolls = payrolls.filter(p => 
    p.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employee?.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalNet: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.total_deductions, 0),
    employeeCount: payrolls.length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Sector Payroll Preview</h1>
          <p className="text-stone-500">Monthly payroll summary for {sector?.name || 'your sector'}.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriodId}
            onChange={handlePeriodChange}
            className="rounded-lg border-stone-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Sector Net Total</p>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalNet)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Debt Deductions</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Workers</p>
          <p className="text-2xl font-bold text-stone-900">{stats.employeeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search by worker name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-stone-300 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Worker</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Gross</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Deductions</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                    No payroll data for this period.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{p.employee?.full_name}</span>
                        <span className="text-xs text-stone-500">{p.employee?.employee_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-medium">{formatCurrency(p.gross_salary)}</td>
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
