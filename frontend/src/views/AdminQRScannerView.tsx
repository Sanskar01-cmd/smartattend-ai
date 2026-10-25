import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { scanQrPassApi, getAdminRegistrationsApi } from '../services/api';
import { BackendRegistration } from '../types';
import { Badge } from '../components/Badge';
import {
  QrCodeIcon,
  ShieldCheckIcon,
  AlertIcon,
  CheckIcon,
  ClockIcon,
} from '../components/Icons';

interface ScanLogEntry {
  id: string;
  timestamp: string;
  token: string;
  status: 'Verified' | 'Duplicate_Attempt' | 'Invalid_Token';
  studentName?: string;
  studentId?: string;
  eventTitle?: string;
  message: string;
}

export const AdminQRScannerView: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [gateStation, setGateStation] = useState('Gate 1 Main Entrance');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: 'success' | 'duplicate' | 'error';
    message: string;
    studentName?: string;
    studentId?: string;
    eventTitle?: string;
  } | null>(null);

  const [sessionLogs, setSessionLogs] = useState<ScanLogEntry[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentPasses, setRecentPasses] = useState<BackendRegistration[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTokenRef = useRef<string | null>(null);

  // Audio feedback synthesizer using standard Web Audio API (Zero external assets needed)
  const playAudioFeedback = (type: 'success' | 'duplicate' | 'error') => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'duplicate') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(196, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // AudioContext blocked by user policy or uninitialized
    }
  };

  // Load sample passes so admin can test scanning with one click
  const refreshRecentPasses = () => {
    getAdminRegistrationsApi()
      .then((res) => setRecentPasses(res.registrations.slice(0, 6)))
      .catch(() => {});
  };

  useEffect(() => {
    refreshRecentPasses();
  }, []);

  const handleProcessScan = useCallback(
    async (passTokenToScan?: string) => {
      const token = (passTokenToScan || tokenInput).trim();
      if (!token) return;

      isScanningRef.current = true;
      setScanning(true);
      setLastResult(null);

      try {
        const res = await scanQrPassApi({
          pass_token: token,
          device_info: `${gateStation} Station`,
        });

        playAudioFeedback('success');

        const newEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          token,
          status: 'Verified',
          studentName: res.student?.name,
          studentId: res.student?.student_id,
          eventTitle: res.event?.title,
          message: res.message,
        };

        setSessionLogs((prev) => [newEntry, ...prev]);
        setLastResult({
          status: 'success',
          message: res.message,
          studentName: res.student?.name,
          studentId: res.student?.student_id,
          eventTitle: res.event?.title,
        });
        setTokenInput('');
        refreshRecentPasses();
      } catch (err: any) {
        const isDuplicate = err.status === 409 || err.message?.includes('DUPLICATE');
        const errorMsg = err.message || 'Scan failed.';

        playAudioFeedback(isDuplicate ? 'duplicate' : 'error');

        const newEntry: ScanLogEntry = {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          token,
          status: isDuplicate ? 'Duplicate_Attempt' : 'Invalid_Token',
          studentName: err.response?.student_name,
          studentId: err.response?.student_id,
          eventTitle: err.response?.event_title,
          message: errorMsg,
        };

        setSessionLogs((prev) => [newEntry, ...prev]);
        setLastResult({
          status: isDuplicate ? 'duplicate' : 'error',
          message: errorMsg,
          studentName: err.response?.student_name,
          studentId: err.response?.student_id,
          eventTitle: err.response?.event_title,
        });
      } finally {
        setScanning(false);
        isScanningRef.current = false;
      }
    },
    [gateStation, tokenInput]
  );

  // Live video frame processing loop using jsQR
  const tickScanner = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isScanningRef.current) {
          const rawToken = code.data.trim();
          // Debounce same QR pass within 3.5s cooldown
          if (rawToken && rawToken !== lastScannedTokenRef.current) {
            lastScannedTokenRef.current = rawToken;
            handleProcessScan(rawToken);
            setTimeout(() => {
              lastScannedTokenRef.current = null;
            }, 3500);
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tickScanner);
  }, [handleProcessScan]);

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
      setCameraActive(true);
      animFrameRef.current = requestAnimationFrame(tickScanner);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access could not be acquired.';
      setCameraError(`Camera Notice: ${msg}. You can test the scanner using manual token entry or quick-scan chips below.`);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gate QR Scanner Station
            </h1>
            <Badge variant="outline" size="sm">STRICTLY QR-ONLY</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Institutional door check-in scanner. Decodes 2D QR matrix tokens with sub-second latency and duplicate protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Anti-Passback Protection Active</span>
          </Badge>
        </div>
      </div>

      {/* Architectural Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-950 border border-blue-800 text-cyan-400 flex-shrink-0">
          <QrCodeIcon className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">Strictly QR-Code Verification Protocol</span>
          <p className="leading-relaxed">
            Per system constraints, this scanner solely decodes 2D QR codes to extract the cryptographic token.
            <strong> Biometric facial recognition and liveness detection are completely prohibited.</strong>
          </p>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport & Station Select (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {cameraActive ? 'Live Camera Feed & Matrix Decoder' : 'Scanning Viewport'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={gateStation}
                  onChange={(e) => setGateStation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                >
                  <option value="Gate 1 Main Entrance">Gate 1 Main Entrance</option>
                  <option value="Gate 2 APJ Hall Door">Gate 2 APJ Hall Door</option>
                  <option value="Gate 3 Innovation Hub">Gate 3 Innovation Hub</option>
                  <option value="Gate 4 Turing Auditorium">Gate 4 Turing Auditorium</option>
                </select>
              </div>
            </div>

            {/* Video Box or Camera Reticle */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Scanner Crosshair Reticle & Visual Scan Line */}
                  <div className="relative z-10 w-48 h-48 border-2 border-cyan-400/80 rounded-2xl shadow-glow-sm pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                      <span className="w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                    </div>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    <div className="flex justify-between">
                      <span className="w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                      <span className="w-3 h-3 border-b-2 border-r-2 border-cyan-300" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>DECODING LIVE FRAMES</span>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-rose-400 mx-auto flex items-center justify-center">
                    <QrCodeIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Camera Feed Standby</span>
                    <span className="text-[11px] text-slate-400">
                      Enable webcam scanner for automatic QR decoding, or scan passes below
                    </span>
                  </div>
                </div>
              )}

              {/* Viewport Control Buttons */}
              <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                {cameraActive ? (
                  <button
                    onClick={handleStopCamera}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold shadow-sm transition-colors"
                  >
                    Turn Off Camera
                  </button>
                ) : (
                  <button
                    onClick={handleStartCamera}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-sm transition-all"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    <span>Enable Webcam Scanner</span>
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-xs text-amber-300">
                {cameraError}
              </div>
            )}

            {/* Manual Token Input Box */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Direct Token Input / Handheld Barcode Scanner Feed
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessScan()}
                  placeholder="Paste or scan QR pass token (e.g. SA-PASS-A1B2C3D4E5F6)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleProcessScan()}
                  disabled={scanning || !tokenInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold shadow-glow-sm transition-all whitespace-nowrap flex items-center gap-2"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>{scanning ? 'Verifying...' : 'Verify Pass'}</span>
                </button>
              </div>
            </div>

            {/* Quick Testing Chips */}
            {recentPasses.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Click to Test Scan Issued Passes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentPasses.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProcessScan(p.pass_token)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300 transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-slate-400">{p.student?.student_id}:</span>
                      <span>{p.pass_token}</span>
                      {p.status === 'Attended' && (
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded">Checked In</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scan Result Feedback & Audit Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Result Card */}
          {lastResult && (
            <div
              className={`p-5 rounded-2xl border shadow-xl animate-fadeIn ${
                lastResult.status === 'success'
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                  : lastResult.status === 'duplicate'
                  ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                  : 'bg-amber-950/80 border-amber-800 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl flex-shrink-0 ${
                    lastResult.status === 'success'
                      ? 'bg-emerald-900 text-emerald-300'
                      : lastResult.status === 'duplicate'
                      ? 'bg-rose-900 text-rose-300'
                      : 'bg-amber-900 text-amber-300'
                  }`}
                >
                  {lastResult.status === 'success' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <AlertIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm">
                    {lastResult.status === 'success'
                      ? 'VERIFIED: ATTENDANCE CONFIRMED'
                      : lastResult.status === 'duplicate'
                      ? 'DUPLICATE SCAN BLOCKED'
                      : 'VERIFICATION FAILED'}
                  </div>
                  <p className="leading-relaxed">{lastResult.message}</p>

                  {lastResult.studentName && (
                    <div className="pt-2 border-t border-white/10 font-mono text-[11px] space-y-0.5">
                      <div>Student: <strong>{lastResult.studentName}</strong> ({lastResult.studentId})</div>
                      {lastResult.eventTitle && <div>Session: {lastResult.eventTitle}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Session Audit Stream */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-[420px] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Session Scan Log
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {sessionLogs.length} scans
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessionLogs.length === 0 ? (
                <div className="py-24 text-center text-slate-500 text-xs">
                  No passes scanned during this station session yet.
                </div>
              ) : (
                sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      log.status === 'Verified'
                        ? 'bg-slate-950/70 border-emerald-900/40 text-slate-200'
                        : log.status === 'Duplicate_Attempt'
                        ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px]">
                        {log.token}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 truncate">
                      {log.studentName ? `${log.studentName} (${log.studentId})` : log.message}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          log.status === 'Verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {log.status === 'Verified' ? 'VERIFIED' : 'DUPLICATE / INVALID'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
