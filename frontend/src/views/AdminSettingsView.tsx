import React, { useState } from 'react';
import { Badge } from '../components/Badge';
import { ShieldCheckIcon, CheckIcon } from '../components/Icons';

export const AdminSettingsView: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Security');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmittedNotice(`Feedback recorded for [${feedbackCategory}]: "${feedback.slice(0, 40)}..."`);
    setFeedback('');
    setTimeout(() => setSubmittedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Institutional Settings &amp; Security Controls
            </h1>
            <Badge variant="outline" size="sm">SYSTEM GOVERNANCE</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure institutional parameters, audit role-based authorization policies, and verify system integrity.
          </p>
        </div>
      </div>

      {submittedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* Security Policies Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-rose-400" />
            <span>Role-Based Access Control (RBAC) Governance</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
            BACKEND ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Student Panel Permissions</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • Can browse scheduled events and obtain unique QR admission passes.<br/>
              • Can safely edit personal profile (name, student ID, department, phone).<br/>
              • <strong>Scope Boundary:</strong> Students can ONLY view their own passes, attendance history, and certificates.<br/>
              • Students cannot promote themselves to administrator role.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-900/40 space-y-2">
            <div className="font-bold text-rose-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Administrator Portal Security</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • All admin APIs protected on backend via <code>[IsAuthenticated, IsAdminRole]</code>.<br/>
              • Unauthorized students attempting to access Admin endpoints receive HTTP 403 Forbidden.<br/>
              • Public self-registration for admin accounts is strictly prohibited.<br/>
              • First administrator is provisioned via CLI: <code>python manage.py create_admin</code>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-cyan-400">Strictly QR-Matrix Code Verification Guarantee</div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Per college capstone specifications, SmartAttend AI guarantees zero biometric or facial recognition dependency.
            Camera access is exclusively utilized by the QR scanner component to decode standard 2D matrix tokens.
            Anti-passback protection prevents ticket reuse and logs duplicate scanning attempts.
          </p>
        </div>
      </div>

      {/* Database & Infrastructure Specifications */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white">System Architecture &amp; Database State</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Database Engine</span>
            <span className="font-mono font-bold text-white mt-1 block">MySQL 8.0</span>
            <span className="text-[10px] text-emerald-400">PyMySQL driver</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Backend Framework</span>
            <span className="font-mono font-bold text-white mt-1 block">Django 5.2 + DRF</span>
            <span className="text-[10px] text-cyan-400">Token Authentication</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Frontend Stack</span>
            <span className="font-mono font-bold text-white mt-1 block">React 18 + Vite + TS</span>
            <span className="text-[10px] text-brand-400">Tailwind CSS Navy Theme</span>
          </div>
        </div>
      </div>

      {/* Administrative Feedback Submission */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Administrative Notes &amp; System Feedback</h3>
        <p className="text-xs text-slate-400">
          Submit remarks, venue audit notes, or system improvement suggestions to the department tech lead.
        </p>

        <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Feedback Category</label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Security">Security &amp; Permissions</option>
                <option value="Scanner Station">Scanner Station Hardware</option>
                <option value="Venue Allocation">Venue &amp; Hall Logistics</option>
                <option value="Certificates">Certificate Template</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-slate-300 font-semibold">Comments / Observations</label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. APJ Hall door scanner Wi-Fi latency verified under 400ms..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Submit Administrative Note
          </button>
        </form>
      </div>
    </div>
  );
};
