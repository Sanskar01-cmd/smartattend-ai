import React from 'react';
import { NavigationTab, AuthUser } from '../types';
import {
  DashboardIcon,
  EventsIcon,
  QrCodeIcon,
  AttendanceIcon,
  ProfileIcon,
  BotIcon,
  ShieldCheckIcon,
} from './Icons';

interface StudentSidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentUser: AuthUser | null;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  tag?: string;
  description: string;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchToAdmin,
}) => {
  const isStudent = currentUser?.role === 'student';

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
      description: 'Overview, stats & active events',
    },
    {
      id: 'events',
      label: 'Browse Events',
      icon: EventsIcon,
      tag: 'Catalog',
      description: 'Explore campus sessions & workshops',
    },
    {
      id: 'passes',
      label: 'My QR Passes',
      icon: QrCodeIcon,
      tag: 'QR-Only',
      description: 'Digital door admission tokens',
    },
    {
      id: 'attendance',
      label: 'Attendance History',
      icon: AttendanceIcon,
      description: 'Verified check-in timestamps',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: ShieldCheckIcon,
      tag: 'Verified',
      description: 'Earned participation credentials',
    },
    {
      id: 'profile',
      label: 'Digital Profile',
      icon: ProfileIcon,
      tag: isStudent ? 'Active' : 'Auth Required',
      description: 'Student credentials & contact info',
    },
    {
      id: 'assistant',
      label: 'AI Event Assistant',
      icon: BotIcon,
      tag: 'AI',
      description: 'Smart campus event chatbot',
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
        className={`fixed md:sticky top-0 md:top-[61px] left-0 z-40 md:z-10 h-screen md:h-[calc(100vh-61px)] w-72 bg-navy-900/95 md:bg-navy-900/40 border-r border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Panel Header Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                STUDENT PANEL
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50">
                CAMPUS
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Student Attendance & Passes
            </p>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              Student Navigation
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
                        ? 'bg-brand-600 text-white shadow-glow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold leading-none">{item.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 truncate max-w-[140px] ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
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

        {/* Sidebar Footer: User Card / Auth & Portal Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {currentUser ? (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 font-bold text-xs flex items-center justify-center">
                  {(currentUser.first_name?.[0] || currentUser.username?.[0] || 'S').toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate">
                    {currentUser.role === 'student' ? 'Student' : 'Administrator'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold text-center transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={onLogout}
                  className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-sm transition-all"
              >
                Student Sign In / Register
              </button>
            </div>
          )}

          {/* Switch to Admin Portal Button */}
          <button
            onClick={onSwitchToAdmin}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin Portal</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-rose-400">Switch &rarr;</span>
          </button>
        </div>
      </aside>
    </>
  );
};
