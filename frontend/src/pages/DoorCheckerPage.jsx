import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import QRScannerModal from '../components/QRScannerModal';
import {
  QrCode,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  Ticket,
  MapPin,
  Building2,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  LogOut,
  Gift,
  Tag
} from 'lucide-react';

export default function DoorCheckerPage() {
  const [checkerMode, setCheckerMode] = useState('entry'); // 'entry' | 'early_exit'
  const [bookingCode, setBookingCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [earlyExitResult, setEarlyExitResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [admitCount, setAdmitCount] = useState(1);
  const [admitAll, setAdmitAll] = useState(true);
  const [exitCount, setExitCount] = useState(1);
  const [minutesEarly, setMinutesEarly] = useState(25);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?limit=50');
      if (res.data.success && res.data.events?.length > 0) {
        setEventsList(res.data.events);
        // Default to first event or keep empty
        setSelectedEventId(res.data.events[0].eventId || res.data.events[0]._id);
      }
    } catch (err) {
      console.error('Failed to load events for door checker', err);
    }
  };

  const handleVerifyCode = async (codeToVerify, explicitAdmitCount) => {
    const targetCode = (codeToVerify || bookingCode).trim();
    if (!targetCode) {
      toast.error('Please enter a valid booking code');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const payload = {
        bookingCode: targetCode,
        eventId: selectedEventId || undefined
      };

      if (explicitAdmitCount !== undefined) {
        payload.admitCount = explicitAdmitCount;
      } else if (!admitAll && admitCount > 0) {
        payload.admitCount = admitCount;
      }

      const res = await api.post(`/bookings/verify-code`, payload);
      if (res.data.success) {
        const verifiedData = res.data.result || res.data.booking;
        setVerificationResult(verifiedData);
        if (!verifiedData.valid) {
          toast.error(verifiedData.error || 'Venue mismatch: Ticket denied');
        } else if (verifiedData.alreadyAttended) {
          toast.error(verifiedData.error || 'Ticket pass was ALREADY verified at entry');
        } else if (verifiedData.remainingTickets > 0) {
          toast.success(
            `Admitted ${verifiedData.admittedNow || 1} guest(s)! ${verifiedData.remainingTickets} ticket(s) remaining.`
          );
        } else {
          toast.success('Ticket Pass Validated & Entry Approved!');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid or non-existent booking code';
      setVerificationResult({
        valid: false,
        error: errorMsg
      });
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleProcessEarlyExit = async (codeToProcess) => {
    const targetCode = (codeToProcess || bookingCode).trim();
    if (!targetCode) {
      toast.error('Please enter a ticket code for early exit');
      return;
    }

    setVerifying(true);
    setEarlyExitResult(null);

    try {
      const payload = {
        bookingCode: targetCode,
        eventId: selectedEventId || undefined,
        exitCount: Number(exitCount) || 1,
        minutesEarly: Number(minutesEarly) || 25
      };

      const res = await api.post(`/bookings/early-exit`, payload);
      if (res.data.success && res.data.result?.valid !== false) {
        setEarlyExitResult(res.data.result);
        toast.success(`🎉 Early Exit Logged! ${res.data.result.discountPercent}% Reward Coupon Issued!`, {
          duration: 5000
        });
      } else {
        const errorMsg = res.data.result?.error || 'Early exit processing rejected';
        setEarlyExitResult({ valid: false, error: errorMsg });
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to process early exit';
      setEarlyExitResult({ valid: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleScanSuccess = (scannedCode) => {
    let cleanCode = scannedCode;
    try {
      const parsed = typeof scannedCode === 'string' ? JSON.parse(scannedCode) : scannedCode;
      cleanCode = parsed.passCode || parsed.bookingCode || scannedCode;
    } catch (e) {
      cleanCode = scannedCode;
    }
    setBookingCode(cleanCode);
    setScannerOpen(false);
    if (checkerMode === 'early_exit') {
      handleProcessEarlyExit(cleanCode);
    } else {
      handleVerifyCode(cleanCode);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 px-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-dark/10 pb-6 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-mono font-bold uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Gate Staff Operations Panel</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-dark uppercase tracking-tight">Door Ticket Checker</h1>
          <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
            Scan attendee QR code passes or verify booking codes for instant venue access
          </p>
        </div>

        <button
          onClick={() => setScannerOpen(true)}
          className="px-6 py-3 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors flex items-center space-x-2 text-sm uppercase tracking-wide shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          <span>Launch Camera Scanner</span>
        </button>
      </div>

      {/* Operation Mode Selector: Gate Entry vs Early Exit Crowd Control */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-brand-cream border border-brand-dark/15 rounded-3xl font-mono text-xs shadow-sm">
        <button
          type="button"
          onClick={() => {
            setCheckerMode('entry');
            setVerificationResult(null);
            setEarlyExitResult(null);
          }}
          className={`py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${
            checkerMode === 'entry'
              ? 'bg-brand-dark text-white shadow-md'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-white/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Gate Entry Check-In (Arrivals)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCheckerMode('early_exit');
            setVerificationResult(null);
            setEarlyExitResult(null);
          }}
          className={`py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${
            checkerMode === 'early_exit'
              ? 'bg-amber-900 text-white shadow-md'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Early Exit Crowd Control (Rewards)</span>
        </button>
      </div>

      {/* Active Gate & Event Context Selector */}
      <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-dark">
              <Building2 className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-dark uppercase tracking-tight">Active Venue Gate Door</h2>
              <p className="text-[11px] text-brand-dark/60 font-mono">
                Only tickets issued for the selected event will be granted access
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto min-w-[280px]">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/20 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-dark"
            >
              <option value="">🌐 All Events / Master Scanner</option>
              {eventsList.map((evt) => (
                <option key={evt._id} value={evt.eventId || evt._id}>
                  {evt.eventId ? `[${evt.eventId}] ` : ''}{evt.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEventId && (
          <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-2xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-brand-green">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold">Active Enforcement Gate:</span>
              <span className="text-brand-dark font-sans font-semibold">
                {eventsList.find((e) => (e.eventId || e._id) === selectedEventId)?.title || selectedEventId}
              </span>
            </div>
            <span className="bg-brand-green text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
              Strict Mode
            </span>
          </div>
        )}
      </div>

      {/* MODE 1: Gate Entry Verification Input */}
      {checkerMode === 'entry' && (
        <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-brand-dark uppercase tracking-tight">Manual Booking Code Entry</h2>
              <p className="text-xs font-mono text-brand-dark/60">
                Enter master booking pass code or individual friend pass ID
              </p>
            </div>

            {/* Group Admission Mode Control */}
            <div className="flex items-center space-x-3 bg-brand-cream border border-brand-dark/15 px-4 py-2.5 rounded-2xl text-xs font-mono">
              <Users className="w-4 h-4 text-brand-green" />
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={admitAll}
                  onChange={(e) => setAdmitAll(e.target.checked)}
                  className="rounded text-brand-green focus:ring-brand-green accent-brand-green"
                />
                <span className="font-bold text-brand-dark">Admit All Present</span>
              </label>
              {!admitAll && (
                <div className="flex items-center space-x-2 pl-3 border-l border-brand-dark/15">
                  <span className="text-brand-dark/70 font-semibold">Qty:</span>
                  <button
                    type="button"
                    onClick={() => setAdmitCount(Math.max(1, admitCount - 1))}
                    className="w-6 h-6 bg-brand-dark/10 hover:bg-brand-dark/20 rounded-md flex items-center justify-center font-bold text-brand-dark transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold w-5 text-center text-brand-dark">{admitCount}</span>
                  <button
                    type="button"
                    onClick={() => setAdmitCount(admitCount + 1)}
                    className="w-6 h-6 bg-brand-dark/10 hover:bg-brand-dark/20 rounded-md flex items-center justify-center font-bold text-brand-dark transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-brand-dark/40 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="e.g. ATOM-2026-NEON-X8K9 or ATOM-2026-NEON-X8K9-1"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl pl-12 pr-4 py-3 text-lg font-mono font-bold text-brand-dark uppercase placeholder-brand-dark/30 focus:outline-none focus:border-brand-dark/50"
              />
            </div>

            <button
              onClick={() => handleVerifyCode()}
              disabled={verifying || !bookingCode.trim()}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-green hover:bg-brand-dark text-white font-bold rounded-2xl transition-colors flex items-center justify-center space-x-2 text-sm uppercase tracking-wide disabled:opacity-50"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Verify Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: Early Exit Crowd Control Input */}
      {checkerMode === 'early_exit' && (
        <div className="bg-amber-50/70 border border-amber-300 p-8 rounded-3xl space-y-6 shadow-sm animate-fade-in">
          <div className="flex items-start space-x-3 border-b border-amber-200 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-800 text-amber-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Exit Crowd Management Protocol
                </span>
                <span className="text-amber-900 font-mono text-xs font-bold">Window: Last 30 Mins</span>
              </div>
              <h2 className="text-xl font-bold text-amber-950 uppercase tracking-tight mt-1">
                Early Departure Reward Scanner
              </h2>
              <p className="text-xs font-mono text-amber-800 mt-0.5">
                Attendees exiting early receive an exclusive next-booking discount coupon credited directly to their user ID (10%–30% off, valid for up to the number of attendees leaving now).
              </p>
            </div>
          </div>

          {/* Configuration Controls: Exit Count & Minutes Early */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            {/* Number of People Exiting */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-950 uppercase">Guests Exiting Now:</span>
                <div className="flex items-center space-x-2 bg-brand-cream px-3 py-1 rounded-xl border border-brand-dark/10">
                  <button
                    type="button"
                    onClick={() => setExitCount(Math.max(1, exitCount - 1))}
                    className="w-6 h-6 bg-brand-dark/10 hover:bg-brand-dark/20 rounded flex items-center justify-center font-bold text-brand-dark"
                  >
                    -
                  </button>
                  <span className="font-bold text-brand-dark text-sm w-4 text-center">{exitCount}</span>
                  <button
                    type="button"
                    onClick={() => setExitCount(exitCount + 1)}
                    className="w-6 h-6 bg-brand-dark/10 hover:bg-brand-dark/20 rounded flex items-center justify-center font-bold text-brand-dark"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-amber-700">
                Reward coupon will be capped for up to {exitCount} ticket(s) next time.
              </p>
            </div>

            {/* Minutes Early Preset Selection */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-950 uppercase">Minutes Before Close:</span>
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                  {minutesEarly}m Early ({Math.min(30, Math.max(10, minutesEarly))}% Off)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 20, 25, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setMinutesEarly(mins)}
                    className={`py-1 rounded-lg text-center font-bold transition-colors ${
                      minutesEarly === mins
                        ? 'bg-amber-900 text-white'
                        : 'bg-brand-cream text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {mins}m ({mins}%)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pass Scan / Input */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-amber-700/50 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Scan or Enter Pass Code (e.g. ATOM-2026-NEON-X8K9)"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleProcessEarlyExit()}
                className="w-full bg-white border border-amber-300 rounded-2xl pl-12 pr-4 py-3 text-lg font-mono font-bold text-amber-950 uppercase placeholder-amber-700/40 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => handleProcessEarlyExit()}
              disabled={verifying || !bookingCode.trim()}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-2xl transition-colors flex items-center justify-center space-x-2 text-sm uppercase tracking-wide disabled:opacity-50 shadow-sm"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Gift className="w-4 h-4 text-amber-300" />
              )}
              <span>Log Exit & Issue Reward</span>
            </button>
          </div>
        </div>
      )}

      {/* Early Exit Result Display (When in Early Exit Mode) */}
      {checkerMode === 'early_exit' && earlyExitResult && (
        <div className="animate-fade-up">
          {earlyExitResult.valid ? (
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 shadow-md space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 block">
                    🎉 EARLY EXIT CROWD REWARD GENERATED
                  </span>
                  <h3 className="text-2xl font-bold text-amber-950 font-helvetica-neue">
                    {earlyExitResult.eventTitle}
                  </h3>
                </div>
              </div>

              {/* Coupon Highlight Box */}
              <div className="p-5 bg-amber-100/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-widest block">
                    Exclusive Crowd Dispersal Coupon
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-2xl font-bold text-amber-950 tracking-wider">
                      {earlyExitResult.couponCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {earlyExitResult.discountPercent}% OFF
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(earlyExitResult.couponCode);
                    toast.success(`Coupon code ${earlyExitResult.couponCode} copied!`);
                  }}
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-xl flex items-center space-x-2 uppercase transition-colors shadow-sm"
                >
                  <Tag className="w-4 h-4" />
                  <span>Copy Coupon Code</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-amber-200 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-amber-800/70 block">Exited Guests</span>
                  <span className="font-bold text-sm text-amber-950 block">
                    {earlyExitResult.exitCount} Attendee(s)
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-amber-800/70 block">Departure Window</span>
                  <span className="font-bold text-sm text-amber-950 block">
                    {earlyExitResult.minutesEarly} Mins Early
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-amber-800/70 block">Reward Capacity</span>
                  <span className="font-bold text-sm text-emerald-800 block">
                    Up to {earlyExitResult.maxTicketsApplicable} Ticket(s)
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-amber-800/70 block">Credited Account</span>
                  <span className="font-bold text-sm text-amber-950 block truncate">
                    {earlyExitResult.userEmail || earlyExitResult.userName}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-mono text-amber-800">
                💡 <strong>Single-Use Policy:</strong> When the attendee books another event, this coupon will discount up to {earlyExitResult.maxTicketsApplicable} ticket(s) in their cart. The coupon will be fully consumed in one redemption.
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-300 p-8 rounded-3xl space-y-4 text-center shadow-sm animate-fade-in">
              <div className="w-14 h-14 bg-rose-200 text-rose-800 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 block">
                  CROWD CONTROL ALERT
                </span>
                <h3 className="text-2xl font-bold text-rose-950">EARLY EXIT REJECTED</h3>
              </div>
              <p className="text-sm font-mono font-semibold text-rose-900 max-w-lg mx-auto bg-rose-100/70 p-3 rounded-2xl border border-rose-200">
                {earlyExitResult.error || 'Failed to process early exit.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verification Result Display (When in Entry Mode) */}
      {checkerMode === 'entry' && verificationResult && (
        <div className="animate-fade-up">
          {verificationResult.valid ? (
            <div
              className={`p-8 rounded-3xl border ${
                verificationResult.alreadyAttended
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              } space-y-6 shadow-sm`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    verificationResult.alreadyAttended
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider block">
                    {verificationResult.alreadyAttended
                      ? '⚠️ ALREADY CHECKED IN (ENTRY DENIED)'
                      : verificationResult.remainingTickets > 0
                      ? `⚡ PARTIAL GROUP ENTRY (${verificationResult.admittedNow || 1} ADMITTED • ${verificationResult.remainingTickets} REMAINING)`
                      : '✅ ENTRY APPROVED (FULL GROUP ADMITTED)'}
                  </span>
                  <h3 className="text-2xl font-bold font-helvetica-neue">{verificationResult.eventTitle}</h3>
                </div>
              </div>

              {/* Real-time Group Admission Status Banner */}
              {verificationResult.remainingTickets > 0 && !verificationResult.alreadyAttended && (
                <div className="bg-amber-100/80 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950 text-sm block">
                        Split Group Arrival: {verificationResult.remainingTickets} Guest(s) Still Awaiting Entry
                      </span>
                      <p className="text-xs text-amber-800 font-mono mt-0.5">
                        {verificationResult.admittedNow || 1} person entered now. When their friends stuck in traffic arrive, they can scan the master pass again or use their individual sub-pass.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerifyCode(verificationResult.masterCode || verificationResult.bookingCode, 1)}
                    disabled={verifying}
                    className="px-4 py-2.5 bg-amber-900 hover:bg-brand-dark text-white text-xs font-mono font-bold rounded-xl flex items-center space-x-2 uppercase transition-colors shrink-0 shadow-sm disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Admit Next Arrived Guest (1)</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-brand-dark/10 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-brand-dark/60 block">Attendee Name</span>
                  <div className="flex items-center space-x-1.5 font-bold text-sm text-brand-dark">
                    <User className="w-4 h-4 text-brand-green" />
                    <span className="truncate">{verificationResult.userName || 'Attendee'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-brand-dark/60 block">
                    {verificationResult.isIndividualTicket ? 'Individual Sub-Pass' : 'Master Booking Pass'}
                  </span>
                  <div className="flex items-center space-x-1.5 font-bold text-sm text-brand-dark">
                    <Ticket className="w-4 h-4 text-brand-green" />
                    <span className="truncate">{verificationResult.bookingCode}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-brand-dark/60 block">Gate Allocation</span>
                  <div className="flex items-center space-x-1.5 font-bold text-sm text-brand-dark">
                    <Building2 className="w-4 h-4 text-brand-green" />
                    <span className="truncate">{verificationResult.gateEntry || 'Gate A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-brand-dark/60 block">Group Headcount</span>
                  <div className="flex items-center space-x-1.5 font-bold text-sm text-brand-dark">
                    <Users className="w-4 h-4 text-brand-green" />
                    <span>
                      {verificationResult.checkedInCount ?? 1} / {verificationResult.totalTickets ?? 1} In
                      {verificationResult.remainingTickets > 0 && (
                        <span className="text-amber-700 ml-1 text-xs">({verificationResult.remainingTickets} left)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual Guest Passes Status */}
              {verificationResult.individualTickets && verificationResult.individualTickets.length > 0 && (
                <div className="bg-white/80 p-5 rounded-2xl border border-brand-dark/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-dark uppercase tracking-wider block">
                      Individual Sub-Pass Roster
                    </span>
                    <span className="text-[11px] font-mono text-brand-dark/60">
                      {verificationResult.checkedInCount} of {verificationResult.totalTickets} admitted
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {verificationResult.individualTickets.map((st, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                          st.status === 'used'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-brand-cream border-brand-dark/10 text-brand-dark'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold">Pass #{st.ticketIndex}:</span>
                          <span className="truncate font-semibold">{st.ticketCode}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                            st.status === 'used'
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-brand-dark/10 text-brand-dark/80'
                          }`}
                        >
                          {st.status === 'used' ? 'Admitted' : 'Valid (Waiting)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket Breakdown */}
              {verificationResult.ticketBreakdown && (
                <div className="bg-white/80 p-4 rounded-2xl border border-brand-dark/10 space-y-2">
                  <span className="text-xs font-mono font-bold text-brand-dark uppercase block">
                    Ticket Pass Tier Summary
                  </span>
                  {verificationResult.ticketBreakdown.map((t, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-mono text-brand-dark">
                      <span>{t.nameSnapshot}</span>
                      <span className="font-bold">x{t.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-300 p-8 rounded-3xl space-y-4 text-center shadow-sm animate-fade-in">
              <div className="w-14 h-14 bg-rose-200 text-rose-800 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 block">
                  SECURITY ALERT
                </span>
                <h3 className="text-2xl font-bold text-rose-950">ENTRY DENIED</h3>
              </div>
              <p className="text-sm font-mono font-semibold text-rose-900 max-w-lg mx-auto bg-rose-100/70 p-3 rounded-2xl border border-rose-200">
                {verificationResult.error || 'Ticket pass validation failed.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* QR Camera Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
}
