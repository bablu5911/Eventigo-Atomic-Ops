import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEventDetail, useCreateBooking } from '../services/reactQueryHooks';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonDetail from '../components/SkeletonDetail';
import QRModal from '../components/QRModal';
import ThermalTicketPrinter from '../components/ThermalTicketPrinter';
import PaymentModal from '../components/PaymentModal';
import confetti from 'canvas-confetti';
import { Calendar, MapPin, Ticket, ShieldCheck, Plus, Minus, AlertCircle, Lock, Sparkles, Gift } from 'lucide-react';

export default function EventDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useEventDetail(slug);
  const createBookingMutation = useCreateBooking();

  const event = data?.event;
  const ticketTypes = data?.ticketTypes || [];

  const [selectedTickets, setSelectedTickets] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [userRewards, setUserRewards] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/promocodes/my-rewards')
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.rewards)) {
            setUserRewards(res.data.rewards);
          }
        })
        .catch(() => {
          setUserRewards([]);
        });
    } else {
      setUserRewards([]);
    }
  }, [user]);

  const handleApplyPromo = async (overrideCode) => {
    const codeToTest = (typeof overrideCode === 'string' ? overrideCode : promoCode).trim().toUpperCase();
    if (!codeToTest) {
      toast.error('Please enter a promo code');
      return;
    }
    setValidatingPromo(true);
    try {
      const res = await api.post('/promocodes/validate', {
        eventId: event._id,
        code: codeToTest
      });
      if (res.data.success) {
        const promo = res.data.promoCode;
        setAppliedPromo(promo);
        setPromoCode(codeToTest);
        toast.success(
          promo.discountType === 'percentage'
            ? `Coupon Applied: ${promo.value}% OFF${promo.maxTicketsApplicable ? ` (Up to ${promo.maxTicketsApplicable} ticket${promo.maxTicketsApplicable > 1 ? 's' : ''})` : ''}!`
            : `Coupon Applied: $${promo.value} OFF!`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or unauthorized promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.success('Coupon removed');
  };

  const handleQuantityChange = (ticketTypeId, delta, maxPerUser, totalRemaining) => {
    const current = selectedTickets[ticketTypeId] || 0;
    const nextVal = Math.max(0, Math.min(current + delta, maxPerUser, totalRemaining));

    const updated = { ...selectedTickets, [ticketTypeId]: nextVal };
    if (nextVal === 0) delete updated[ticketTypeId];

    setSelectedTickets(updated);
  };

  const handleInitiateCheckout = () => {
    if (!user) {
      toast.error('Please log in to book tickets');
      navigate('/login');
      return;
    }

    const items = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity
    }));

    if (items.length === 0) {
      toast.error('Please select at least 1 ticket to book');
      return;
    }

    setPaymentModalOpen(true);
  };

  const handleProcessBookingWithPayment = async ({ paymentMethod, transactionId }) => {
    const items = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity
    }));

    createBookingMutation.mutate(
      {
        eventId: event._id,
        tickets: items,
        promoCode: promoCode.trim() || undefined,
        paymentMethod,
        transactionId
      },
      {
        onSuccess: (responseData) => {
          toast.success('Payment authorized & Booking confirmed!');
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
          setPaymentModalOpen(false);
          const freshBooking = responseData.booking || responseData;
          if (responseData.qrCodeUrl) freshBooking.qrCodeUrl = responseData.qrCodeUrl;
          setBookingSuccessModal(freshBooking);
          setSelectedTickets({});
          setPromoCode('');
        },
        onError: (err) => {
          toast.error(err.response?.data?.error || 'Payment or reservation failed');
        }
      }
    );
  };

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (isError || !event) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 font-helvetica-neue">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-2xl font-bold text-brand-dark">{error?.message || 'Event Not Found'}</h2>
        <Link to="/" className="text-xs font-mono text-brand-green underline">
          Return to Events Discovery
        </Link>
      </div>
    );
  }

  const totalSelectedCount = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  const subtotal = ticketTypes.reduce(
    (acc, tt) => acc + (selectedTickets[tt._id] || 0) * tt.price,
    0
  );

  let promoDiscount = 0;
  if (appliedPromo) {
    let discountableAmount = subtotal;
    if (appliedPromo.maxTicketsApplicable && appliedPromo.maxTicketsApplicable > 0) {
      let counted = 0;
      discountableAmount = 0;
      for (const tt of ticketTypes) {
        const qty = selectedTickets[tt._id] || 0;
        const take = Math.min(qty, appliedPromo.maxTicketsApplicable - counted);
        if (take > 0) {
          discountableAmount += tt.price * take;
          counted += take;
        }
        if (counted >= appliedPromo.maxTicketsApplicable) break;
      }
    }
    if (appliedPromo.discountType === 'percentage') {
      promoDiscount = (discountableAmount * appliedPromo.value) / 100;
    } else {
      promoDiscount = Math.min(discountableAmount, appliedPromo.value);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10 px-6 font-helvetica-neue">
      {/* Banner */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden border border-brand-dark/10 bg-brand-cream shadow-sm">
        <img
          src={event.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/30 to-transparent"></div>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <span className="bg-brand-dark/90 text-white text-xs font-mono font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
            {event.category?.name || 'Event'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{event.title}</h1>
        </div>
      </div>

      {/* Grid Details + Booking Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Overview & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 border border-brand-dark/10 p-5 rounded-3xl flex items-start space-x-3.5 shadow-sm">
              <Calendar className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block">Date & Time</span>
                <span className="text-sm font-semibold text-brand-dark">
                  {new Date(event.startDateTime).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-5 rounded-3xl flex items-start space-x-3.5 shadow-sm">
              <MapPin className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block">Location</span>
                <span className="text-sm font-semibold text-brand-dark">
                  {event.isOnline ? 'Online Event' : `${event.venue?.name || ''}, ${event.venue?.city || ''}`}
                </span>
                {!event.isOnline && event.venue?.address && (
                  <p className="text-xs text-brand-dark/60 mt-0.5">{event.venue.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/80 border border-brand-dark/10 p-7 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xl font-bold text-brand-dark border-b border-brand-dark/10 pb-3 uppercase tracking-tight">
              About This Event
            </h3>
            <p className="text-sm text-brand-dark/80 whitespace-pre-line leading-relaxed">{event.description}</p>
          </div>
        </div>

        {/* Right Column: Ticket Tier Counter */}
        <div className="space-y-6">
          <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl space-y-6 sticky top-24 shadow-sm">
            <div className="border-b border-brand-dark/10 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-brand-dark uppercase tracking-tight">Select Ticket Tiers</h3>
                <span className="flex items-center space-x-1 text-[11px] font-mono text-brand-green font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Atomic Guard</span>
                </span>
              </div>
            </div>

            {/* Ticket Tier List */}
            <div className="space-y-4">
              {ticketTypes.length > 0 ? (
                ticketTypes.map((tt) => {
                  const qty = selectedTickets[tt._id] || 0;
                  const remaining = tt.totalQuantity - tt.soldQuantity;
                  const isSoldOut = remaining <= 0;

                  return (
                    <div key={tt._id} className="bg-brand-cream border border-brand-dark/10 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-brand-dark">{tt.name}</h4>
                          <span className="text-xs text-brand-dark/60 font-mono font-semibold">${tt.price.toFixed(2)}</span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(tt._id, -1, tt.maxPerUser, remaining)}
                            disabled={qty === 0 || isSoldOut}
                            className="w-7 h-7 rounded-full bg-white hover:bg-brand-dark hover:text-white border border-brand-dark/20 disabled:opacity-30 text-brand-dark flex items-center justify-center font-bold transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-sm text-brand-dark">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(tt._id, 1, tt.maxPerUser, remaining)}
                            disabled={qty >= tt.maxPerUser || qty >= remaining || isSoldOut}
                            className="w-7 h-7 rounded-full bg-white hover:bg-brand-dark hover:text-white border border-brand-dark/20 disabled:opacity-30 text-brand-dark flex items-center justify-center font-bold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-brand-dark/50 font-mono">
                        <span>Max per user: {tt.maxPerUser}</span>
                        <span>{isSoldOut ? 'Sold Out' : `${remaining} available`}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-brand-dark/50 font-mono">No ticket tiers available.</p>
              )}
            </div>

            {/* Promo Code Input */}
            <div className="space-y-2 pt-2 border-t border-brand-dark/10">
              <label className="text-xs font-mono uppercase tracking-wider text-brand-dark/60 block">
                Promo Code / Coupon
              </label>

              {appliedPromo ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="text-xs font-mono">
                    <span className="font-bold text-emerald-900 block">
                      ✅ {appliedPromo.code} APPLIED
                    </span>
                    <span className="text-emerald-700 text-[11px] block">
                      {appliedPromo.discountType === 'percentage'
                        ? `${appliedPromo.value}% Discount (-$${promoDiscount.toFixed(2)})`
                        : `$${appliedPromo.value} Flat Discount (-$${promoDiscount.toFixed(2)})`}
                    </span>
                    {appliedPromo.maxTicketsApplicable && (
                      <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                        ⚡ Early Exit Reward: Discount capped to {appliedPromo.maxTicketsApplicable} ticket{appliedPromo.maxTicketsApplicable > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs font-mono font-bold text-rose-600 hover:text-rose-800 underline shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  {/* Available Rewards in Wallet */}
                  {userRewards.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300/80 p-3 rounded-2xl space-y-2 mb-2">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Available Early Exit Reward in Wallet:</span>
                      </div>
                      <div className="space-y-1.5">
                        {userRewards.map((reward) => (
                          <div
                            key={reward._id}
                            className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-amber-200 text-xs font-mono shadow-xs"
                          >
                            <div>
                              <span className="font-bold text-brand-dark tracking-wide block">{reward.code}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold block">
                                {reward.value}% OFF • Max {reward.maxTicketsApplicable} ticket{reward.maxTicketsApplicable > 1 ? 's' : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyPromo(reward.code)}
                              className="px-2.5 py-1 bg-brand-dark hover:bg-brand-green text-white rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. ATOMIC20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      className="flex-1 bg-brand-cream border border-brand-dark/15 rounded-2xl px-3.5 py-2 text-xs font-mono text-brand-dark uppercase placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={validatingPromo || !promoCode.trim()}
                      className="px-4 py-2 bg-brand-dark hover:bg-brand-green text-white font-mono font-bold text-xs rounded-2xl transition-colors uppercase disabled:opacity-40"
                    >
                      {validatingPromo ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Price Summary Breakdown */}
            {totalSelectedCount > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-brand-dark/10 text-xs font-mono text-brand-dark/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-brand-dark">${subtotal.toFixed(2)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-dark font-bold text-sm pt-1 border-t border-brand-dark/10">
                  <span>Estimated Total</span>
                  <span>${Math.max(0, subtotal - promoDiscount).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Proceed to Checkout Button */}
            <button
              type="button"
              onClick={handleInitiateCheckout}
              disabled={createBookingMutation.isLoading || totalSelectedCount === 0}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-sm rounded-full transition-colors flex items-center justify-center space-x-2 uppercase tracking-wide disabled:opacity-50 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              <span>
                {createBookingMutation.isLoading
                  ? 'Processing...'
                  : `Proceed to Checkout (${totalSelectedCount})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          event={{ ...event, ticketTypes }}
          selectedTickets={selectedTickets}
          promoCode={appliedPromo ? appliedPromo.code : promoCode.trim()}
          promoDiscount={promoDiscount}
          onPaymentSuccess={handleProcessBookingWithPayment}
          isProcessing={createBookingMutation.isLoading}
        />
      )}

      {/* Success Thermal Ticket Printer & Confirmation Modal */}
      {bookingSuccessModal && (
        <ThermalTicketPrinter
          booking={{
            ...bookingSuccessModal,
            eventName: event.title,
            startDateTime: event.startDateTime,
            venue: event.venue
          }}
          onFinish={() => {
            setBookingSuccessModal(null);
            navigate('/my-bookings');
          }}
          onClose={() => setBookingSuccessModal(null)}
        />
      )}
    </div>
  );
}
