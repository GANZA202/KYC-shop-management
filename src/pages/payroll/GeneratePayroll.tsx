import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollService } from '../../services/payrollService';
import { PayrollPeriod } from '../../types/database';
import { 
  Play, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Settings,
  Calculator
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function GeneratePayroll() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPeriod();
  }, [periodId]);

  const loadPeriod = async () => {
    try {
      const data = await payrollService.getPeriods();
      const found = data.find(p => p.id === periodId);
      if (found) setPeriod(found);
    } catch (error) {
      console.error('Error loading period:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!periodId) return;
    
    setProcessing(true);
    try {
      await payrollService.generatePayroll(periodId);
      toast.success('Payroll generated successfully');
      navigate(`/payroll/list/${periodId}`);
    } catch (error: any) {
      console.error('Error generating payroll:', error);
      toast.error(error.message || 'Failed to generate payroll');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!period) return (
    <div className="p-12 text-center">
      <p className="text-stone-500">Payroll period not found.</p>
      <button onClick={() => navigate('/payroll/periods')} className="mt-4 text-emerald-600 font-bold">Back to Periods</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <button 
        onClick={() => navigate('/payroll/periods')}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Periods
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Calculator className="text-emerald-600" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Generate Payroll</h1>
              <p className="text-stone-500">{period.name} Cycle</p>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Start Date:</span>
              <span className="font-bold text-stone-900">{formatDate(period.start_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">End Date:</span>
              <span className="font-bold text-stone-900">{formatDate(period.end_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Status:</span>
              <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px]">{period.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Settings size={18} className="text-stone-400" />
              Processing Rules
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-stone-600">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                Calculate gross salary based on employee worker type and base salary.
              </li>
              <li className="flex items-start gap-3 text-sm text-stone-600">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                Identify and link all approved credit requests within the period.
              </li>
              <li className="flex items-start gap-3 text-sm text-stone-600">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                Deduct debt amounts from gross salary to arrive at net salary.
              </li>
              <li className="flex items-start gap-3 text-sm text-stone-600">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                If debt exceeds salary, net salary will be 0 and remaining debt carried forward.
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              disabled={processing}
              onClick={handleGenerate}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {processing ? (
                <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Play size={20} />
                  Start Payroll Generation
                </>
              )}
            </button>
            <p className="text-center text-xs text-stone-400 mt-4">
              This process may take a few moments depending on the number of employees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
