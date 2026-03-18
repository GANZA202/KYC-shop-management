import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/database';

import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { user, profile, loading, role, connectionIssue, tableMissing, signOut } = useAuth();
  const location = useLocation();

  if (tableMissing) {
    const [sqlContent, setSqlContent] = React.useState<string>('');
    const [showManualGuide, setShowManualGuide] = React.useState(false);
    const [showUploadGuide, setShowUploadGuide] = React.useState(false);

    React.useEffect(() => {
      fetch('/supabase_schema.sql')
        .then(res => res.text())
        .then(text => setSqlContent(text))
        .catch(err => console.error('Failed to load SQL:', err));
    }, []);

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(sqlContent);
        alert('SQL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy. Please try selecting the text in the box manually.');
      }
    };

    const downloadSql = () => {
      const link = document.createElement('a');
      link.href = '/supabase_schema.sql';
      link.download = 'supabase_schema.sql';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 p-4 overflow-y-auto">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8">
          <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{t('Database Error')}</h2>
              <p className="text-sm text-red-700">{t('Table "profiles" not found')}</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-stone-900 font-semibold">
                {t('The database schema has not been initialized.')}
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">
                {t('Since you are on a phone and cannot paste, please use the **"Upload File"** method below. It is the most reliable way for mobile users.')}
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Option 1: Upload File (Best for Mobile) */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-3">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t('Option 1: Upload File (Recommended for Phone)')}</h3>
                <p className="text-xs text-emerald-700">{t('This method does NOT require copying or pasting.')}</p>
                <ol className="list-decimal list-inside text-[11px] text-emerald-800 space-y-1">
                  <li>{t('Tap the button below to download the SQL file to your phone.')}</li>
                  <li>{t('Go to your')} <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-bold">Supabase SQL Editor</a>.</li>
                  <li>{t('Tap the "Scripts" or "User Queries" tab.')}</li>
                  <li>{t('Look for an **"Import"** or **"Upload"** button (often a folder icon).')}</li>
                  <li>{t('Select the "supabase_schema.sql" file you just downloaded.')}</li>
                  <li>{t('Tap **"Run"**.')}</li>
                </ol>
                <button 
                  onClick={downloadSql}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {t('Download SQL File Now')}
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-bold text-xs hover:bg-stone-800 transition-colors"
                >
                  {t('I have created the table, Refresh Now')}
                </button>
              </div>

              {/* Option 2: Mobile Text Box */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{t('Option 2: Copy/Paste (If Upload fails)')}</h3>
                <p className="text-xs text-stone-500">{t('If you want to try pasting again, use this box:')}</p>
                <textarea 
                  readOnly
                  value={sqlContent}
                  className="w-full h-32 p-3 text-[10px] font-mono bg-white border border-stone-200 rounded-lg focus:outline-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button 
                  onClick={copyToClipboard}
                  className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg font-bold text-xs hover:bg-stone-200 transition-colors"
                >
                  {t('Copy Code to Clipboard')}
                </button>
              </div>

              {/* Option 3: Manual Table Editor Guide */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{t('Option 3: Visual Table Editor')}</h3>
                <p className="text-xs text-stone-500">{t('Create the table manually without any code.')}</p>
                <button 
                  onClick={() => setShowManualGuide(!showManualGuide)}
                  className="text-emerald-600 text-xs font-bold hover:underline"
                >
                  {showManualGuide ? t('Hide Manual Guide') : t('Show Manual Guide')}
                </button>
                
                {showManualGuide && (
                  <div className="pt-2 space-y-3 text-[11px] text-stone-600 border-t border-stone-200">
                    <p className="font-bold text-stone-900">{t('Follow these steps in Supabase:')}</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>{t('Open "Table Editor" in the left sidebar (spreadsheet icon).')}</li>
                      <li>{t('Click "New Table".')}</li>
                      <li>{t('Name it "profiles".')}</li>
                      <li>{t('Enable RLS (Row Level Security).')}</li>
                      <li>{t('Add these columns:')}
                        <ul className="pl-4 mt-1 list-disc space-y-2">
                          <li>
                            <code className="bg-stone-100 px-1 rounded font-bold">id</code>: 
                            Type <code className="text-emerald-600">uuid</code>. 
                            Check <span className="font-bold">Primary Key</span>. 
                            Click the <span className="italic">Link icon</span> next to it, select <span className="font-bold">auth.users</span> and then <span className="font-bold">id</span>.
                          </li>
                          <li>
                            <code className="bg-stone-100 px-1 rounded font-bold">email</code>: 
                            Type <code className="text-emerald-600">text</code>. 
                            Check <span className="font-bold">Unique</span>.
                          </li>
                          <li>
                            <code className="bg-stone-100 px-1 rounded font-bold">full_name</code>: 
                            Type <code className="text-emerald-600">text</code>.
                          </li>
                          <li>
                            <code className="bg-stone-100 px-1 rounded font-bold">role</code>: 
                            Type <code className="text-emerald-600">text</code>. 
                            Default: <code className="text-emerald-600">'supervisor'</code> (with single quotes).
                          </li>
                        </ul>
                      </li>
                      <li>{t('Click "Save" at the bottom.')}</li>
                      <li>{t('Once saved, refresh this app.')}</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-stone-100">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-stone-800 transition-colors"
              >
                {t('I have initialized the database, Refresh Now')}
              </button>
              <button 
                onClick={() => signOut()}
                className="w-full py-2 text-stone-500 rounded-lg font-medium text-xs hover:text-stone-700 transition-colors"
              >
                {t('Sign Out')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [showForceRefresh, setShowForceRefresh] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowForceRefresh(true);
      }
    }, 10000); // Show after 10 seconds of loading
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-6 max-w-md px-6 text-center">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            {(connectionIssue || showForceRefresh) && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full animate-bounce">
                <AlertCircle size={16} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-stone-900 font-bold text-lg">{t('Initializing system...')}</p>
            <p className="text-stone-500 text-sm">
              {(connectionIssue || showForceRefresh)
                ? t('We are having trouble connecting to the database. This might take a moment.')
                : t('Setting up your workspace and loading preferences.')}
            </p>
          </div>

          {(connectionIssue || showForceRefresh) && (
            <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-stone-900 text-white rounded-lg font-medium text-sm hover:bg-stone-800 transition-colors"
              >
                {t('Retry Connection')}
              </button>
              <button 
                onClick={() => signOut()}
                className="w-full py-2 border border-stone-200 text-stone-600 rounded-lg font-medium text-sm hover:bg-stone-50 transition-colors"
              >
                {t('Sign Out & Try Again')}
              </button>
              <p className="text-[10px] text-stone-400 italic">
                {t('If you just created the table, please refresh.')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
