import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/reportService';
import { DebtReportRow } from '../../types/database';
import { 
  TrendingDown,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

export function SupervisorDebtSummary() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [data, setData] = useState<DebtReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    employee_name: '',
    employee_code: '',
    month: new Date().toISOString().slice(0, 7),
    status: ''
  });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const reportData = await reportService.getDebtReport({
        ...filters,
        supervisor_id: profile!.id
      });
      setData(reportData);
    } catch (error) {
      console.error('Error loading supervisor report:', error);
      toast.error(t('Failed to load supervisor debt summary'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      employee_name: '',
      employee_code: '',
      month: new Date().toISOString().slice(0, 7),
      status: ''
    });
  };

  const stats = {
    totalDebt: data.reduce((sum, row) => sum + (row.status !== 'rejected' ? row.total_amount : 0), 0),
    pendingAmount: data.filter(row => row.status === 'pending').reduce((sum, row) => sum + row.total_amount, 0),
    approvedAmount: data.filter(row => row.status === 'approved').reduce((sum, row) => sum + row.total_amount, 0),
    deductedAmount: data.filter(row => row.status === 'deducted').reduce((sum, row) => sum + row.total_amount, 0)
  };

  // Chart data
  const statusData = [
    { name: t('Pending'), value: data.filter(r => r.status === 'pending').length, color: '#f59e0b' },
    { name: t('Approved'), value: data.filter(r => r.status === 'approved').length, color: '#10b981' },
    { name: t('Deducted'), value: data.filter(r => r.status === 'deducted').length, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('My Team Debt')}</h1>
          <p className="text-stone-500">{t('Overview of debt for your assigned workers.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium",
              showFilters ? "bg-stone-100 border-stone-300 text-stone-900" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            )}
          >
            <Filter size={18} />
            {t('Filters')}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Search size={18} />
            {t('Search')}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t('Employee Name')}</label>
              <input
                type="text"
                name="employee_name"
                value={filters.employee_name}
                onChange={handleFilterChange}
                placeholder={t('Search by name')}
                className="w-full rounded-lg border-stone-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t('Employee Code')}</label>
              <input
                type="text"
                name="employee_code"
                value={filters.employee_code}
                onChange={handleFilterChange}
                placeholder={t('Search by code')}
                className="w-full rounded-lg border-stone-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t('Month')}</label>
              <input
                type="month"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full rounded-lg border-stone-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t('Status')}</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-lg border-stone-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">{t('All')}</option>
                <option value="pending">{t('Pending')}</option>
                <option value="approved">{t('Approved')}</option>
                <option value="deducted">{t('Deducted')}</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              {t('Clear')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Total Debt')}</span>
            <TrendingDown className="text-red-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalDebt)}</p>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Pending')}</span>
            <Clock className="text-amber-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.pendingAmount)}</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Approved')}</span>
            <CheckCircle2 className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.approvedAmount)}</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Deducted')}</span>
            <CreditCard className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.deductedAmount)}</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-bold text-stone-900 mb-6 uppercase tracking-widest">{t('Debt by Status')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm h-[400px] flex items-center justify-center">
          <p className="text-stone-400 italic text-sm">{t('More team analytics coming soon')}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 uppercase tracking-widest text-xs">{t('My Team Debt List')}</h3>
          <button className="text-stone-400 hover:text-stone-600 transition-colors">
            <Download size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Request Number')}</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Employee Name')}</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Request Date')}</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Total Debt Amount')}</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Status')}</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t('Deduction Month')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-stone-400 font-medium">{t('Loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic text-sm">
                    {t('No records found')}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.request_id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-stone-600">{row.request_number}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{row.employee_name}</span>
                        <span className="text-[10px] text-stone-500 uppercase tracking-tighter">{row.employee_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-600">{formatDate(row.request_date)}</td>
                    <td className="px-6 py-4 font-bold text-stone-900">{formatCurrency(row.total_amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        row.status === 'deducted' ? 'bg-blue-100 text-blue-700' :
                        row.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {t(row.status.charAt(0).toUpperCase() + row.status.slice(1))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-600">{row.deduction_month || '-'}</td>
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
