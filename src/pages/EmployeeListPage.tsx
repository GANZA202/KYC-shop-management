import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Briefcase,
  MapPin,
  RefreshCw
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearch, sectorFilter, typeFilter, page]);

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

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,employee_code.ilike.%${debouncedSearch}%,national_id.ilike.%${debouncedSearch}%`);
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
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-[0.2em]">
            <Users size={14} />
            <span>{t('Staff Management')}</span>
          </div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">{t('Employees')}</h1>
          <p className="text-stone-500 text-base max-w-md">{t('Manage your workforce, track roles, and handle registrations with precision.')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchEmployees()}
            className="p-3 rounded-2xl border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-all active:scale-95"
            title={t('Refresh')}
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          
          {(role === 'admin' || role === 'team_leader') && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all active:scale-95"
            >
              <UserPlus size={20} />
              <span>{t('Add Employee')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview (Quick Glance) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Total Staff')}</p>
            <p className="text-2xl font-black text-stone-900">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Supervisors')}</p>
            <p className="text-2xl font-black text-stone-900">{employees.filter(e => e.worker_type === 'supervisor').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Active Sectors')}</p>
            <p className="text-2xl font-black text-stone-900">{sectors.length}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t('Search name, code, ID...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-2xl border border-stone-100 bg-stone-50/50 pl-12 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sectorFilter}
            onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
            className="rounded-2xl border border-stone-100 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-600 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
          >
            <option value="">{t('All Sectors')}</option>
            {sectors.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-2xl border border-stone-100 bg-stone-50/50 px-4 py-3 text-sm font-medium text-stone-600 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
          >
            <option value="">{t('All Worker Types')}</option>
            <option value="casual">{t('Casual')}</option>
            <option value="supervisor">{t('Supervisor')}</option>
          </select>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-50 text-xs font-bold text-stone-400 uppercase tracking-wider">
            <Filter size={14} />
            <span>{totalCount} {t('Results')}</span>
          </div>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
            <p className="text-stone-500 font-medium">{t('Loading staff data...')}</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 text-stone-500">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-stone-900">{t('No employees found')}</p>
            <p className="text-sm">{t('Try adjusting your search or filters.')}</p>
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 hover:border-emerald-200 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-sm">
                    {emp.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{emp.full_name}</h3>
                    <p className="text-xs font-mono font-bold text-emerald-600">{emp.employee_code}</p>
                  </div>
                </div>
                <span className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                  emp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"
                )}>
                  {t(emp.status === 'active' ? 'Active' : 'Inactive')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-stone-400 uppercase font-bold text-[9px] tracking-widest">{t('National ID')}</p>
                  <p className="text-sm font-medium text-stone-700">{emp.national_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-400 uppercase font-bold text-[9px] tracking-widest">{t('Type')}</p>
                  <p className="text-sm font-medium text-stone-700 capitalize">{t(emp.worker_type)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-400 uppercase font-bold text-[9px] tracking-widest">{t('Daily Rate')}</p>
                  <p className="text-sm font-bold text-stone-900">RWF {emp.daily_rate.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-400 uppercase font-bold text-[9px] tracking-widest">{t('Phone')}</p>
                  <p className="text-sm font-medium text-stone-700">{emp.phone || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <MapPin size={12} />
                  <span>{sectors.find(s => s.id === emp.sector_id)?.name || t('No Sector')}</span>
                </div>
                <button className="p-2 text-stone-400 hover:text-stone-900 rounded-xl hover:bg-stone-50 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-hidden rounded-[32px] border border-stone-100 bg-white shadow-xl shadow-stone-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-stone-50/50 text-stone-400 font-bold text-[11px] uppercase tracking-[0.15em] border-b border-stone-100">
                <th className="px-8 py-5">{t('Staff Member')}</th>
                <th className="px-8 py-5">{t('Identity')}</th>
                <th className="px-8 py-5">{t('Role & Sector')}</th>
                <th className="px-8 py-5">{t('Compensation')}</th>
                <th className="px-8 py-5">{t('Status')}</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600 mb-2" size={32} />
                    <p className="text-stone-400 font-medium">{t('Fetching records...')}</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-stone-400">
                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-bold text-stone-900">{t('No staff records found')}</p>
                    <p>{t('Try clearing your filters or adding a new employee.')}</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-stone-50/50 transition-all cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-sm group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 group-hover:text-emerald-600 transition-colors">{emp.full_name}</div>
                          <div className="text-xs text-stone-400 font-medium">{emp.phone || t('No phone')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-mono font-bold text-emerald-600 mb-1 leading-none">{emp.employee_code}</div>
                      <div className="text-sm text-stone-500 font-medium">{emp.national_id}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "inline-flex w-fit rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                          emp.worker_type === 'supervisor' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {t(emp.worker_type)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                          <MapPin size={12} />
                          <span>{sectors.find(s => s.id === emp.sector_id)?.name || t('No Sector')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-stone-900">RWF {emp.daily_rate.toLocaleString()}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('per day')}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        emp.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", emp.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-stone-300")} />
                        {t(emp.status === 'active' ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-stone-300 hover:text-stone-900 hover:bg-white rounded-xl shadow-sm transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical size={20} />
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
          <div className="flex items-center justify-between border-t border-stone-50 px-8 py-6 bg-stone-50/30">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              {t('Showing')} <span className="text-stone-900">{(page - 1) * ITEMS_PER_PAGE + 1}</span> {t('to')} <span className="text-stone-900">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> {t('of')} <span className="text-stone-900">{totalCount}</span> {t('Records')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                <span>{t('Previous')}</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span>{t('Next')}</span>
                <ChevronRight size={16} />
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
