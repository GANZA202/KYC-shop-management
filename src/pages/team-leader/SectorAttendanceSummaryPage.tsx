import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function SectorAttendanceSummaryPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Date range (default current month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    if (profile?.sector_id) {
      fetchSummary();
    }
  }, [profile?.sector_id, startDate, endDate]);

  const fetchSummary = async () => {
    setLoading(true);
    const { data, error } = await attendanceService.getSectorAttendanceSummary(
      profile!.sector_id!,
      startDate,
      endDate
    );
    if (error) console.error(error);
    else setSummary(data || []);
    setLoading(false);
  };

  const filteredSummary = summary.filter(item => 
    item.employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
    item.employee.national_id.includes(search)
  );

  // Totals
  const totalWorkers = summary.length;
  const totalPresent = summary.reduce((acc, curr) => acc + curr.presentDays, 0);
  const totalAbsent = summary.reduce((acc, curr) => acc + curr.absentDays, 0);
  const totalPossible = totalPresent + totalAbsent;
  const attendanceRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Sector Attendance Summary</h1>
          <p className="text-stone-500">Overview of attendance performance for your assigned sector.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-2 shadow-sm">
          <Calendar size={18} className="text-stone-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-medium focus:outline-none"
          />
          <span className="text-stone-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Total Workers</p>
              <p className="text-2xl font-bold text-stone-900">{totalWorkers}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Days Present</p>
              <p className="text-2xl font-bold text-stone-900">{totalPresent}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Days Absent</p>
              <p className="text-2xl font-bold text-stone-900">{totalAbsent}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-stone-900">{attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Search worker name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">National ID</th>
                <th className="px-6 py-4 text-center">Present</th>
                <th className="px-6 py-4 text-center">Absent</th>
                <th className="px-6 py-4 text-center">Rate</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No attendance data for this period.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((item) => {
                  const rate = (item.presentDays / item.totalDays) * 100;
                  return (
                    <tr key={item.employee.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-stone-900">{item.employee.full_name}</div>
                        <div className="text-xs font-mono text-emerald-600">{item.employee.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{item.employee.national_id}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.presentDays}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600">{item.absentDays}</td>
                      <td className="px-6 py-4 text-center font-bold text-stone-900">{rate.toFixed(0)}%</td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              rate > 80 ? "bg-emerald-500" : rate > 50 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
