import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Employee, Sector } from '../types/database';
import { EmployeeForm } from '../components/EmployeeForm';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

export function EmployeeListPage() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchSectors();
    fetchEmployees();
  }, [search, sectorFilter, typeFilter, page]);

  const fetchSectors = async () => {
    const { data } = await supabase.from('sectors').select('*').order('name');
    if (data) setSectors(data);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%,national_id.ilike.%${search}%`);
      }
      if (sectorFilter) {
        query = query.eq('sector_id', sectorFilter);
      }
      if (typeFilter) {
        query = query.eq('worker_type', typeFilter);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setEmployees(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('Employees')}</h1>
          <p className="text-stone-500 text-sm">{t('Manage your shop staff and worker details.')}</p>
        </div>
        {(role === 'admin' || role === 'team_leader') && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <UserPlus size={18} />
            <span>{t('Add Employee')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder={t('Search name, code, ID...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white"
        >
          <option value="">{t('All Sectors')}</option>
          {sectors.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white"
        >
          <option value="">{t('All Worker Types')}</option>
          <option value="casual">{t('Casual')}</option>
          <option value="supervisor">{t('Supervisor')}</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Filter size={16} />
          <span>{totalCount} {t('employees found')}</span>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500">
            {t('No employees found.')}
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-stone-900">{emp.full_name}</h3>
                  <p className="text-xs font-mono text-emerald-600">{emp.employee_code}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  emp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"
                )}>
                  {t(emp.status === 'active' ? 'Active' : 'Inactive')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">{t('National ID')}</p>
                  <p className="text-stone-700">{emp.national_id}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">{t('Type')}</p>
                  <p className="text-stone-700 capitalize">{t(emp.worker_type)}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">{t('Daily Rate')}</p>
                  <p className="text-stone-700">RWF {emp.daily_rate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">{t('Phone')}</p>
                  <p className="text-stone-700">{emp.phone || '-'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end">
                <button className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">{t('Code')}</th>
                <th className="px-6 py-4">{t('Full Name')}</th>
                <th className="px-6 py-4">{t('National ID')}</th>
                <th className="px-6 py-4">{t('Worker Type')}</th>
                <th className="px-6 py-4">{t('Daily Rate')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    {t('No employees found.')}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">
                      {emp.employee_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{emp.full_name}</div>
                      <div className="text-xs text-stone-500">{emp.phone || t('No phone')}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{emp.national_id}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
                        emp.worker_type === 'supervisor' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {t(emp.worker_type.charAt(0).toUpperCase() + emp.worker_type.slice(1))}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-900">
                      RWF {emp.daily_rate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                        emp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", emp.status === 'active' ? "bg-emerald-600" : "bg-stone-400")} />
                        {t(emp.status === 'active' ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-stone-400 hover:text-stone-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
            <p className="text-sm text-stone-500">
              {t('Showing')} <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span> {t('to')} <span className="font-medium">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> {t('of')} <span className="font-medium">{totalCount}</span> {t('results')}
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

      {showForm && (
        <EmployeeForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            fetchEmployees();
            setShowForm(false);
          }} 
        />
      )}
    </div>
  );
}
