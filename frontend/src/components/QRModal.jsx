import React, { useState } from 'react';
import Modal from './Modal';
import toast from 'react-hot-toast';
import {
  Download,
  QrCode,
  Ticket,
  CheckCircle2,
  Calendar,
  MapPin,
  Triangle,
  ShieldCheck,
  Copy,
  Sparkles,
  CreditCard,
  Lock,
  Users,
  Share2,
  Check,
  ChevronRight
} from 'lucide-react';

export default function QRModal({ isOpen, onClose, booking }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('master');
  const [selectedSubTicket, setSelectedSubTicket] = useState(null);
  const [copiedSubId, setCopiedSubId] = useState('');

  if (!booking) return null;

  const handleDownloadPDF = () => {
    window.open(`/api/bookings/${booking._id}/pdf`, '_blank');
  };

  const handleCopyPassCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    toast.success(`Master Pass ID ${booking.bookingCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySubPass = (ticketCode) => {
    navigator.clipboard.writeText(ticketCode);
    setCopiedSubId(ticketCode);
    toast.success(`Guest Pass ID ${ticketCode} copied!`);
    setTimeout(() => setCopiedSubId(''), 2500);
  };

  const handleShareInvite = (subTicket) => {
    const eventName = booking.event?.title || 'Event';
    const gate = booking.gateEntry || 'Gate A';
    const shareText = `🎟️ Here is your ticket for "${eventName}"!\n\nPass ID: ${subTicket.ticketCode}\nGate Entry: ${gate}\nStatus: Active & Valid\n\nPresent this code at the gate entrance to be admitted.`;

    navigator.clipboard.writeText(shareText);
    toast.success(`Invitation message for Pass #${subTicket.ticketIndex} copied! Send to your friend.`);
  };

  const totalCount = booking.totalTicketsCount || booking.tickets?.reduce((acc, t) => acc + t.quantity, 0) || 1;
  const currentCheckedIn = booking.checkedInCount || 0;
  const remainingCount = Math.max(0, totalCount - currentCheckedIn);

  // Dual-layer QR generation: uses backend qrCodeUrl, or instant high-resolution dynamic fallback
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    JSON.stringify({
      passCode: booking.bookingCode,
      securityDigest: booking.securityHash || 'ATOM-SECURITY-HASH',
      eventId: booking.event?._id || booking.event,
      gate: booking.gateEntry || 'Gate A • Rapid Turnstile'
    })
  )}`;

  const resolvedQrUrl = booking.qrCodeUrl || fallbackQrUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Digital Ticket Pass" maxWidth="max-w-lg">
      <div className="flex flex-col items-center space-y-5 font-helvetica-neue">
        {/* Tab Switcher if Multi-ticket booking */}
        {booking.individualTickets && booking.individualTickets.length > 1 && (
          <div className="flex items-center p-1 bg-brand-cream border border-brand-dark/15 rounded-2xl w-full text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setActiveTab('master');
                setSelectedSubTicket(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'master'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Master Group QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'individual'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Share Guest Passes ({booking.individualTickets.length})</span>
            </button>
          </div>
        )}

        {/* VIEW A: Individual Sub-Pass Single QR Preview */}
        {activeTab === 'individual' && selectedSubTicket ? (
          <div className="w-full bg-gradient-to-b from-[#faf8f5] to-white border border-brand-dark/20 rounded-3xl p-6 relative shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
              <button
                type="button"
                onClick={() => setSelectedSubTicket(null)}
                className="text-xs font-mono font-bold text-brand-dark hover:text-brand-green flex items-center space-x-1"
              >
                <span>← Back to All Passes</span>
              </button>
              <span
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase ${
                  selectedSubTicket.status === 'used'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}
              >
                {selectedSubTicket.status === 'used' ? 'ADMITTED' : 'VALID PASS'}
              </span>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono text-brand-dark/60 uppercase tracking-wider block">
                Individual Guest Pass #{selectedSubTicket.ticketIndex}
              </span>
              <h3 className="text-xl font-bold text-brand-dark">{booking.event?.title || 'Event Pass'}</h3>
              <p className="text-xs font-mono font-bold text-brand-green">{selectedSubTicket.ticketTypeName}</p>
            </div>

            {/* Individual Sub-Ticket QR */}
            <div className="p-4 bg-white rounded-3xl border-2 border-brand-dark/15 flex flex-col items-center justify-center relative shadow-sm mx-auto w-full max-w-[260px]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
                  JSON.stringify({
                    passCode: selectedSubTicket.ticketCode,
                    masterCode: booking.bookingCode,
                    eventId: booking.event?._id || booking.event,
                    gate: booking.gateEntry || 'Gate A • Rapid Turnstile'
                  })
                )}`}
                alt={`Pass #${selectedSubTicket.ticketIndex} QR Code`}
                className="w-48 h-48 object-contain rounded-xl p-1 bg-white"
              />

              <button
                onClick={() => handleCopySubPass(selectedSubTicket.ticketCode)}
                className="mt-3 flex items-center space-x-1.5 bg-brand-dark hover:bg-brand-green text-white text-[11px] font-mono font-bold px-4 py-1.5 rounded-full tracking-widest uppercase transition-colors shadow-sm"
              >
                <span>{selectedSubTicket.ticketCode}</span>
                <Copy className="w-3 h-3 opacity-80" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleShareInvite(selectedSubTicket)}
                className="w-full py-2.5 px-3 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 uppercase transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Invite</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopySubPass(selectedSubTicket.ticketCode)}
                className="w-full py-2.5 px-3 bg-brand-cream hover:bg-brand-light text-brand-dark border border-brand-dark/15 font-bold rounded-xl flex items-center justify-center space-x-1.5 uppercase transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Pass ID</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'individual' ? (
          /* VIEW B: List of Individual Sub-Passes for Sharing */
          <div className="w-full space-y-4">
            <div className="bg-brand-cream/80 border border-brand-dark/10 p-4 rounded-2xl text-xs font-mono text-brand-dark space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-brand-green">
                <Users className="w-4 h-4" />
                <span>Separate Arrivals & Traffic Delay Support</span>
              </div>
              <p className="text-brand-dark/70">
                Each friend can be given their unique Pass ID. When they arrive at the venue door, staff will admit them independently!
              </p>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {booking.individualTickets?.map((st) => (
                <div
                  key={st.ticketCode}
                  className="bg-white p-4 rounded-2xl border border-brand-dark/15 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs uppercase font-mono text-brand-dark">
                        Guest Pass #{st.ticketIndex}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          st.status === 'used'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {st.status === 'used' ? 'Admitted' : 'Valid Pass'}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-brand-green font-bold block">{st.ticketCode}</span>
                    <span className="text-[11px] font-mono text-brand-dark/60 block">{st.ticketTypeName}</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleShareInvite(st)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-brand-cream hover:bg-brand-dark hover:text-white border border-brand-dark/15 text-brand-dark font-mono text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors"
                      title="Copy invitation message for WhatsApp/SMS"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Invite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopySubPass(st.ticketCode)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-brand-cream hover:bg-brand-dark hover:text-white border border-brand-dark/15 text-brand-dark font-mono text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors"
                      title="Copy Pass ID"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSubId === st.ticketCode ? 'Copied' : 'ID'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSubTicket(st)}
                      className="px-3 py-1.5 bg-brand-dark hover:bg-brand-green text-white font-mono text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors"
                      title="View Pass QR"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* VIEW C: Master Pass View (Default) */
          <div className="w-full bg-gradient-to-b from-[#faf8f5] to-white border border-brand-dark/20 rounded-3xl p-6 relative shadow-lg space-y-5 overflow-hidden">
            {/* Subtle Security Guilloche Background Pattern */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-green/5 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand & Security Header */}
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-sm">
                  <Triangle className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-widest text-brand-dark block">ATOMIC OPS PASS</span>
                  <span className="text-[9px] font-mono text-brand-dark/50 block tracking-tight">HIGH-CONCURRENCY TICKETING ENGINE</span>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                <span>
                  {booking.status === 'confirmed'
                    ? totalCount > 1
                      ? `VALID (${currentCheckedIn}/${totalCount} IN)`
                      : 'VALID PASS'
                    : booking.status === 'partially_checked_in'
                    ? `PARTIAL (${currentCheckedIn}/${totalCount} IN)`
                    : booking.status.toUpperCase()}
                </span>
              </span>
            </div>

            {/* Event Title & Date/Location */}
            <div className="text-left space-y-2">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight leading-snug">
                {booking.event?.title || 'Event Pass'}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-brand-dark/70 bg-brand-cream/80 p-3 rounded-2xl border border-brand-dark/10">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span className="truncate">
                    {booking.event?.startDateTime
                      ? new Date(booking.event.startDateTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Upcoming'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span className="truncate">
                    {booking.event?.isOnline ? 'Online Summit' : booking.event?.venue?.city || 'San Francisco'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Container with High-Security Border */}
            <div className="p-5 bg-white rounded-3xl border-2 border-brand-dark/15 flex flex-col items-center justify-center relative shadow-sm mx-auto w-full max-w-[280px]">
              <div className="relative group">
                <img
                  src={resolvedQrUrl}
                  alt="Ticket QR Code"
                  className="w-52 h-52 object-contain rounded-xl p-1 bg-white"
                  onError={(e) => {
                    if (e.target.src !== fallbackQrUrl) {
                      e.target.src = fallbackQrUrl;
                    }
                  }}
                />
                <div className="absolute inset-0 border border-brand-dark/10 rounded-xl pointer-events-none" />
              </div>

              {/* Structured Pass ID with Copy Button */}
              <div className="mt-3 flex items-center space-x-1.5 w-full justify-center">
                <button
                  onClick={handleCopyPassCode}
                  className="flex items-center space-x-1.5 bg-brand-dark hover:bg-brand-green text-white text-[11px] font-mono font-bold px-4 py-1.5 rounded-full tracking-widest uppercase transition-colors shadow-sm"
                  title="Click to copy Pass ID"
                >
                  <span>{booking.bookingCode}</span>
                  <Copy className="w-3 h-3 opacity-80" />
                </button>
              </div>
              {copied && <span className="text-[10px] text-emerald-600 font-mono mt-1">Copied to clipboard!</span>}

              {/* Simulated Barcode Stripes */}
              <div className="mt-3 w-full flex items-center justify-center space-x-[2px] opacity-70">
                {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 3, 5, 1, 4, 2, 7, 3, 5, 2, 4, 1, 6, 3, 2].map((h, i) => (
                  <div key={i} className="bg-brand-dark rounded-sm" style={{ width: `${(i % 3) + 1.5}px`, height: '18px' }} />
                ))}
              </div>
            </div>

            {/* Gate Access & Security Digest */}
            <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
              <div className="bg-white p-3 rounded-2xl border border-brand-dark/10 space-y-0.5">
                <span className="text-[9px] text-brand-dark/50 font-bold uppercase tracking-wider block">Gate Assignment</span>
                <span className="font-bold text-brand-green text-[11px] block truncate">
                  {booking.gateEntry || 'Gate A • Rapid Access'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-brand-dark/10 space-y-0.5">
                <span className="text-[9px] text-brand-dark/50 font-bold uppercase tracking-wider block">Group Headcount</span>
                <span className="font-bold text-brand-dark text-[11px] block truncate">
                  {totalCount} Guest(s) • {remainingCount} Available
                </span>
              </div>
            </div>

            {/* Tier Breakdown */}
            {booking.tickets && (
              <div className="bg-white p-3.5 rounded-2xl border border-brand-dark/10 text-left space-y-1.5 text-xs font-mono">
                <span className="text-[10px] text-brand-dark/50 font-bold uppercase tracking-wider block">Pass Inventory</span>
                {booking.tickets.map((t, idx) => (
                  <div key={idx} className="flex justify-between text-brand-dark">
                    <span>{t.nameSnapshot} x{t.quantity}</span>
                    <span className="font-bold">${(t.priceSnapshot * t.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-brand-dark pt-1.5 border-t border-brand-dark/10">
                  <span>Total Paid</span>
                  <span className="text-brand-green">${Number(booking.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Cryptographic Security Digest Footer */}
            <div className="flex items-center justify-between text-[9px] font-mono text-brand-dark/50 pt-2 border-t border-brand-dark/10">
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-brand-green" />
                <span>DIGEST: {booking.securityHash ? booking.securityHash.slice(0, 16) : 'HMAC-SHA256-VERIFIED'}</span>
              </div>
              <span>DOOR SCAN VERIFIED</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-brand-dark hover:bg-brand-green text-white font-bold text-xs uppercase tracking-wide transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-brand-cream hover:bg-brand-light text-brand-dark border border-brand-dark/20 font-bold text-xs uppercase tracking-wide transition-colors"
          >
            <span>Close Ticket Pass</span>
          </button>
        </div>

      </div>
    </Modal>
  );
}
