import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMyBookings } from '../services/reactQueryHooks';
import api from '../services/api';
import QRModal from '../components/QRModal';
import ThermalTicketPrinter from '../components/ThermalTicketPrinter';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import { Ticket, QrCode, Download, Calendar, MapPin, XCircle, Star, MessageSquare, AlertCircle, Users, Share2, Sparkles, Copy, Printer, Radio, Bell } from 'lucide-react';

export default function MyBookingsPage() {
  const { data: bookings = [], isLoading, isError, error, refetch } = useMyBookings();
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [selectedThermalBooking, setSelectedThermalBooking] = useState(null);
  const [myRewards, setMyRewards] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/broadcasts/my-alerts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setActiveAlerts(res.data.data);
      }
    } catch (err) {
      // Ignore
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await api.get('/promocodes/my-rewards');
      if (res.data?.success && Array.isArray(res.data.rewards)) {
        setMyRewards(res.data.rewards);
      }
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Tickets will be returned to inventory.')) {
      return;
    }
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        toast.success('Booking cancelled successfully');
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleOpenReviewModal = (booking) => {
    setReviewModalBooking(booking);
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalBooking) return;

    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        bookingId: reviewModalBooking._id,
        eventId: reviewModalBooking.event._id,
        rating,
        comment
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setReviewModalBooking(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10 px-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark flex items-center space-x-3 uppercase tracking-tight">
            <Ticket className="w-8 h-8 text-brand-green" />
            <span>My Digital Ticket Wallet</span>
          </h1>
          <p className="text-xs text-brand-dark/60 font-mono mt-1">
            Real-time access passes, QR door verification codes, and PDF receipts
          </p>
        </div>
      </div>

      {/* Event-Bound Live Directives Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                    Live Organizer Gate Directives
                  </h3>
                  <span className="text-[10px] bg-emerald-500 text-neutral-950 font-black px-2.5 py-0.5 rounded-full uppercase font-mono">
                    {activeAlerts.length} Directives for Your Events
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Official announcements sent exclusively to confirmed ticket holders
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 truncate">
                    {alert.event?.title || 'Your Event'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        alert.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : alert.priority === 'info'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {alert.priority === 'urgent' ? '🚨 Urgent' : alert.priority === 'info' ? 'ℹ️ Info' : '🚪 Gate Directive'}
                    </span>
                    <span className="text-[9px] font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                      {alert.targetGate || 'All Gates'}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-white">{alert.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.message}</p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Organizer: {alert.organizer?.name || 'Event Host'}</span>
                  <span>{new Date(alert.sentAt || alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Early Exit Reward Coupons Wallet Section */}
      {myRewards.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/80 border-2 border-amber-400/60 rounded-3xl p-6 shadow-sm space-y-4 font-helvetica-neue">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-dark uppercase tracking-tight flex items-center gap-2">
                  <span>Crowd Exit Reward Coupons</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono">
                    {myRewards.length} ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-brand-dark/60 font-mono">
                  Discounts earned by departing before peak closing crowd • Usable once during ticket checkout
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRewards.map((reward) => (
              <div
                key={reward._id}
                className="bg-white border border-amber-300/70 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs hover:border-amber-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm bg-brand-cream border border-brand-dark/15 px-2.5 py-1 rounded-xl text-brand-dark tracking-wider select-all">
                        {reward.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(reward.code);
                          toast.success(`Copied ${reward.code} to clipboard!`);
                        }}
                        className="text-xs text-brand-dark/60 hover:text-brand-dark underline font-mono flex items-center space-x-1"
                        title="Copy Promo Code"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-xs text-brand-dark/70 font-mono mt-2 space-y-0.5">
                      <div>
                        <span className="font-bold text-emerald-700">{reward.value}% DISCOUNT</span>
                        <span className="text-brand-dark/40"> • </span>
                        <span>
                          Applies up to <strong className="text-brand-dark">{reward.maxTicketsApplicable} {reward.maxTicketsApplicable === 1 ? 'ticket' : 'tickets'}</strong>
                        </span>
                      </div>
                      {reward.earlyExitMetadata?.sourceEvent && (
                        <div className="text-[11px] text-brand-dark/60">
                          Source: {reward.earlyExitMetadata.sourceEvent.title || 'Event'} ({reward.earlyExitMetadata.minutesEarly}m early)
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono font-bold uppercase shrink-0">
                    Single Use
                  </span>
                </div>

                <div className="text-[10px] font-mono text-brand-dark/60 bg-brand-cream/60 p-2 rounded-xl border border-brand-dark/5 flex items-center justify-between">
                  <span>Applies automatically in checkout cart</span>
                  <Link to="/" className="text-brand-green font-bold hover:underline">
                    Browse Events &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 UI States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="text-xl font-bold text-rose-900">Failed to load ticket passes</h3>
          <p className="text-sm text-rose-700">{error?.message || 'Server connection error'}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full uppercase transition-colors"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white/80 border border-brand-dark/10 p-16 text-center rounded-3xl space-y-4 shadow-sm">
          <Ticket className="w-16 h-16 text-brand-dark/30 mx-auto" />
          <h3 className="text-xl font-bold text-brand-dark">No Active Ticket Passes Found</h3>
          <p className="text-xs text-brand-dark/60 font-mono">You haven't reserved any high-concurrency event tickets yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bookings.map((b) => {
            const isCancelled = b.status === 'cancelled';
            const totalTickets = b.totalTicketsCount || b.tickets?.reduce((acc, t) => acc + t.quantity, 0) || 1;
            const checkedIn = b.checkedInCount || 0;
            const remaining = Math.max(0, totalTickets - checkedIn);

            return (
              <div key={b._id} className="bg-white/80 backdrop-blur-sm border border-brand-dark/10 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-brand-dark font-bold tracking-widest">{b.bookingCode}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-brand-cream text-brand-dark/70 border border-brand-dark/10 uppercase">
                        {b.paymentMethod ? `${b.paymentMethod.toUpperCase()} • PAID` : 'PAID'}
                      </span>
                      {b.earlyExitCount > 0 && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                          🏃 {b.earlyExitCount} EXITED EARLY
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                        b.status === 'confirmed'
                          ? 'bg-brand-green/10 text-brand-green border border-brand-green/30'
                          : b.status === 'partially_checked_in'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : b.status === 'scanned_invalid'
                          ? 'bg-gray-100 text-gray-700 border border-gray-300'
                          : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}
                    >
                      {b.status === 'confirmed'
                        ? totalTickets > 1
                          ? `VALID (${totalTickets} GUESTS)`
                          : 'VALID PASS'
                        : b.status === 'partially_checked_in'
                        ? `PARTIAL (${checkedIn}/${totalTickets} IN)`
                        : b.status === 'scanned_invalid'
                        ? `CHECKED IN (${checkedIn}/${totalTickets})`
                        : b.status}
                    </span>
                  </div>

                  {/* Title, Metadata & QR Thumbnail */}
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      <h3 className="font-bold text-xl text-brand-dark font-helvetica-neue">{b.event?.title || 'Event Pass'}</h3>

                      <div className="space-y-1 text-xs text-brand-dark/70 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-green" />
                          <span>
                            {b.event?.startDateTime ? new Date(b.event.startDateTime).toLocaleDateString() : 'Upcoming'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-green" />
                          <span>{b.event?.isOnline ? 'Online Event' : b.event?.venue?.city || 'Venue'}</span>
                        </div>
                        <div className="text-brand-green font-bold text-[11px]">
                          {b.gateEntry || 'Gate A • Express FastTrack'}
                        </div>
                      </div>
                    </div>

                    {/* QR Thumbnail */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setSelectedQRBooking(b)}
                        className="p-1.5 bg-white border border-brand-dark/15 rounded-2xl shadow-sm hover:border-brand-dark/40 transition-colors shrink-0 group"
                        title="Click to expand pass QR"
                      >
                        <img
                          src={
                            b.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                              b.bookingCode
                            )}`
                          }
                          alt="QR Thumbnail"
                          className="w-16 h-16 object-contain rounded-lg"
                        />
                        <span className="block text-[8px] font-mono text-center text-brand-dark/50 group-hover:text-brand-dark mt-0.5 uppercase">
                          Scan Pass
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Ticket Items Snapshot */}
                  <div className="bg-brand-cream p-3.5 rounded-2xl border border-brand-dark/10 space-y-1.5 mt-3">
                    <span className="text-[10px] text-brand-dark/50 font-mono uppercase tracking-wider block font-semibold">Tier Breakdown</span>
                    {b.tickets?.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-brand-dark font-mono">
                        <span>{t.nameSnapshot} x{t.quantity}</span>
                        <span className="font-bold">${(t.priceSnapshot * t.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold text-brand-dark pt-1.5 border-t border-brand-dark/10 mt-1.5 font-mono">
                      <span>Total Paid</span>
                      <span className="text-brand-green">${Number(b.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Multi-guest banner if totalTickets > 1 */}
                  {totalTickets > 1 && !isCancelled && (
                    <div className="mt-3 bg-brand-cream/80 border border-brand-dark/10 p-3 rounded-2xl flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-brand-green" />
                        <span className="font-bold text-brand-dark">Group Pass ({totalTickets} Guests)</span>
                      </div>
                      <span className="text-brand-dark/70">
                        {checkedIn > 0 ? `${checkedIn} In • ${remaining} Remaining` : 'All Available'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-brand-dark/10 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedQRBooking(b)}
                        className="px-4 py-2 bg-brand-dark text-white hover:bg-brand-green text-xs font-bold rounded-full flex items-center space-x-1.5 transition-colors uppercase tracking-wide"
                      >
                        {totalTickets > 1 ? <Users className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                        <span>{totalTickets > 1 ? 'Passes & QR' : 'QR Pass'}</span>
                      </button>
                    )}

                    <a
                      href={`/api/bookings/${b._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-cream hover:bg-brand-light text-brand-dark border border-brand-dark/15 text-xs font-bold rounded-full flex items-center space-x-1.5 transition-colors uppercase tracking-wide"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>

                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedThermalBooking(b)}
                        className="px-3.5 py-2 bg-[#1f1e1b] hover:bg-[#2e2c28] text-amber-300 border border-neutral-700 text-xs font-bold rounded-full flex items-center space-x-1.5 transition-colors uppercase tracking-wide"
                        title="Interactive Thermal Ticket Printer Simulation"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Thermal</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCancelled && (
                      <button
                        onClick={() => handleOpenReviewModal(b)}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-full flex items-center space-x-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
                        <span>Review</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="p-2 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                        title="Cancel Booking"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Viewer Modal */}
      {selectedQRBooking && (
        <QRModal
          isOpen={Boolean(selectedQRBooking)}
          onClose={() => setSelectedQRBooking(null)}
          booking={selectedQRBooking}
        />
      )}

      {/* Thermal Ticket Printer Modal */}
      {selectedThermalBooking && (
        <ThermalTicketPrinter
          booking={selectedThermalBooking}
          onFinish={() => setSelectedThermalBooking(null)}
          onClose={() => setSelectedThermalBooking(null)}
        />
      )}

      {/* Review Submission Modal */}
      {reviewModalBooking && (
        <Modal
          isOpen={Boolean(reviewModalBooking)}
          onClose={() => setReviewModalBooking(null)}
          title="Submit Verified Review"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-helvetica-neue">
            <div>
              <label className="text-brand-dark font-semibold block mb-1.5">Rating (1 to 5 Stars)</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-xl border transition-colors ${
                      star <= rating
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-brand-cream text-brand-dark/30 border-brand-dark/10'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-brand-dark font-semibold block mb-1.5">Your Feedback & Review</label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience at this summit or festival..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl p-3.5 text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-mono"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors flex items-center justify-center space-x-2 text-sm uppercase tracking-wide disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{reviewSubmitting ? 'Posting Review...' : 'Submit Review'}</span>
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
