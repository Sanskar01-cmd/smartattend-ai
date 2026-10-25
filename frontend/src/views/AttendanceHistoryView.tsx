import React, { useState, useEffect, useCallback } from 'react';
import { getMyAttendanceHistoryApi } from '../services/api';
import { BackendAttendance } from '../types';
import { Badge } from '../components/Badge';
import {
  AttendanceIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  RefreshIcon,
  AlertIcon,
} from '../components/Icons';

interface AttendanceHistoryViewProps {
  onRequireLogin?: () => void;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({ onRequireLogin }) => {
  const [history, setHistory] = useState<BackendAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAttendanceHistoryApi();
      setHistory(res.history);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch attendance history.';
      setError(msg);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalVerified = history.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Attendance History & Verification Logs
            </h1>
            <Badge variant="primary" size="sm">LIVE AUDIT</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable log of student attendance check-ins verified via gate door QR scanners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 block">Verified Sessions Attended</span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {totalVerified} Events
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">
            Validated via Door QR Matrix
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 block">Check-in Latency</span>
          <span className="text-2xl font-bold text-white mt-1 block">&lt; 0.5s</span>
          <span className="text-[11px] text-cyan-400 mt-1 inline-block">
            Sub-second verification protocol
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 block">Verification Protocol</span>
          <span className="text-2xl font-bold text-white mt-1 block">100% QR-Only</span>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            Zero biometric or facial dependency
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {onRequireLogin && (
            <button
              onClick={onRequireLogin}
              className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AttendanceIcon className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verified Session Check-in Log
            </h3>
          </div>
          <Badge variant="primary" size="sm">LIVE MYSQL RECORDS</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Event / Workshop</th>
                <th className="py-3.5 px-4 font-semibold">Verified Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Venue</th>
                <th className="py-3.5 px-4 font-semibold">Scanning Station</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading your attendance history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No verified attendance records found yet. Once you arrive at an event and present your QR pass, your verified check-in will appear here in real-time.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">
                        {record.registration?.event?.title || 'College Session'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {record.registration?.event?.category || 'Workshop'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 text-brand-400" />
                        <span>{new Date(record.verified_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{record.registration?.event?.venue || 'Campus Hall'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {record.device_info}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        <span>Verified Present</span>
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
