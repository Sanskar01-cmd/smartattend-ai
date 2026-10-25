import React from 'react';
import { ShieldCheckIcon, LogoIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-navy-950/70 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">
            SmartAttend AI — College Event and Workshop Attendance Management System
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>QR-Only Verification Protocol</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>React + Vite + Django + MySQL</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-cyan-400">Capstone Step 1/5</span>
        </div>
      </div>
    </footer>
  );
};
