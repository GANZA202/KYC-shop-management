import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(0);
        if (error && error.code === 'PGRST301') {
          // This is fine, it means the table exists but we might not have access
          setConnectionStatus('online');
        } else if (error) {
          console.warn('Connection check warning:', error);
          setConnectionStatus('online'); // Still online if we got a response
        } else {
          setConnectionStatus('online');
        }
      } catch (err: any) {
        const isNetworkError = err.message?.includes('Failed to fetch') || err.name === 'TypeError';
        console.error('Connection check failed:', isNetworkError ? 'Network error (Failed to fetch)' : err);
        setConnectionStatus('offline');
      }
    };
    checkConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Attempting login for:', email);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timed out. Please check your internet connection and Supabase settings.')), 30000)
    );

    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please confirm your email address before logging in. Check your inbox (and spam folder) for a confirmation link.');
        }
        if (error.message?.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. If you just registered, make sure you confirmed your email or disabled "Confirm Email" in Supabase settings.');
        }
        throw error;
      }
      console.log('Login successful:', data);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-900">
            KYC SHOP
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Management System
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
          <div className="mb-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold">
            <span className="text-stone-400">Database Status:</span>
            {connectionStatus === 'checking' && <span className="text-amber-500 animate-pulse">Checking...</span>}
            {connectionStatus === 'online' && <span className="text-emerald-500">Connected</span>}
            {connectionStatus === 'offline' && <span className="text-red-500">Disconnected</span>}
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" title="Forgot Password" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm">
                <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Create an account
                </Link>
              </div>
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
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
