import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export function Dashboard() {
  const { user, profile, role } = useAuth();
  const { t } = useTranslation();

  const stats = [
    { title: t('Total Employees'), value: '24', change: '+2', trend: 'up', icon: Users },
    { title: t('Inventory Items'), value: '1,240', change: '-12', trend: 'down', icon: Package },
    { title: t('Monthly Revenue'), value: 'RWF 2.4M', change: '+15%', trend: 'up', icon: TrendingUp },
    { title: t('Pending Attendance'), value: '5', change: '0', trend: 'neutral', icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{t('Welcome back')}, {profile?.full_name || user?.user_metadata?.full_name || 'User'}</h1>
        <p className="text-stone-500">{t("Here's what's happening")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
                <stat.icon size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                stat.trend === 'up' ? "text-emerald-600" : stat.trend === 'down' ? "text-red-600" : "text-stone-500"
              )}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : stat.trend === 'down' ? <ArrowDownRight size={12} /> : null}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-stone-500">{stat.title}</p>
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">{t('Recent Activity')}</h3>
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  {i}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">Inventory updated</p>
                  <p className="text-xs text-stone-500">2 hours ago by Accountant</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">{t('Quick Actions')}</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button className="rounded-lg border border-stone-200 p-4 text-left transition-colors hover:bg-stone-50">
              <p className="text-sm font-medium text-stone-900">{t('Add Employee')}</p>
              <p className="text-xs text-stone-500">{t('Register a new staff member')}</p>
            </button>
            <button className="rounded-lg border border-stone-200 p-4 text-left transition-colors hover:bg-stone-50">
              <p className="text-sm font-medium text-stone-900">{t('Mark Attendance')}</p>
              <p className="text-xs text-stone-500">{t('Daily check-in for team')}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
