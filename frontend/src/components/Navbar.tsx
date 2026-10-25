import React from 'react';
import { LogoIcon, MenuIcon, XIcon, RefreshIcon, ShieldCheckIcon, DashboardIcon } from './Icons';
import { Badge } from './Badge';
import { AuthUser, ApiStudentProfile, NavigationTab, PanelType } from '../types';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  backendOnline: boolean | null;
  checkingBackend: boolean;
  onRefreshHealth: () => void;
  currentUser: AuthUser | null;
  profile: ApiStudentProfile | null;
  currentPanel: PanelType;
  onSwitchPanel: (panel: PanelType) => void;
  onOpenAuth: (defaultMode?: 'login' | 'register' | 'admin') => void;
  onLogout: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  backendOnline,
  checkingBackend,
  onRefreshHealth,
  currentUser,
  profile,
  currentPanel,
  onSwitchPanel,
  onOpenAuth,
  onLogout,
  onNavigate,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_staff || currentUser?.is_superuser;
  const isPanelAdmin = currentPanel === 'admin';
  const displayName = profile?.full_name || (currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username : null);
  const displayId = profile?.student_id || (currentUser ? currentUser.username : null);
  const roleName = isAdmin ? 'Administrator' : 'Student';

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SA';

  return (
    <header className="sticky top-0 z-30 w-full bg-navy-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onNavigate && onNavigate(isPanelAdmin ? 'admin-dashboard' : 'dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-xl p-0.5 shadow-glow-sm flex items-center justify-center ${
              isPanelAdmin
                ? 'bg-gradient-to-tr from-rose-600 to-amber-500'
                : 'bg-gradient-to-tr from-brand-600 to-cyan-500'
            }`}>
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                {isPanelAdmin ? (
                  <ShieldCheckIcon className="w-5 h-5 text-rose-400" />
                ) : (
                  <LogoIcon className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  SmartAttend <span className={isPanelAdmin ? 'text-rose-400' : 'text-cyan-400'}>{isPanelAdmin ? 'Admin' : 'AI'}</span>
                </span>
                <span className={`hidden sm:inline-block text-[10px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                  isPanelAdmin
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                    : 'bg-blue-900/60 text-blue-300 border-blue-700/50'
                }`}>
                  {isPanelAdmin ? 'Staff Console' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isPanelAdmin ? 'Institutional Event & Attendance Administration' : 'College Event & Workshop Attendance System'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Explicit Portal Switcher Control */}
        <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => onSwitchPanel('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentPanel === 'student'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DashboardIcon className="w-3.5 h-3.5 text-cyan-300" />
            <span>Student Panel</span>
          </button>
          <button
            onClick={() => onSwitchPanel('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentPanel === 'admin'
                ? 'bg-rose-700 text-white shadow-glow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Right: Backend health status & User authentication */}
        <div className="flex items-center gap-3">
          {/* Backend Status indicator badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : backendOnline === false
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 text-[11px]">
              {backendOnline === true
                ? 'Backend: Online (/api/health/)'
                : backendOnline === false
                ? 'Backend: Offline (Demo Mode)'
                : 'Checking /api/health/...'}
            </span>
            <button
              onClick={onRefreshHealth}
              disabled={checkingBackend}
              title="Refresh /api/health/ status"
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${checkingBackend ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* User profile capsule / Login Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shadow ${
                isAdmin
                  ? 'bg-gradient-to-br from-rose-600 to-indigo-700'
                  : 'bg-gradient-to-br from-brand-600 to-indigo-700'
              }`}>
                {profile?.photo_base64 ? (
                  <img src={profile.photo_base64} alt={displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">
                    {displayName}
                  </span>
                  <Badge variant={isAdmin ? 'warning' : 'primary'} size="sm">
                    {roleName}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 font-mono block">
                  {displayId}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-sm transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('admin')}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-900/40 text-rose-300 font-semibold text-xs transition-colors items-center gap-1"
              >
                <ShieldCheckIcon className="w-3.5 h-3.5 text-rose-400" />
                <span>Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
