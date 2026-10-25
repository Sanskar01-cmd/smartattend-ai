import React from 'react';
import { NavigationTab, AuthUser } from '../types';
import {
  ShieldCheckIcon,
  EventsIcon,
  UsersIcon,
  ClockIcon,
  QrCodeIcon,
  AttendanceIcon,
  RefreshIcon,
  DashboardIcon,
} from './Icons';

interface AdminSidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentUser: AuthUser | null;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onLogout: () => void;
  onSwitchToStudent: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  tag?: string;
  description: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchToStudent,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_staff || currentUser?.is_superuser;

  const navItems: NavItem[] = [
    {
      id: 'admin-dashboard',
      label: 'Admin Overview',
      icon: ShieldCheckIcon,
      tag: 'Live',
      description: 'System metrics & admin creation',
    },
    {
      id: 'admin-events',
      label: 'Manage Events',
      icon: EventsIcon,
      tag: 'Active',
      description: 'Create, edit & cancel events',
    },
    {
      id: 'admin-students',
      label: 'Student Accounts',
      icon: UsersIcon,
      tag: 'MySQL',
      description: 'Directory of registered students',
    },
    {
      id: 'admin-registrations',
      label: 'Registrations',
      icon: ClockIcon,
      description: 'Event enrollments & QR passes',
    },
    {
      id: 'admin-scanner',
      label: 'QR Gate Scanner',
      icon: QrCodeIcon,
      tag: 'Scanner',
      description: 'Live attendance check-in gate',
    },
    {
      id: 'admin-reports',
      label: 'Attendance Reports',
      icon: AttendanceIcon,
      tag: 'CSV',
      description: 'Audit logs & spreadsheet export',
    },
    {
      id: 'admin-certificates',
      label: 'Certificates',
      icon: ShieldCheckIcon,
      description: 'Issue & manage certificates',
    },
    {
      id: 'admin-settings',
      label: 'System Settings',
      icon: RefreshIcon,
      description: 'Security & backend permissions',
    },
  ];

  const handleNavClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 md:top-[61px] left-0 z-40 md:z-10 h-screen md:h-[calc(100vh-61px)] w-72 bg-navy-900/95 md:bg-navy-900/40 border-r border-rose-900/30 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Admin Header Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-900/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-300 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-rose-400" />
                <span>ADMIN PANEL</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-200 border border-rose-700/50 font-mono">
                ROLE-RESTRICTED
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Institutional Event Administration
            </p>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-400/80">
              Administrative Modules
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-rose-700 text-white shadow-glow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-rose-400 group-hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold leading-none">{item.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 truncate max-w-[140px] ${
                            isActive ? 'text-rose-100' : 'text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {item.tag && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Admin Auth & Portal Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {currentUser && isAdmin ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-900/40 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center">
                  {(currentUser.first_name?.[0] || currentUser.username?.[0] || 'A').toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}
                  </div>
                  <div className="text-[10px] font-mono text-rose-400 truncate">
                    Staff Administrator
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-semibold transition-colors"
              >
                Sign Out Administrator
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onOpenAuth('admin')}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Admin Sign In</span>
              </button>
            </div>
          )}

          {/* Switch to Student Portal Button */}
          <button
            onClick={onSwitchToStudent}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-cyan-800/50 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <DashboardIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Student Portal</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-cyan-400">Switch &rarr;</span>
          </button>
        </div>
      </aside>
    </>
  );
};
