import React, { useState, useEffect, useCallback } from 'react';
import { getAdminRegistrationsApi, getEventsApi } from '../services/api';
import { BackendRegistration, BackendEvent } from '../types';
import { Badge } from '../components/Badge';
import { ClockIcon, RefreshIcon, AlertIcon, SearchIcon } from '../components/Icons';

export const AdminRegistrationsView: React.FC = () => {
  const [registrations, setRegistrations] = useState<BackendRegistration[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [regsRes, eventsRes] = await Promise.all([
        getAdminRegistrationsApi(selectedEventId !== 'All' ? Number(selectedEventId) : undefined),
        getEventsApi(),
      ]);
      setRegistrations(regsRes.registrations || []);
      setEvents(eventsRes.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch registrations.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = registrations.filter((r) => {
    const s = search.toLowerCase();
    const stName = r.student?.full_name?.toLowerCase() || '';
    const stId = r.student?.student_id?.toLowerCase() || '';
    const evTitle = r.event?.title?.toLowerCase() || '';
    const token = r.pass_token?.toLowerCase() || '';
    return stName.includes(s) || stId.includes(s) || evTitle.includes(s) || token.includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Campus Event Registrations
            </h1>
            <Badge variant="outline" size="sm">LIVE ENROLLMENTS</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            View student pass assignments, verify issued tokens, and audit workshop attendance status.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filter by Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Events ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, pass token, event..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Registrations List ({filtered.length} Records)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">Strictly QR Passes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name &amp; ID</th>
                <th className="py-3 px-4 font-semibold">Event</th>
                <th className="py-3 px-4 font-semibold">QR Pass Token</th>
                <th className="py-3 px-4 font-semibold">Registered Timestamp</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No registrations found. Students who register for events will appear here in real-time.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{r.student?.full_name}</span>
                      <span className="text-[11px] font-mono text-cyan-400">{r.student?.student_id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-medium text-slate-200 block">{r.event?.title}</span>
                      <span className="text-[11px] text-slate-400">{r.event?.category} • {r.event?.venue}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-300 font-bold">
                      {r.pass_token}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.registered_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'Attended'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : r.status === 'Cancelled'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        }`}
                      >
                        {r.status}
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
