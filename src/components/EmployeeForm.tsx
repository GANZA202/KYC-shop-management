import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sector, Profile } from '../types/database';

interface EmployeeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeForm({ onClose, onSuccess }: EmployeeFormProps) {
  const { profile, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [supervisors, setSupervisors] = useState<Profile[]>([]);

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
            throw new Error('An employee with this National ID already exists.');
          }
        }
        throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while registering the employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-xl font-bold text-stone-900">Register New Employee</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Full Name</label>
              <input
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">National ID</label>
              <input
                required
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="16-digit ID number"
                pattern="^\d{16}$"
                title="National ID must be 16 digits"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="07XXXXXXXX"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Worker Type</label>
              <select
                name="worker_type"
                value={formData.worker_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="casual">Casual (2,000 RWF/day)</option>
                <option value="supervisor">Supervisor (4,000 RWF/day)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Sector</label>
              <select
                required
                name="sector_id"
                value={formData.sector_id}
                onChange={handleChange}
                disabled={role === 'team_leader'}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none disabled:bg-stone-50"
              >
                <option value="">Select Sector</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Assigned Supervisor</label>
              <select
                name="supervisor_id"
                value={formData.supervisor_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Supervisor</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Bank Name</label>
              <input
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="e.g., BK, BPR, MoMo"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Bank Account / Phone</label>
              <input
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="Account number or phone"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
