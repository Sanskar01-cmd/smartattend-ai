import React, { useState, useEffect } from 'react';
import { getEventsApi, getMyPassesApi, getMyAttendanceHistoryApi, getMyCertificatesApi } from '../services/api';
import { Badge } from '../components/Badge';
import {
  ShieldCheckIcon,
  ChevronRightIcon,
  ProfileIcon,
  EventsIcon,
  QrCodeIcon,
  AttendanceIcon,
  BotIcon,
  ClockIcon,
  MapPinIcon,
} from '../components/Icons';
import { NavigationTab, AuthUser, ApiStudentProfile, BackendEvent, BackendRegistration } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  currentUser: AuthUser | null;
  profile: ApiStudentProfile | null;
  onRequireLogin: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentUser,
  profile,
  onRequireLogin,
}) => {
  const [upcomingEvents, setUpcomingEvents] = useState<BackendEvent[]>([]);
  const [myPasses, setMyPasses] = useState<BackendRegistration[]>([]);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [certsCount, setCertsCount] = useState<number>(0);

  const welcomeName = profile?.full_name || (currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username : 'Guest Attendee');
  const studentId = profile?.student_id || currentUser?.username;

  useEffect(() => {
    getEventsApi()
      .then((res) => setUpcomingEvents(res.events?.slice(0, 3) || []))
      .catch(() => {});

    if (currentUser) {
      getMyPassesApi()
        .then((res) => setMyPasses(res.passes || []))
        .catch(() => {});

      getMyAttendanceHistoryApi()
        .then((res) => setVerifiedCount(res.count || 0))
        .catch(() => {});

      getMyCertificatesApi()
        .then((res) => setCertsCount(res.count || 0))
        .catch(() => {});
    }
  }, [currentUser]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-900/40 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                STUDENT PORTAL
              </span>
              {currentUser ? (
                <Badge variant="success" size="sm">
                  <ShieldCheckIcon className="w-3 h-3" />
                  <span>STUDENT VERIFIED</span>
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">GUEST MODE</Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {welcomeName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentUser ? (
                <>
                  Student ID: <strong className="text-cyan-400 font-mono">{studentId}</strong> • Department:{' '}
                  <strong className="text-slate-200">{profile?.department || 'Engineering'}</strong>
                </>
              ) : (
                'Sign in with your student account to register for workshops and access your digital QR passes.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={() => onNavigate('profile')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <ProfileIcon className="w-4 h-4 text-cyan-400" />
                <span>My Profile</span>
              </button>
            ) : (
              <button
                onClick={onRequireLogin}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm transition-all"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm transition-all flex items-center gap-1.5"
            >
              <EventsIcon className="w-4 h-4" />
              <span>Browse Events</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Personal KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('events')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-800/50 text-cyan-400">
              <EventsIcon className="w-5 h-5" />
            </div>
            <Badge variant="primary" size="sm">SESSIONS</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Upcoming Events
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {upcomingEvents.length || 4}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Available for registration</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('passes')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
              <QrCodeIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">QR-ONLY</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Active QR Passes
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1">
              {myPasses.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Digital admission tickets</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
              <AttendanceIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">VERIFIED</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Verified Check-ins
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {verifiedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Gate scanner validated</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('certificates')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800/50 text-amber-400">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">CREDENTIALS</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Certificates Earned
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
              {certsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Click to view &amp; print</p>
          </div>
        </div>
      </div>

      {/* Featured Upcoming Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Featured Campus Events &amp; Workshops
            </h2>
            <p className="text-xs text-slate-400">
              One-click registration delivers an instant QR admission pass directly to your device.
            </p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({upcomingEvents.length})</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {upcomingEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-950 text-cyan-400 border border-blue-800/40">
                    {ev.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Open Seats</span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-2">{ev.title}</h3>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-brand-400" />
                    <span>{ev.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('events')}
                  className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>Register for Pass</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assistant & Quick Links Strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <BotIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Need help or schedule directions?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask the SmartAttend AI Assistant about prerequisites, venue locations, and QR door verification.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('assistant')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2"
        >
          <span>Open AI Assistant</span>
          <ChevronRightIcon className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
