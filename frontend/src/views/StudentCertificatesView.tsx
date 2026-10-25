import React, { useState, useEffect, useCallback } from 'react';
import { getMyCertificatesApi } from '../services/api';
import { BackendCertificate } from '../types';
import { Badge } from '../components/Badge';
import { ShieldCheckIcon, AlertIcon, RefreshIcon } from '../components/Icons';

interface StudentCertificatesViewProps {
  onRequireLogin?: () => void;
}

export const StudentCertificatesView: React.FC<StudentCertificatesViewProps> = ({ onRequireLogin }) => {
  const [certificates, setCertificates] = useState<BackendCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyCertificatesApi();
      setCertificates(res.certificates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch certificates.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handlePrintCertificate = (cert: BackendCertificate) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate of Participation - ${cert.title}</title>
          <style>
            body { font-family: 'Georgia', serif; text-align: center; padding: 40px; background: #fafafa; }
            .cert-box { border: 8px double #1e3a8a; padding: 40px; background: white; max-width: 800px; margin: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            h1 { color: #1e3a8a; font-size: 32px; margin-bottom: 5px; }
            h2 { color: #475569; font-weight: normal; margin-top: 0; font-size: 18px; }
            .recipient { font-size: 26px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #1e3a8a; display: inline-block; padding: 0 20px 5px; margin: 20px 0; }
            .desc { font-size: 16px; color: #334155; line-height: 1.6; max-width: 600px; margin: auto; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; font-size: 14px; color: #64748b; }
            .code { font-family: monospace; font-size: 12px; color: #94a3b8; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <h1>SMARTATTEND AI</h1>
            <h2>INSTITUTIONAL CERTIFICATE OF PARTICIPATION</h2>
            <p>This is to certify that</p>
            <div class="recipient">${cert.student?.full_name || 'Student Attendee'}</div>
            <p class="desc">
              has successfully registered, attended, and verified attendance via door QR scanning for
              <strong>"${cert.event?.title || cert.title}"</strong>.
            </p>
            <p style="margin-top: 15px; color: #059669; font-weight: bold;">Grade / Standing: ${cert.grade_or_score}</p>
            <div class="footer">
              <div>Date: ${new Date(cert.issued_at).toLocaleDateString()}</div>
              <div>Authorized Institutional Registrar</div>
            </div>
            <div class="code">Certificate Serial: ${cert.certificate_code} • Verified by SmartAttend AI DRF</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              My Available Certificates
            </h1>
            <Badge variant="primary" size="sm">LIVE CREDENTIALS</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Verified certificates awarded automatically upon door scanner check-in for campus workshops and seminars.
          </p>
        </div>

        <button
          onClick={fetchCertificates}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/60 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
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

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading your verified credentials...
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 mx-auto flex items-center justify-center">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Certificates Issued Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Certificates of completion are automatically generated and awarded to your student profile once your QR pass is verified at the gate entrance by event coordinators!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 border border-blue-900/40 p-6 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                      VERIFIED PARTICIPATION
                    </span>
                    <h3 className="text-base font-bold text-white mt-1 leading-snug">
                      {cert.title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/60 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-semibold text-white">{cert.student?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Student ID:</span>
                    <span className="font-mono text-cyan-400">{cert.student?.student_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Certificate ID:</span>
                    <span className="font-mono text-slate-400">{cert.certificate_code}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Issued On:</span>
                    <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Standing: {cert.grade_or_score}</span>
                </span>
                <button
                  onClick={() => handlePrintCertificate(cert)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-sm transition-all"
                >
                  Print / Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
