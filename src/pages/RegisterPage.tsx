import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('admin'); // Default to admin for the first user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(0);
        if (error && error.code === 'PGRST301') {
          setConnectionStatus('online');
        } else if (error) {
          setConnectionStatus('online');
        } else {
          setConnectionStatus('online');
        }
      } catch (err) {
        setConnectionStatus('offline');
      }
    };
    checkConnection();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Attempting registration for:', email);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Registration timed out. Please check your internet connection and Supabase settings.')), 30000)
    );

    try {
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

      if (error) throw error;
      
      console.log('Registration successful:', data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            KYC Shop Management System
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
          <div className="mb-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold">
            <span className="text-stone-400">Database Status:</span>
            {connectionStatus === 'checking' && <span className="text-amber-500 animate-pulse">Checking...</span>}
            {connectionStatus === 'online' && <span className="text-emerald-500">Connected</span>}
            {connectionStatus === 'offline' && <span className="text-red-500">Disconnected</span>}
          </div>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-medium text-stone-900">Registration Successful!</h3>
              <p className="text-sm text-stone-500">
                Your account has been created. Please check your email for a confirmation link (if enabled in Supabase). Redirecting to login...
              </p>
              <div className="pt-4">
                <Link to="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Click here if not redirected
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-stone-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-stone-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-stone-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-stone-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-stone-700">
                  Initial Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-stone-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="accountant">Accountant</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="supervisor">Supervisor</option>
                </select>
                <p className="mt-1 text-[10px] text-stone-500">
                  * Note: In a real system, roles are assigned by an admin. This is for initial setup.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus size={18} />
                      <span>Create Account</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 text-sm">
                  Already have an account? Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
