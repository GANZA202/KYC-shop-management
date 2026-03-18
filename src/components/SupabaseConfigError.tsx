import React from 'react';
import { AlertCircle, ExternalLink, Key } from 'lucide-react';

export function SupabaseConfigError() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Configuration Required</h2>
            <p className="text-sm text-amber-700">Supabase is not connected</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-stone-600 text-sm leading-relaxed">
            To use the <strong>KYC Shop Management System</strong>, you need to connect your Supabase project. Please add the following environment variables to the <strong>Secrets</strong> panel in AI Studio:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
              <Key size={16} className="text-stone-400" />
              <code className="text-xs font-mono text-emerald-600 font-bold">VITE_SUPABASE_URL</code>
            </div>
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
              <Key size={16} className="text-stone-400" />
              <code className="text-xs font-mono text-emerald-600 font-bold">VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>

          <div className="bg-stone-900 rounded-xl p-4 text-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Where to find these?</h3>
            <p className="text-xs text-stone-300">
              Go to your <strong>Supabase Dashboard</strong> &rarr; <strong>Project Settings</strong> &rarr; <strong>API</strong>.
            </p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Open Supabase Dashboard <ExternalLink size={12} />
            </a>
          </div>

          <div className="pt-2">
            <p className="text-[10px] text-stone-400 text-center">
              After adding the secrets, please refresh the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
