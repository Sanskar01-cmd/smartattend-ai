import React, { useState, useEffect, useCallback } from 'react';
import { adminIssueCertificateApi, getEventsApi } from '../services/api';
import { BackendCertificate, BackendEvent } from '../types';
import { Badge } from '../components/Badge';
import {
  ShieldCheckIcon,
  RefreshIcon,
  AlertIcon,
  CheckIcon,
  XIcon,
} from '../components/Icons';

export const AdminCertificatesView: React.FC = () => {
  const [certificates, setCertificates] = useState<BackendCertificate[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State for Issuing Certificate
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [certTitle, setCertTitle] = useState('');
  const [grade, setGrade] = useState('Distinction');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsRes = await getEventsApi();
      setEvents(eventsRes.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenIssueModal = () => {
    setStudentId('');
    setSelectedEventId(events[0]?.id || '');
    setCertTitle('');
    setGrade('Distinction');
    setModalError(null);
    setShowModal(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!studentId.trim() || !selectedEventId) {
      setModalError('Student ID and Event are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminIssueCertificateApi({
        student_id: studentId.trim(),
        event_id: Number(selectedEventId),
        title: certTitle.trim() || undefined,
        grade,
      });

      setCertificates((prev) => [res.certificate, ...prev]);
      setActionSuccess(res.message);
      setShowModal(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Certificate issuance failed.';
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Certificate Management
            </h1>
            <Badge variant="outline" size="sm">CREDENTIALS REGISTRY</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Issue verified certificates of participation and completion for campus workshops, seminars, and hackathons.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenIssueModal}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1.5"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Automated QR Attendance Certification</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              In addition to manual issuance below, the SmartAttend AI backend automatically creates verified certificates for students as soon as their QR pass is validated at the entrance gate!
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
            DRF ENGINE
          </span>
        </div>

        {/* Issued Certificates Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name &amp; ID</th>
                <th className="py-3 px-4 font-semibold">Certificate Title</th>
                <th className="py-3 px-4 font-semibold">Certificate Serial</th>
                <th className="py-3 px-4 font-semibold">Standing</th>
                <th className="py-3 px-4 font-semibold">Issued Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No newly issued certificates in this session. Certificates generated upon door QR scanner check-ins appear in student portals.
                  </td>
                </tr>
              ) : (
                certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{c.student?.full_name}</span>
                      <span className="text-[11px] font-mono text-cyan-400">{c.student?.student_id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {c.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-300 font-bold">
                      {c.certificate_code}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      {c.grade_or_score}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(c.issued_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Issuing Certificate */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-rose-400" />
                <span>Issue Student Certificate</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Student ID *</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  placeholder="e.g. CS-2024-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Select Event / Workshop *</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select an Event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Certificate Title</label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="Leave empty for auto-generated title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Grade / Standing</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Distinction">Distinction</option>
                  <option value="Merit">Merit</option>
                  <option value="Participation">Participation</option>
                  <option value="Excellence">Excellence</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting ? <span>Issuing...</span> : <span>Issue Credential</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
