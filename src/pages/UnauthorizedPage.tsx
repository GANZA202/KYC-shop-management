import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <div className="rounded-full bg-red-100 p-4 text-red-600">
        <ShieldAlert size={48} />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-stone-900">Access Denied</h1>
      <p className="mt-2 text-stone-600">
        You don't have permission to view this page.
      </p>
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <Home size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}
