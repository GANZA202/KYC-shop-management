import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { creditService } from '../../services/creditService';
import { Employee, CreditRequest } from '../../types/database';
import { 
  Search, 
  User, 
  History,
  ChevronRight,
  ChevronDown,
  Calendar,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function WorkerDebtHistory() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [history, setHistory] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadEmployees();
    }
  }, [profile]);

  const loadEmployees = async () => {
    try {
      const data = await creditService.getEmployeesForSupervisor(profile!.id);
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployeeId(data[0].id);
        loadHistory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (empId: string) => {
    setLoading(true);
    try {
      const data = await creditService.getWorkerDebtHistory(empId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load debt history');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEmployeeId(id);
    loadHistory(id);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalOutstanding = history
    .filter(req => req.status === 'approved')
    .reduce((sum, req) => sum + req.total_amount, 0);

  const totalDeducted = history
    .filter(req => req.status === 'deducted')
    .reduce((sum, req) => sum + req.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Worker Debt History</h1>
          <p className="text-stone-500">View detailed credit and debt history for your team members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <label className="block text-sm font-medium text-stone-700 mb-2">Select Employee</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <select
                value={selectedEmployeeId}
                onChange={handleEmployeeChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-600">Outstanding Debt</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Total Deducted</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalDeducted)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
              <History size={18} className="text-stone-400" />
              <h3 className="font-bold text-stone-900">Request History</h3>
            </div>

            <div className="divide-y divide-stone-100">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center text-stone-400">
                  No history found for this employee.
                </div>
              ) : (
                history.map((req) => (
                  <div key={req.id} className="group">
                    <div 
                      onClick={() => toggleExpand(req.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                          req.status === 'deducted' ? 'bg-blue-100 text-blue-600' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{req.request_number}</p>
                          <p className="text-xs text-stone-500">{formatDate(req.request_date)} • {req.status.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-stone-900">{formatCurrency(req.total_amount)}</p>
                        {expandedId === req.id ? <ChevronDown size={20} className="text-stone-400" /> : <ChevronRight size={20} className="text-stone-400" />}
                      </div>
                    </div>

                    {expandedId === req.id && (
                      <div className="px-4 pb-4 bg-stone-50 border-t border-stone-100">
                        <div className="mt-4 space-y-3">
                          <p className="text-[10px] uppercase font-bold text-stone-400">Items</p>
                          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-stone-50 border-b border-stone-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">Product</th>
                                  <th className="px-3 py-2 text-center">Qty</th>
                                  <th className="px-3 py-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-50">
                                {req.items?.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2 text-stone-700">{item.product?.product_name}</td>
                                    <td className="px-3 py-2 text-center text-stone-700">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right font-medium text-stone-900">{formatCurrency(item.line_total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {req.rejection_reason && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                              <p className="text-[10px] uppercase font-bold text-red-600">Rejection Reason</p>
                              <p className="text-xs text-red-700">{req.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
