import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollService } from '../../services/payrollService';
import { Payroll, PayrollPeriod } from '../../types/database';
import { 
  ArrowLeft, 
  Download, 
  Building2,
  Users,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function BankTransferSummary() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (periodId) {
      loadData();
    }
  }, [periodId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollData, periodsData] = await Promise.all([
        payrollService.getPayrolls(periodId!),
        payrollService.getPeriods()
      ]);
      setPayrolls(payrollData.filter(p => p.net_salary > 0));
      setPeriod(periodsData.find(p => p.id === periodId) || null);
    } catch (error) {
      console.error('Error loading bank transfer data:', error);
      toast.error('Failed to load bank transfer summary');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalNet: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
    employeeCount: payrolls.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/payroll/list/${periodId}`)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-stone-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Bank Transfer Summary</h1>
            <p className="text-stone-500">{period?.name} Cycle</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
          <Download size={18} />
          Export Bank File
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-400">Total Transfer Amount</p>
            <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalNet)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <Users className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-stone-400">Total Recipients</p>
            <p className="text-2xl font-bold text-stone-900">{stats.employeeCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Employee Name</th>
              <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Account Number</th>
              <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-stone-400">
                  No bank transfers required for this period.
                </td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-stone-900">{p.employee?.full_name}</td>
                  <td className="px-6 py-4 text-stone-600 font-mono">{p.employee?.bank_account || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(p.net_salary)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
