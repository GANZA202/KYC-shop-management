import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Loader2,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Attendance } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 15;

export function AttendanceHistoryPage() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (profile?.id) {
      fetchHistory();
    }
  }, [profile?.id, statusFilter, startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await attendanceService.getAttendanceHistory({
      supervisorId: profile!.id,
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
    if (error) console.error(error);
    else setHistory(data || []);
    setLoading(false);
  };

  const filteredHistory = history.filter(record => 
    record.employee?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    record.employee?.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = filteredHistory.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Attendance History</h1>
        <p className="text-stone-500">Review past attendance records for your workers.</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search worker..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-stone-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-stone-400" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">Status</th>
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
              ) : paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-stone-600 font-medium">
                      {new Date(record.attendance_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{record.employee?.full_name}</div>
                      <div className="text-xs font-mono text-emerald-600">{record.employee?.employee_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase",
                        record.status === 'present' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {record.status === 'present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 italic">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
            <p className="text-sm text-stone-500">
              Showing <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
