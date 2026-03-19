import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  Loader2, 
  User, 
  IdCard, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  UserCheck, 
  CreditCard,
  Building2,
  CheckCircle2,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sector, Profile } from '../types/database';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface EmployeeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeForm({ onClose, onSuccess }: EmployeeFormProps) {
  const { t } = useTranslation();
  const { profile, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    email: '',
    phone: '',
    worker_type: 'casual' as 'casual' | 'supervisor',
    sector_id: '',
    supervisor_id: '',
    bank_name: '',
    bank_account: '',
  });

  useEffect(() => {
    fetchSectors();
    fetchSupervisors();
    
    // If team leader, lock to their sector
    if (role === 'team_leader' && profile?.sector_id) {
      setFormData(prev => ({ ...prev, sector_id: profile.sector_id! }));
    }
  }, [role, profile]);

  const fetchSectors = async () => {
    const { data } = await supabase.from('sectors').select('*').order('name');
    if (data) setSectors(data);
  };

  const fetchSupervisors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'supervisor')
      .order('full_name');
    if (data) setSupervisors(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Auto-set salary values
    const daily_rate = formData.worker_type === 'casual' ? 2000 : 4000;
    const monthly_max = formData.worker_type === 'casual' ? 60000 : 120000;

    try {
      const { error: insertError } = await supabase.from('employees').insert([
        {
          ...formData,
          daily_rate,
          monthly_max,
          team_leader_id: role === 'team_leader' ? profile?.id : null,
          email: formData.email || null,
          phone: formData.phone || null,
          supervisor_id: formData.supervisor_id || null,
        },
      ]);

      if (insertError) {
        if (insertError.code === '23505') {
          if (insertError.message.includes('national_id')) {
            throw new Error(t('An employee with this National ID already exists.'));
          }
        }
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('An error occurred while registering the employee.'));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 leading-tight">{t('Register New Employee')}</h2>
              <p className="text-sm text-stone-500">{t('Add a new staff member to the system')}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-full bg-emerald-100 p-8 text-emerald-600 mb-6 shadow-inner">
              <CheckCircle2 size={64} className="animate-bounce" />
            </div>
            <h3 className="text-3xl font-bold text-stone-900">{t('Registration Successful!')}</h3>
            <p className="mt-3 text-lg text-stone-500">{t('The employee has been added to the system.')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in shake duration-300">
                  <AlertCircle size={20} className="shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div className="space-y-12 pb-8">
                {/* Personal Information */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                      <User size={18} />
                    </div>
                    <h3 className="text-base font-bold text-stone-900">{t('Personal Information')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Full Name')} <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          required
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder={t('e.g. John Doe')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('National ID')} <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          required
                          name="national_id"
                          value={formData.national_id}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder={t('16-digit ID number')}
                          pattern="^\d{16}$"
                          title={t('National ID must be 16 digits')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Email Address')}
                      </label>
                      <div className="group relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Phone Number')}
                      </label>
                      <div className="group relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder="07XXXXXXXX"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Job Assignment */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                      <Briefcase size={18} />
                    </div>
                    <h3 className="text-base font-bold text-stone-900">{t('Job Assignment')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Worker Type')} <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                        <select
                          name="worker_type"
                          value={formData.worker_type}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-10 py-3.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="casual">{t('Casual (2,000 RWF/day)')}</option>
                          <option value="supervisor">{t('Supervisor (4,000 RWF/day)')}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Sector')} <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                        <select
                          required
                          name="sector_id"
                          value={formData.sector_id}
                          onChange={handleChange}
                          disabled={role === 'team_leader'}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-10 py-3.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">{t('Select Sector')}</option>
                          {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Assigned Supervisor')}
                      </label>
                      <div className="group relative">
                        <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                        <select
                          name="supervisor_id"
                          value={formData.supervisor_id}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-10 py-3.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">{t('Select Supervisor (Optional)')}</option>
                          {supervisors.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment Information */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="text-base font-bold text-stone-900">{t('Payment Information')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Bank Name / Provider')}
                      </label>
                      <div className="group relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          name="bank_name"
                          value={formData.bank_name}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder={t('e.g. BK, BPR, MoMo')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                        {t('Account Number / Phone')}
                      </label>
                      <div className="group relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                          name="bank_account"
                          value={formData.bank_account}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/30 pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:outline-none transition-all shadow-sm"
                          placeholder={t('Account or phone number')}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 border-t border-stone-100 bg-white px-6 py-6 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-stone-200 bg-white px-8 py-3.5 text-sm font-bold text-stone-600 transition-all hover:bg-stone-50 hover:border-stone-300 active:scale-95"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 min-w-[180px] rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t('Registering...')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>{t('Register Employee')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
