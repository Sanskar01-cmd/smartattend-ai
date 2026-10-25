import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, AdminOverviewResponse, NavigationTab } from '../types';
import { getAdminOverviewApi, createAdminApi } from '../services/api';
import { Badge } from '../components/Badge';
import {
  ShieldCheckIcon,
  EventsIcon,
  UsersIcon,
  QrCodeIcon,
  AttendanceIcon,
  ClockIcon,
  AlertIcon,
  CheckIcon,
  RefreshIcon,
  XIcon,
} from '../components/Icons';

interface AdminDashboardViewProps {
  currentUser: AuthUser | null;
  onNavigate: (tab: NavigationTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provision Admin Modal State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionUsername, setProvisionUsername] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionName, setProvisionName] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOverviewApi();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch administrator metrics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    setProvisionSuccess(null);

    if (!provisionUsername.trim() || !provisionEmail.trim() || !provisionPassword) {
      setProvisionError('Username, email, and password are required.');
      return;
    }

    if (provisionPassword.length < 8) {
      setProvisionError('Password must be at least 8 characters long.');
      return;
    }

    setProvisionLoading(true);
    try {
      const res = await createAdminApi({
        username: provisionUsername.trim(),
        email: provisionEmail.trim().toLowerCase(),
        password: provisionPassword,
        name: provisionName.trim() || 'Administrator',
      });

      setProvisionSuccess(res.message);
      setProvisionUsername('');
      setProvisionEmail('');
      setProvisionName('');
      setProvisionPassword('');
      fetchOverview();
      setTimeout(() => {
        setShowProvisionModal(false);
        setProvisionSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin provisioning failed.';
      setProvisionError(msg);
    } finally {
      setProvisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Administrator Portal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-900/50 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-rose-400" />
                <span>ADMINISTRATOR CONSOLE</span>
              </span>
              <Badge variant="outline" size="sm">ROLE-PROTECTED</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Administrator Dashboard 👋 {currentUser ? `(${currentUser.username})` : ''}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Institutional portal for event coordinators and faculty administrators. Manage campus sessions, student profiles, door QR check-ins, and attendance reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-700 hover:bg-rose-600 text-white shadow-glow-sm transition-all flex items-center gap-2"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Provision Admin</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>View Student Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertIcon className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-3 py-1 rounded bg-rose-900 text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Administrative Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('admin-students')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-800/50 text-blue-400">
              <UsersIcon className="w-5 h-5" />
            </div>
            <Badge variant="primary" size="sm">LIVE MYSQL</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Registered Students
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {loading ? '...' : data?.stats.total_students ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Verified: <strong className="text-emerald-400">{data?.stats.verified_students ?? 0}</strong>
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-events')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
              <EventsIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">SCHEDULE</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Campus Events Catalog
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {loading ? '...' : data?.stats.active_events ?? 4} Active
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Click to schedule or edit events &rarr;
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-registrations')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-400">
              <ClockIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">PASSES</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Total Event Registrations
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {loading ? '...' : data?.stats.total_registrations ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active student QR passes issued
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-scanner')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
              <QrCodeIcon className="w-5 h-5" />
            </div>
            <Badge variant="outline" size="sm">GATE SCANNER</Badge>
          </div>
          <div className="mt-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              QR Verified Attendances
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {loading ? '...' : data?.stats.total_scanned_attendances ?? 0} Scans
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Open Live Gate Scanner Station &rarr;
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('admin-scanner')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-900/40 hover:border-rose-700/60 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
              <QrCodeIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-rose-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h4 className="text-sm font-bold text-white">Open Gate Scanner</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scan student QR passes in real-time with automatic duplicate detection & anti-passback protection.
          </p>
        </div>

        <div
          onClick={() => onNavigate('admin-reports')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-900/40 hover:border-emerald-700/60 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <AttendanceIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h4 className="text-sm font-bold text-white">Attendance Reports &amp; CSV</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Download institutional attendance rosters as CSV spreadsheets and audit check-in timestamps.
          </p>
        </div>

        <div
          onClick={() => onNavigate('admin-events')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/30 border border-blue-900/40 hover:border-blue-700/60 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-950 border border-blue-800 text-cyan-400">
              <EventsIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
          <h4 className="text-sm font-bold text-white">Schedule New Session</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Add workshops, seminars, and hackathons with venue assignments and seat capacity quotas.
          </p>
        </div>
      </div>

      {/* Recent Student Registrations Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recently Registered Students (Live MySQL)
            </h3>
          </div>
          <button
            onClick={fetchOverview}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Student ID</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Course / Degree</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recent_students && data.recent_students.length > 0 ? (
                data.recent_students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{student.full_name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{student.student_id}</td>
                    <td className="py-3 px-4 text-slate-300">{student.email}</td>
                    <td className="py-3 px-4 text-slate-300">{student.department}</td>
                    <td className="py-3 px-4 text-slate-400">{student.course}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No student accounts found in database yet. Students who register via the portal will appear here in real-time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Provision Administrator</h3>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Create an additional administrator account with role <code>admin</code> and staff privileges. Protected by backend administrator authorization.
            </p>

            {provisionError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{provisionError}</span>
              </div>
            )}

            {provisionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{provisionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Admin Full Name</label>
                <input
                  type="text"
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Username *</label>
                <input
                  type="text"
                  value={provisionUsername}
                  onChange={(e) => setProvisionUsername(e.target.value)}
                  required
                  placeholder="e.g. admin_cs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Institutional Email *</label>
                <input
                  type="email"
                  value={provisionEmail}
                  onChange={(e) => setProvisionEmail(e.target.value)}
                  required
                  placeholder="e.g. ramesh.gupta@college.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Password (min 8 chars) *</label>
                <input
                  type="password"
                  value={provisionPassword}
                  onChange={(e) => setProvisionPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {provisionLoading ? <span>Creating...</span> : <span>Create Administrator</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
