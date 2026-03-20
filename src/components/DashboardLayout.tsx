import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Package, 
  CreditCard, 
  BarChart3,
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCircle,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { UserRole } from '../types/database';
import { useTranslation } from 'react-i18next';
import { Chatbot } from './Chatbot';
import { NotificationCenter } from './NotificationCenter';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  children?: { title: string; href: string; roles?: UserRole[] }[];
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { user, profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { title: t('Dashboard'), href: '/', icon: LayoutDashboard, roles: ['admin', 'accountant', 'team_leader', 'supervisor'] },
    { 
      title: t('Inventory'), 
      href: '/inventory', 
      icon: Package, 
      roles: ['admin', 'accountant'],
      children: [
        { title: t('Products'), href: '/inventory/products' },
        { title: t('Categories'), href: '/inventory/categories' },
        { title: t('Stock In'), href: '/inventory/stock-in' },
        { title: t('Adjustments'), href: '/inventory/adjustments' },
        { title: t('Movements'), href: '/inventory/movements' },
        { title: t('Low Stock'), href: '/inventory/low-stock' },
      ]
    },
    { title: t('Employees'), href: '/employees', icon: Users, roles: ['admin', 'team_leader', 'supervisor'] },
    { 
      title: t('Credit & Debt'), 
      href: '/credit', 
      icon: CreditCard, 
      roles: ['admin', 'supervisor'],
      children: [
        { title: t('New Request'), href: '/credit/create', roles: ['supervisor'] },
        { title: t('My Team Requests'), href: '/credit/my-team', roles: ['supervisor'] },
        { title: t('Debt History'), href: '/credit/history', roles: ['supervisor'] },
        { title: t('Approve Requests'), href: '/credit/approval', roles: ['admin'] },
      ]
    },
    { 
      title: t('Attendance'), 
      href: '/attendance', 
      icon: ClipboardCheck, 
      roles: ['admin', 'accountant', 'team_leader', 'supervisor'],
      children: [
        { title: t('Daily Marking'), href: '/attendance/daily', roles: ['supervisor'] },
        { title: t('My Workers'), href: '/attendance/workers', roles: ['supervisor'] },
        { title: t('My History'), href: '/attendance/history', roles: ['supervisor'] },
        { title: t('Sector Summary'), href: '/attendance/summary', roles: ['team_leader'] },
        { title: t('Global Reports'), href: '/attendance/reports', roles: ['admin', 'accountant'] },
      ]
    },
    { 
      title: t('Payroll'), 
      href: '/payroll', 
      icon: CreditCard, 
      roles: ['admin', 'accountant', 'team_leader'],
      children: [
        { title: t('Payroll Periods'), href: '/payroll/periods', roles: ['admin', 'accountant'] },
        { title: t('Sector Preview'), href: '/payroll/sector-preview', roles: ['team_leader'] },
        { title: t('Net Salary Reports'), href: '/payroll/net-salary-reports', roles: ['accountant'] },
      ]
    },
    { 
      title: t('Reports'), 
      href: '/reports', 
      icon: BarChart3, 
      roles: ['admin', 'accountant', 'team_leader', 'supervisor'],
      children: [
        { title: t('Debt Reports'), href: '/reports/debt', roles: ['admin', 'accountant'] },
        { title: t('Sector Debt'), href: '/reports/sector-debt', roles: ['team_leader'] },
        { title: t('My Team Debt'), href: '/reports/supervisor-debt', roles: ['supervisor'] },
      ]
    },
    { 
      title: t('System'), 
      href: '/admin', 
      icon: Globe, 
      roles: ['admin'],
      children: [
        { title: t('Sectors'), href: '/admin/sectors' },
        { title: t('Settings'), href: '/settings' },
      ]
    },
  ];

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const filteredNavItems = navItems.filter(item => role && item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform bg-stone-900 text-stone-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-stone-800">
            <span className="text-xl font-bold tracking-tight text-emerald-500">KYC SHOP</span>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.includes(item.title);
              const isActive = location.pathname === item.href || (hasChildren && location.pathname.startsWith(item.href));
              
              return (
                <div key={item.title} className="space-y-1">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-stone-800 text-emerald-500" 
                          : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight size={14} className={cn("transition-transform", isExpanded && "rotate-90")} />
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-emerald-600 text-white" 
                          : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </div>
                      {isActive && <ChevronRight size={14} />}
                    </Link>
                  )}

                  {hasChildren && isExpanded && (
                    <div className="ml-9 space-y-1">
                      {item.children?.filter(child => !child.roles || (role && child.roles.includes(role))).map(child => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            location.pathname === child.href
                              ? "text-emerald-500"
                              : "text-stone-500 hover:text-stone-100"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-stone-800 p-4">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800">
                <UserCircle size={20} className="text-stone-400" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{profile?.full_name || user?.user_metadata?.full_name || 'User'}</span>
                <span className="truncate text-xs text-stone-500 capitalize">{role}</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-red-400"
            >
              <LogOut size={18} />
              <span>{t('Sign Out')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6">
          <button 
            className="text-stone-500 lg:hidden" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-auto flex items-center gap-6">
            {/* Notifications */}
            {(role === 'admin' || role === 'accountant') && <NotificationCenter />}

            {/* Language Switcher */}
            <div className="flex items-center gap-2 border-r border-stone-200 pr-6">
              <Globe size={18} className="text-stone-400" />
              <select 
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-sm font-medium text-stone-600 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>

            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium text-stone-900">{profile?.full_name}</p>
              <p className="text-xs text-stone-500 capitalize">{role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <Chatbot />
    </div>
  );
}
