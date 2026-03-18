import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { PayrollPeriod } from '../../types/database';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Play,
  FileText
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export function PayrollPeriods() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const data = await payrollService.getPeriods();
      setPeriods(data);
    } catch (error) {
      console.error('Error loading periods:', error);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollService.createPeriod(newPeriod);
      toast.success('Payroll period created');
      setShowCreateModal(false);
      loadPeriods();
    } catch (error) {
      console.error('Error creating period:', error);
      toast.error('Failed to create payroll period');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Payroll Periods</h1>
          <p className="text-stone-500">Manage monthly payroll cycles and processing.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          New Period
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <div className="flex justify-center">
              <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : periods.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 bg-white rounded-xl border border-dashed border-stone-300">
            No payroll periods found. Create one to get started.
          </div>
        ) : (
          periods.map((period) => (
            <div key={period.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <Calendar className="text-stone-400" size={24} />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    period.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                    period.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {period.status}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{period.name}</h3>
                  <p className="text-sm text-stone-500">
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-stone-400">Status</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-stone-700">
                      {period.status === 'open' ? <Clock size={14} className="text-emerald-500" /> : <CheckCircle2 size={14} className="text-stone-400" />}
                      {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
                {period.status === 'open' && (
                  <Link 
                    to={`/payroll/generate/${period.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Play size={16} />
                    Generate
                  </Link>
                )}
                <Link 
                  to={`/payroll/list/${period.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-stone-200 bg-white text-stone-600 text-sm font-bold rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <FileText size={16} />
                  View Results
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-900">Create Payroll Period</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., March 2026"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  className="w-full rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newPeriod.start_date}
                    onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                    className="w-full rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newPeriod.end_date}
                    onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                    className="w-full rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-stone-200 text-stone-600 font-bold rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
