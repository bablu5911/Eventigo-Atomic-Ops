import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import toast from 'react-hot-toast';
import ScannerMetricsBar from '../components/ScannerMetricsBar';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ShieldAlert,
  User,
  Calendar,
  Ticket,
  ArrowLeft,
  Volume2,
  Sparkles,
  Clock,
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

/**
 * Web Audio API synthesizer for instant auditory and haptic door feedback.
 * Works 100% offline with zero external audio assets.
 */
function playSoundFeedback(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (type === 'valid') {
      // Ascending pleasant chime: 880Hz (A5) -> 1320Hz (E6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);

      if (navigator.vibrate) {
        navigator.vibrate(120);
      }
    } else {
      // Dual low-pitch sawtooth buzz (180Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.22);

      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(150, ctx.currentTime);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          gain2.gain.setValueAtTime(0.35, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.22);
        } catch (e) {}
      }, 130);

      if (navigator.vibrate) {
        navigator.vibrate([100, 60, 100]);
      }
    }
  } catch (err) {
    console.warn('Web Audio playback error:', err);
  }
}

export default function DoorScannerPage() {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  // State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(paramEventId || '');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerRunning, setScannerRunning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [gateLockdown, setGateLockdown] = useState({ active: false, reason: '' });
  const [refreshMetricsTrigger, setRefreshMetricsTrigger] = useState(0);

  // Verification result modal state
  // null | { type: 'VALID' | 'ALREADY_USED' | 'INVALID', data?: object, message?: string, code: string }
  const [scanResult, setScanResult] = useState(null);
  const [autoResumeTimer, setAutoResumeTimer] = useState(3);
  const [recentScans, setRecentScans] = useState([]);

  // Refs
  const scannerRef = useRef(null);
  const isLockedRef = useRef(false);
  const timerIntervalRef = useRef(null);

  // 1. Fetch Events & Super Admin Lockdown Status
  useEffect(() => {
    fetchEvents();
    fetchGateStatus();
    const lockdownInterval = setInterval(fetchGateStatus, 8000);
    return () => clearInterval(lockdownInterval);
  }, []);

  const fetchGateStatus = async () => {
    try {
      const res = await api.get('/bookings/gate-status');
      if (res.data?.success && res.data.lockdown) {
        setGateLockdown(res.data.lockdown);
      }
    } catch (err) {
      // silent fallback
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?limit=50');
      const list = res.data?.events || [];
      setEvents(list);

      if (paramEventId) {
        const found = list.find((e) => (e.eventId || e._id) === paramEventId);
        if (found) {
          setSelectedEventId(found._id);
          setSelectedEventTitle(found.title);
        }
      } else if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(list[0]._id);
        setSelectedEventTitle(list[0].title);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Could not load active events for door check-in');
    }
  };

  // 2. Discover Cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera
          const backCam = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          toast.error('No video cameras found on this device');
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error:', err);
      });
  }, []);

  // 3. Start / Stop Camera Scanner
  const startScanner = useCallback(async () => {
    if (scannerRunning || !selectedCameraId) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('door-camera-viewport');
      }

      await scannerRef.current.start(
        selectedCameraId,
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        (err) => {
          // ignore background frame read misses
        }
      );

      setScannerRunning(true);

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorchSupport(true);
        }
      } catch (e) {
        setHasTorchSupport(false);
      }
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      setScannerRunning(false);
    }
  }, [selectedCameraId, scannerRunning, selectedEventId]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRunning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      setScannerRunning(false);
      setTorchOn(false);
    }
  }, [scannerRunning]);

  // Launch scanner once camera is ready and event selected
  useEffect(() => {
    if (selectedCameraId && !scannerRunning && !scanResult) {
      startScanner();
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [selectedCameraId]);

  // 4. Torch Toggle
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorchSupport) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (err) {
      toast.error('Torch could not be toggled on this camera');
    }
  };

  // 5. Verification Logic with Lockout Guard
  const handleDetectedCode = async (rawCode) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    // Clean up code in case of full JSON payload or URL
    let cleanCode = rawCode.trim();
    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = parsed.passCode || parsed.bookingCode || parsed.code || cleanCode;
      } catch (e) {
        // use raw string
      }
    }

    await performVerification(cleanCode);
  };

  const performVerification = async (codeToVerify) => {
    if (!selectedEventId) {
      toast.error('Please select an active event gate first.');
      isLockedRef.current = false;
      return;
    }

    setIsVerifying(true);

    try {
      const res = await api.post('/bookings/verify', {
        code: codeToVerify,
        eventId: selectedEventId
      });

      const data = res.data;
      if (data.status === 'VALID') {
        playSoundFeedback('valid');
        setRefreshMetricsTrigger((prev) => prev + 1);
        setScanResult({
          type: 'VALID',
          data,
          code: codeToVerify
        });
        appendRecentScan({
          code: codeToVerify,
          status: 'VALID',
          attendee: data.attendee?.name || 'Attendee',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      } else if (data.status === 'ALREADY_USED') {
        playSoundFeedback('error');
        setScanResult({
          type: 'ALREADY_USED',
          data,
          code: codeToVerify
        });
        appendRecentScan({
          code: codeToVerify,
          status: 'ALREADY_USED',
          attendee: data.attendee?.name || 'Attendee',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    } catch (err) {
      playSoundFeedback('error');
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'INVALID_TICKET: No confirmed booking found.';

      setScanResult({
        type: 'INVALID',
        message: errMsg,
        code: codeToVerify
      });

      appendRecentScan({
        code: codeToVerify,
        status: 'INVALID',
        attendee: 'Rejected / Fake',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } finally {
      setIsVerifying(false);
      startAutoResumeCountdown();
    }
  };

  const appendRecentScan = (scanItem) => {
    setRecentScans((prev) => [scanItem, ...prev.slice(0, 9)]);
  };

  // 6. Auto-Resume Countdown Timer
  const startAutoResumeCountdown = () => {
    setAutoResumeTimer(3);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setAutoResumeTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleDismissModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDismissModal = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setScanResult(null);
    setAutoResumeTimer(3);
    // Cool down 300ms then re-arm lockout guard
    setTimeout(() => {
      isLockedRef.current = false;
    }, 300);
  };

  // 7. Manual Code Search Submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim() || isLockedRef.current) return;
    isLockedRef.current = true;
    performVerification(manualCode.trim());
    setManualCode('');
  };

  // Keyboard shortcut: Spacebar dismisses modal and scans next
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && scanResult) {
        e.preventDefault();
        handleDismissModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanResult]);

  return (
    <div className="min-h-screen pb-16 font-helvetica-neue">
      {/* Top Header Bar */}
      <div className="bg-brand-cream border-b border-brand-dark/10 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/organizer"
              className="p-2 rounded-xl bg-white border border-brand-dark/10 hover:bg-brand-cream transition-colors text-brand-dark"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
                <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark tracking-tight">
                  Door Entry QR Scanner
                </h1>
              </div>
              <p className="text-xs text-brand-dark/60 font-medium">
                Live attendance verification &amp; turnstile check-in
              </p>
            </div>
          </div>

          {/* Active Event Selector */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-brand-green shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => {
                const found = events.find((ev) => ev._id === e.target.value);
                setSelectedEventId(e.target.value);
                setSelectedEventTitle(found ? found.title : '');
                toast.success('Gate bound to ' + (found?.title || 'selected event'));
              }}
              className="bg-white border border-brand-dark/15 rounded-xl px-3 py-2 text-xs font-semibold text-brand-dark focus:outline-none focus:border-brand-green w-full sm:w-72 shadow-2xs"
            >
              <option value="">Select Event Gate...</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Lockdown Warning Banner */}
      {gateLockdown.active && (
        <div className="bg-rose-600 text-white px-4 py-3 shadow-md animate-pulse">
          <div className="max-w-6xl mx-auto flex items-center justify-center space-x-3 text-center">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              EMERGENCY VENUE LOCKDOWN ACTIVE: All entry turnstiles frozen by Super Admin.{' '}
              {gateLockdown.reason && <span className="opacity-90">({gateLockdown.reason})</span>}
            </span>
          </div>
        </div>
      )}

      {/* Live Scanner Telemetry & Team Roster */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6">
        <ScannerMetricsBar eventId={selectedEventId} refreshTrigger={refreshMetricsTrigger} />
      </div>

      {/* Main Scanner Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-brand-dark/10 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Viewport & Targeting Box */}
            <div className="relative w-full aspect-square max-h-[460px] mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-brand-dark/20 shadow-inner">
              <div id="door-camera-viewport" className="w-full h-full object-cover" />

              {/* Targeting Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-brand-green/80 rounded-3xl relative shadow-[0_0_20px_rgba(45,150,90,0.3)]">
                  {/* Glowing corners */}
                  <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-green rounded-tl-xl" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-green rounded-tr-xl" />
                  <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-green rounded-bl-xl" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-green rounded-br-xl" />
                  {/* Laser scan line animation */}
                  <div className="w-full h-0.5 bg-brand-green/90 shadow-[0_0_12px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {/* Audio feedback badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-mono flex items-center space-x-1.5 border border-white/10">
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span>Audio Synth Active</span>
              </div>

              {/* Status indicator on camera */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono flex items-center space-x-1.5 border border-white/10">
                <span
                  className={'w-2 h-2 rounded-full ' + (scannerRunning ? 'bg-emerald-400 animate-ping' : 'bg-rose-400')}
                />
                <span className="text-white/90">{scannerRunning ? 'LIVE' : 'STANDBY'}</span>
              </div>
            </div>

            {/* Camera Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-brand-green" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="bg-brand-cream border border-brand-dark/10 rounded-xl px-3 py-1.5 text-xs text-brand-dark font-medium focus:outline-none"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || 'Camera ' + (idx + 1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                {hasTorchSupport && (
                  <button
                    onClick={toggleTorch}
                    className={
                      'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ' +
                      (torchOn
                        ? 'bg-amber-400 text-brand-dark border-amber-500'
                        : 'bg-brand-cream text-brand-dark border-brand-dark/10 hover:bg-brand-light')
                    }
                  >
                    {torchOn ? <FlashlightOff className="w-3.5 h-3.5" /> : <Flashlight className="w-3.5 h-3.5" />}
                    <span>{torchOn ? 'Torch Off' : 'Torch On'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    stopScanner().then(() => startScanner());
                    toast.success('Scanner reset');
                  }}
                  className="p-2 rounded-xl bg-brand-cream hover:bg-brand-light border border-brand-dark/10 text-brand-dark transition-colors"
                  title="Reload Camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Manual Code Fallback Input */}
          <div className="bg-white border border-brand-dark/10 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-brand-green" />
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">
                Manual Code Entry
              </h3>
            </div>
            <p className="text-xs text-brand-dark/60 font-medium">
              If phone screen is cracked or dim, manually type the booking code below:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ATOM-2026-XXXX or BK-..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-sm font-mono text-brand-dark uppercase placeholder:normal-case placeholder-brand-dark/40 focus:outline-none focus:border-brand-green"
              />
              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-brand-cream rounded-2xl text-xs font-bold uppercase transition-colors disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Instructions & Audit Trail */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Gate Context Badge */}
          <div className="bg-white border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-green flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Turnstile Gate Ready
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-brand-cream border border-brand-dark/10 text-brand-dark">
                Port 5000 API
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark leading-snug">
                {selectedEventTitle || 'No Event Selected'}
              </h2>
              <p className="text-xs text-brand-dark/60 mt-1">
                Point phone camera 4–8 inches away from attendee mobile QR pass.
              </p>
            </div>

            <div className="pt-3 border-t border-brand-dark/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10">
                <p className="text-xl font-black text-brand-dark">
                  {recentScans.filter((s) => s.status === 'VALID').length}
                </p>
                <p className="text-[10px] uppercase font-bold text-brand-green tracking-wider mt-0.5">
                  Admitted
                </p>
              </div>
              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10">
                <p className="text-xl font-black text-rose-700">
                  {recentScans.filter((s) => s.status !== 'VALID').length}
                </p>
                <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider mt-0.5">
                  Denied / Dupes
                </p>
              </div>
            </div>
          </div>

          {/* Recent Scans Session Log */}
          <div className="bg-white border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-green" />
                <span>Recent Scans</span>
              </h3>
              <span className="text-xs font-mono text-brand-dark/50">Last {recentScans.length}</span>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-dark/50 font-medium">
                Ready for first scan. Point camera at an attendee ticket.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-brand-cream border border-brand-dark/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-brand-dark block">
                        {scan.code}
                      </span>
                      <span className="text-brand-dark/60 text-[11px] block">{scan.attendee}</span>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={
                          'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' +
                          (scan.status === 'VALID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scan.status === 'ALREADY_USED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800')
                        }
                      >
                        {scan.status}
                      </span>
                      <span className="text-[10px] text-brand-dark/50 font-mono block">{scan.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. Full-Screen Status Overlay Modal */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
          <div
            className={
              'relative w-full max-w-lg rounded-3xl p-7 text-center shadow-2xl border-4 transition-transform duration-200 animate-scale-up ' +
              (scanResult.type === 'VALID'
                ? 'bg-emerald-50/95 border-emerald-500 text-emerald-950'
                : scanResult.type === 'ALREADY_USED'
                ? 'bg-amber-50/95 border-amber-500 text-amber-950'
                : 'bg-rose-50/95 border-rose-500 text-rose-950')
            }
          >
            {/* Status Icon */}
            <div className="mb-4 flex justify-center">
              {scanResult.type === 'VALID' && (
                <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce-short">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              )}
              {scanResult.type === 'ALREADY_USED' && (
                <div className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <AlertTriangle className="w-12 h-12" />
                </div>
              )}
              {scanResult.type === 'INVALID' && (
                <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-shake">
                  <XCircle className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Status Headline */}
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {scanResult.type === 'VALID' && 'ACCESS GRANTED'}
              {scanResult.type === 'ALREADY_USED' && 'ACCESS DENIED: ALREADY SCANNED'}
              {scanResult.type === 'INVALID' && 'INVALID / FAKE TICKET'}
            </h2>

            <p className="text-sm font-medium mt-1 opacity-80">
              {scanResult.type === 'VALID' && 'Ticket verified atomically. Welcome to the event!'}
              {scanResult.type === 'ALREADY_USED' &&
                'This ticket has already been used for entry. Re-entry requires supervisor approval.'}
              {scanResult.type === 'INVALID' && (scanResult.message || 'Counterfeit or unconfirmed ticket.')}
            </p>

            {/* Details Card */}
            <div className="my-5 p-4 rounded-2xl bg-white/90 border border-current/15 text-left text-xs space-y-2 text-brand-dark shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-brand-dark/10">
                <span className="font-mono text-brand-dark/60 uppercase text-[10px]">Booking Code</span>
                <span className="font-mono font-bold text-sm text-brand-dark">{scanResult.code}</span>
              </div>

              {scanResult.data?.attendee && (
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/60">Attendee</span>
                  <span className="font-bold text-brand-dark">
                    {scanResult.data.attendee.name} ({scanResult.data.attendee.email})
                  </span>
                </div>
              )}

              {scanResult.type === 'VALID' && scanResult.data?.totalTickets && (
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/60">Total Tickets</span>
                  <span className="font-bold text-emerald-700">
                    {scanResult.data.totalTickets} Ticket Pass
                  </span>
                </div>
              )}

              {scanResult.data?.scannedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/60">
                    {scanResult.type === 'VALID' ? 'Admitted At' : 'Previous Scan'}
                  </span>
                  <span className="font-mono text-brand-dark">
                    {new Date(scanResult.data.scannedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Auto-Resume Progress Bar */}
            <div className="w-full bg-current/15 rounded-full h-1.5 overflow-hidden mb-4">
              <div
                className="bg-current h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(autoResumeTimer / 3) * 100}%` }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDismissModal}
                className={
                  'w-full sm:w-auto px-7 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all ' +
                  (scanResult.type === 'VALID'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : scanResult.type === 'ALREADY_USED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700')
                }
              >
                Scan Next Pass (Spacebar)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
