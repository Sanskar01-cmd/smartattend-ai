import React from 'react';
import { QRPass } from '../types';
import { Badge } from './Badge';
import { ShieldCheckIcon, ClockIcon, MapPinIcon } from './Icons';

interface QRPassCardProps {
  pass: QRPass;
}

export const QRPassCard: React.FC<QRPassCardProps> = ({ pass }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-navy-950 border border-slate-800 hover:border-brand-500/50 shadow-xl transition-all duration-300">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

      <div className="p-5 sm:p-6">
        {/* Pass Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info" size="sm">{pass.category}</Badge>
              <Badge variant="demo" size="sm">DEMO PASS</Badge>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {pass.eventTitle}
            </h4>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Pass
            </span>
          </div>
        </div>

        {/* Central QR Code Simulation Box */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="relative p-3 bg-white rounded-lg shadow-inner">
            {/* High visual fidelity QR representation (Standard 2D QR Pattern) */}
            <svg
              className="w-36 h-36 text-slate-950"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner position detection patterns */}
              {/* Top-Left */}
              <rect x="5" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="13" y="13" width="12" height="12" fill="currentColor" />
              {/* Top-Right */}
              <rect x="67" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="75" y="13" width="12" height="12" fill="currentColor" />
              {/* Bottom-Left */}
              <rect x="5" y="67" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="13" y="75" width="12" height="12" fill="currentColor" />

              {/* Timing patterns & data cells */}
              <rect x="37" y="10" width="5" height="5" />
              <rect x="47" y="10" width="5" height="5" />
              <rect x="57" y="10" width="5" height="5" />
              <rect x="10" y="37" width="5" height="5" />
              <rect x="10" y="47" width="5" height="5" />
              <rect x="10" y="57" width="5" height="5" />
              <rect x="40" y="40" width="20" height="20" rx="3" fill="#2563eb" opacity="0.15" />
              <path d="M45 45h10v10H45z" fill="#2563eb" />
              <rect x="36" y="68" width="6" height="6" />
              <rect x="48" y="72" width="6" height="6" />
              <rect x="68" y="40" width="6" height="6" />
              <rect x="80" y="48" width="6" height="6" />
              <rect x="68" y="68" width="8" height="8" />
              <rect x="82" y="78" width="6" height="6" />
            </svg>
          </div>

          <p className="mt-3 text-xs font-mono text-cyan-400 font-semibold tracking-wider">
            {pass.passToken}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Present this QR at the venue entrance scanner
          </p>
        </div>

        {/* Attendee & Session Information Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-800/40 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Student Name</span>
            <span className="font-semibold text-slate-100">{pass.studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Roll / Student ID</span>
            <span className="font-mono font-medium text-slate-200">{pass.studentId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Date & Time</span>
            <div className="flex items-center gap-1 text-slate-200">
              <ClockIcon className="w-3 h-3 text-brand-400" />
              <span>{pass.eventDate}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Venue / Hall</span>
            <div className="flex items-center gap-1 text-slate-200 truncate">
              <MapPinIcon className="w-3 h-3 text-cyan-400" />
              <span className="truncate">{pass.venue}</span>
            </div>
          </div>
        </div>

        {/* Security / QR-Only Enforcement Notice */}
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-300">
          <ShieldCheckIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>QR-Only Verification:</strong> No biometric or facial recognition required. Token validated by organizer device.
          </span>
        </div>
      </div>
    </div>
  );
};
