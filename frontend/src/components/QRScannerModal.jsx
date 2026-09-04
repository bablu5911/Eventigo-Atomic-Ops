import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Search, CheckCircle, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import api from '../services/api';

export default function QRScannerModal({ isOpen, onClose, onCheckInSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    let scanner = null;
    if (isOpen && scannerActive) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          handleVerifyPayload(decodedText);
          scanner.clear().catch(console.error);
          setScannerActive(false);
        },
        (errorMessage) => {
          // ignore frame read errors
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isOpen, scannerActive]);

  const handleVerifyPayload = async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/bookings/verify', {
        scannerPayload: payload,
        bookingCode: typeof payload === 'string' && payload.startsWith('BK-') ? payload : undefined
      });

      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Ticket not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyPayload(manualCode.trim());
  };

  const handlePerformCheckIn = async (bookingId) => {
    setVerifying(true);
    try {
      const res = await api.patch(`/bookings/${bookingId}/check-in`);
      if (res.data.success) {
        setResult((prev) => ({
          ...prev,
          isCheckedIn: true,
          attendedAt: res.data.data.attendedAt
        }));
        if (onCheckInSuccess) onCheckInSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setManualCode('');
    setScannerActive(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { handleReset(); onClose(); }} title="Door Check-In & Ticket Verification" maxWidth="max-w-xl">
      <div className="space-y-6">
        
        {/* Verification Result State */}
        {result ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-slate-400 font-mono">Booking Code</span>
                <p className="font-mono font-bold text-lg text-cyan-400">{result.bookingCode}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                result.isCheckedIn 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {result.isCheckedIn ? 'CHECKED IN' : 'VALID TICKET'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Attendee Name</span>
                <span className="font-semibold text-slate-100">{result.attendeeName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">Email</span>
                <span className="text-slate-300">{result.attendeeEmail}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 font-mono block">Event</span>
                <span className="font-semibold text-slate-100">{result.eventTitle}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400 font-mono block">Ticket Breakdown</span>
              {result.tickets.map((t, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-200">
                  <span>{t.nameSnapshot}</span>
                  <span className="font-mono font-bold text-cyan-400">x{t.quantity}</span>
                </div>
              ))}
            </div>

            {/* Check-In Trigger */}
            {!result.isCheckedIn ? (
              <button
                onClick={() => handlePerformCheckIn(result.bookingId)}
                disabled={verifying}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-5 h-5" />
                <span>{verifying ? 'Checking In...' : 'Confirm Attendee Check-In'}</span>
              </button>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-center text-xs text-emerald-400 flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Attendee checked in at {new Date(result.attendedAt).toLocaleTimeString()}</span>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify Another Code</span>
            </button>
          </div>
        ) : (
          /* Input & Scanner Modes */
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-950/50 border border-rose-500/40 p-4 rounded-xl text-rose-300 text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Code Input Form */}
            <form onSubmit={handleManualSearch} className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Enter Booking Code Manually
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. BK-LM890X-AB1"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>Lookup</span>
                </button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-mono text-slate-500">OR SCAN CAMERA</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Webcam Live Scanner */}
            <div>
              {!scannerActive ? (
                <button
                  onClick={() => setScannerActive(true)}
                  className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/30"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Activate Live Camera Scanner</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div id="reader" className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950"></div>
                  <button
                    onClick={() => setScannerActive(false)}
                    className="w-full py-2 bg-slate-900 text-slate-400 hover:text-white text-xs font-mono rounded-xl border border-slate-800"
                  >
                    Close Camera View
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
}
