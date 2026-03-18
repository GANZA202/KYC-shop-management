import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Employee } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

export function MyWorkersPage() {
  const { profile } = useAuth();
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (profile?.id) {
      fetchWorkers();
    }
  }, [profile?.id]);

  const fetchWorkers = async () => {
    setLoading(true);
    const { data, error } = await attendanceService.getAssignedEmployees(profile!.id);
    if (error) console.error(error);
    else setWorkers(data || []);
    setLoading(false);
  };

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.full_name.toLowerCase().includes(search.toLowerCase()) ||
                         w.employee_code.toLowerCase().includes(search.toLowerCase()) ||
                         w.national_id.includes(search);
    const matchesType = typeFilter === '' || w.worker_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCount = filteredWorkers.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedWorkers = filteredWorkers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">My Workers</h1>
        <p className="text-stone-500">List of employees assigned to you for daily management.</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search name, code, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Worker Types</option>
          <option value="casual">Casual</option>
          <option value="supervisor">Supervisor</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Filter size={16} />
          <span>{totalCount} workers assigned</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">National ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : paginatedWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No workers found.
                  </td>
                </tr>
              ) : (
                paginatedWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">
                      {worker.employee_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                          <User size={16} />
                        </div>
                        <span className="font-medium text-stone-900">{worker.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{worker.national_id}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
                        worker.worker_type === 'supervisor' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {worker.worker_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500">{worker.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {worker.status}
                      </span>
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
