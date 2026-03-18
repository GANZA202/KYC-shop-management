import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Save,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Employee, Attendance } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function DailyAttendancePage() {
  const { profile } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: 'present' | 'absent', notes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id, date]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const [workersRes, attendanceRes] = await Promise.all([
        attendanceService.getAssignedEmployees(profile!.id),
        attendanceService.getAttendanceForDate(date, profile!.id)
      ]);

      if (workersRes.error) throw workersRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setWorkers(workersRes.data || []);
      
      const attendanceMap: Record<string, { status: 'present' | 'absent', notes: string }> = {};
      
      // Initialize with existing attendance if any
      attendanceRes.data?.forEach(record => {
        attendanceMap[record.employee_id] = {
          status: record.status,
          notes: record.notes || ''
        };
      });

      // For workers without records, default to present
      workersRes.data?.forEach(worker => {
        if (!attendanceMap[worker.id]) {
          attendanceMap[worker.id] = { status: 'present', notes: '' };
        }
      });

      setAttendance(attendanceMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], status }
    }));
  };

  const handleNotesChange = (employeeId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], notes }
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance = { ...attendance };
    workers.forEach(w => {
      newAttendance[w.id] = { ...newAttendance[w.id], status };
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const records = Object.entries(attendance).map(([employeeId, data]) => ({
        employee_id: employeeId,
        supervisor_id: profile!.id,
        attendance_date: date,
        status: (data as { status: 'present' | 'absent', notes: string }).status,
        notes: (data as { status: 'present' | 'absent', notes: string }).notes || null
      }));

      const { error } = await attendanceService.submitAttendance(records);
      if (error) throw error;

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Daily Attendance</h1>
          <p className="text-stone-500">Mark present or absent for your assigned workers.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
          <CalendarIcon size={18} className="text-stone-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm font-medium text-stone-900 focus:outline-none"
          />
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-700 border border-emerald-100">
          <CheckCircle2 size={20} />
          <span>Attendance for {date} has been saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-100">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500">
            No workers assigned to you.
          </div>
        ) : (
          workers.map((worker) => (
            <div key={worker.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-stone-900">{worker.full_name}</h3>
                  <p className="text-xs font-mono text-emerald-600">{worker.employee_code}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  worker.worker_type === 'supervisor' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                )}>
                  {worker.worker_type}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(worker.id, 'present')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all",
                    attendance[worker.id]?.status === 'present'
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                  )}
                >
                  <Check size={14} />
                  Present
                </button>
                <button
                  onClick={() => handleStatusChange(worker.id, 'absent')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all",
                    attendance[worker.id]?.status === 'absent'
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                  )}
                >
                  <X size={14} />
                  Absent
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400">Notes</label>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={attendance[worker.id]?.notes || ''}
                  onChange={(e) => handleNotesChange(worker.id, e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-stone-50 px-6 py-4 border-b border-stone-200">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Worker List</h3>
          <div className="flex gap-2">
            <button
              onClick={() => markAll('present')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <Check size={14} />
              Mark All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors"
            >
              <X size={14} />
              Mark All Absent
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                    No workers assigned to you.
                  </td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{worker.full_name}</div>
                      <div className="text-xs font-mono text-emerald-600">{worker.employee_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        worker.worker_type === 'supervisor' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {worker.worker_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStatusChange(worker.id, 'present')}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                            attendance[worker.id]?.status === 'present'
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                          )}
                        >
                          <Check size={14} />
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(worker.id, 'absent')}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                            attendance[worker.id]?.status === 'absent'
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                          )}
                        >
                          <X size={14} />
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Add note..."
                        value={attendance[worker.id]?.notes || ''}
                        onChange={(e) => handleNotesChange(worker.id, e.target.value)}
                        className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || workers.length === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-all"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                <Save size={18} />
                <span>Submit Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
