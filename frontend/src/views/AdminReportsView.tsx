import React, { useState, useEffect, useCallback } from 'react';
import { getAdminAttendanceReportsApi, getExportAttendanceCsvUrl } from '../services/api';
import { BackendAttendance } from '../types';
import { Badge } from '../components/Badge';
import {
  AttendanceIcon,
  ShieldCheckIcon,
  RefreshIcon,
  AlertIcon,
} from '../components/Icons';

export const AdminReportsView: React.FC = () => {
  const [records, setRecords] = useState<BackendAttendance[]>([]);
  const [summary, setSummary] = useState<{
    total_scans: number;
    verified_count: number;
    duplicate_count: number;
    verification_mode: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAttendanceReportsApi();
      setRecords(res.records || []);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch attendance audit reports.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCsv = () => {
    window.open(getExportAttendanceCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Attendance Reports &amp; Audit Logs
            </h1>
            <Badge variant="outline" size="sm">CSV EXPORT READY</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit gate verification logs, identify anti-passback duplicate attempts, and export institutional attendance rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1.5"
          >
            <AttendanceIcon className="w-4 h-4" />
            <span>Export Roster CSV</span>
          </button>
          <button
            onClick={fetchReports}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Total Scanned Attempts
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
            {loading ? '...' : summary?.total_scans ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Gate scanner verification cycles</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Verified Check-ins
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
            {loading ? '...' : summary?.verified_count ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Legitimate admissions granted</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Blocked Duplicate Attempts
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 mt-1">
            {loading ? '...' : summary?.duplicate_count ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Anti-passback protection triggers</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Verification Protocol
          </span>
          <div className="text-lg font-bold text-cyan-400 mt-1 truncate">
            100% QR-Only
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Strictly zero biometric dependency</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verified Attendance Logs ({records.length} Records)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">Audit Trail: Immutable</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name &amp; ID</th>
                <th className="py-3 px-4 font-semibold">Event / Workshop</th>
                <th className="py-3 px-4 font-semibold">QR Pass Token</th>
                <th className="py-3 px-4 font-semibold">Gate Station</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading attendance audit logs...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No attendance records logged yet. Scans performed in the QR Gate Scanner will appear here immediately.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">
                        {r.registration?.student?.full_name || 'Attendee'}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {r.registration?.student?.student_id || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.registration?.event?.title || 'Campus Event'}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-300">
                      {r.registration?.pass_token || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {r.device_info}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {new Date(r.verified_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.verification_status === 'Verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {r.verification_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
