import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollService } from '../../services/payrollService';
import { Payroll, PayrollPeriod } from '../../types/database';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Lock,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function PayrollList() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      setPayrolls(payrollData);
      setPeriod(periodsData.find(p => p.id === periodId) || null);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('Failed to load payroll results');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize this payroll? This will lock the period and mark all debts as deducted.')) return;
    
    setFinalizing(true);
    try {
      await payrollService.finalizePayroll(periodId!);
      toast.success('Payroll finalized successfully');
      loadData();
    } catch (error: any) {
      console.error('Error finalizing payroll:', error);
      toast.error(error.message || 'Failed to finalize payroll');
    } finally {
      setFinalizing(false);
    }
  };

  const filteredPayrolls = payrolls.filter(p => 
    p.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employee?.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalGross: payrolls.reduce((sum, p) => sum + p.gross_salary, 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + p.total_deductions, 0),
    totalNet: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
    employeeCount: payrolls.length
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/payroll/periods')} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-stone-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Payroll Results</h1>
            <p className="text-stone-500">{period?.name} Cycle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {period?.status === 'processing' && (
            <button 
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              {finalizing ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock size={18} />
                  Finalize Payroll
                </>
              )}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors">
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => navigate(`/payroll/bank-transfer/${periodId}`)}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <Building2 size={18} />
            Bank Transfer
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Gross</p>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalGross)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Total Net Pay</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalNet)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Employees</p>
          <p className="text-2xl font-bold text-stone-900">{stats.employeeCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Gross Salary</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Deductions</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Net Salary</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{p.employee?.full_name}</span>
                        <span className="text-xs text-stone-500">{p.employee?.employee_code} | {p.employee?.worker_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-stone-900">{formatCurrency(p.gross_salary)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600">{formatCurrency(p.total_deductions)}</span>
                        {p.total_deductions > 0 && (
                          <span className="text-[10px] text-stone-400">Debt Deducted</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600">{formatCurrency(p.net_salary)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
                        <FileText size={18} />
                      </button>
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
