import React from 'react';
import { NavigationTab, AuthUser } from '../types';
import {
  DashboardIcon,
  EventsIcon,
  QrCodeIcon,
  AttendanceIcon,
  ProfileIcon,
  BotIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from './Icons';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  tag?: string;
  description: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_staff || currentUser?.is_superuser;

  const studentNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
      description: 'Overview, stats & active events',
    },
    {
      id: 'events',
      label: 'Events & Workshops',
      icon: EventsIcon,
      tag: 'Catalog',
      description: 'Explore campus sessions & talks',
    },
    {
      id: 'passes',
      label: 'My QR Passes',
      icon: QrCodeIcon,
      tag: 'QR-Only',
      description: 'Entrance QR passes & tokens',
    },
    {
      id: 'attendance',
      label: 'Attendance History',
      icon: AttendanceIcon,
      description: 'Past session logs & check-ins',
    },
    {
      id: 'profile',
      label: 'Digital Profile',
      icon: ProfileIcon,
      tag: currentUser ? 'Active' : 'Auth Required',
      description: 'Student credentials & college identity',
    },
    {
      id: 'assistant',
      label: 'AI Event Assistant',
      icon: BotIcon,
      tag: 'AI',
      description: 'Interactive campus assistant preview',
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: 'admin-dashboard',
      label: 'Admin Overview',
      icon: ShieldCheckIcon,
      tag: 'Console',
      description: 'Administrative metrics and status',
    },
    {
      id: 'dashboard',
      label: 'Student Portal Preview',
      icon: DashboardIcon,
      tag: 'Preview',
      description: 'Inspect student UI perspective',
    },
    {
      id: 'events',
      label: 'Campus Events',
      icon: EventsIcon,
      tag: 'Catalog',
      description: 'Explore campus sessions & talks',
    },
    {
      id: 'assistant',
      label: 'AI Event Assistant',
      icon: BotIcon,
      tag: 'AI',
      description: 'Interactive campus assistant preview',
    },
  ];

  const currentNavItems = isAdmin ? adminNavItems : studentNavItems;

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 border-r border-slate-800/90 pt-16 md:pt-0 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 px-4 py-5 overflow-y-auto">
          {/* Section title */}
          <div className="px-2 mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Admin Management' : 'System Modules'}
            </span>
            {isAdmin && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                ADMIN
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                    isActive
                      ? isAdmin && item.id === 'admin-dashboard'
                        ? 'bg-rose-700 text-white shadow-glow-sm'
                        : 'bg-brand-600 text-white shadow-glow-sm'
                      : 'text-slate-300 hover:bg-slate-900/90 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-white'
                          : isAdmin && item.id === 'admin-dashboard'
                          ? 'text-rose-400 group-hover:text-rose-300'
                          : 'text-slate-400 group-hover:text-cyan-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.tag && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-slate-800/80 text-white'
                          : item.tag === 'Console'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : item.tag === 'AI'
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin shortcuts if admin */}
          {isAdmin && activeTab !== 'admin-dashboard' && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs">
              <span className="text-rose-300 font-bold block mb-1">Admin Mode Active</span>
              <p className="text-[11px] text-slate-400 mb-2">
                Return to the protected institutional admin panel.
              </p>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>Open Admin Dashboard</span>
              </button>
            </div>
          )}

          {/* Auth callout if unauthenticated */}
          {!currentUser ? (
            <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900 border border-brand-500/30 text-xs">
              <span className="font-bold text-white block mb-1">Institutional Portal</span>
              <p className="text-[11px] text-slate-300 mb-2.5">
                Sign in to view student records or access faculty admin tools.
              </p>
              <button
                onClick={onOpenAuth}
                className="w-full py-1.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-sm transition-all"
              >
                Sign In / Register
              </button>
            </div>
          ) : (
            <div className="mt-6 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Signed In</span>
                <span className={`text-[10px] font-semibold capitalize ${isAdmin ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ● {currentUser.role}
                </span>
              </div>
              <p className="text-xs font-semibold text-white truncate">{currentUser.email}</p>
              <button
                onClick={onLogout}
                className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-[11px] transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Verification Protocol Banner */}
          <div className="mt-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-xs">
            <div className="flex items-center gap-2 mb-1 text-cyan-400 font-semibold">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>QR-Only Policy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No biometric or face capture required. Only cryptographic QR passes are scanned at college venue entrances.
            </p>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>SmartAttend Architecture</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Role-Based Access: Student & Admin
          </p>
        </div>
      </aside>
    </>
  );
};
