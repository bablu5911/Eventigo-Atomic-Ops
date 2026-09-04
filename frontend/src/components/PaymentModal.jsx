import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Lock, Smartphone, Building2, CheckCircle2, RefreshCw, AlertCircle, ArrowRight, Zap, Sparkles } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, event, selectedTickets, promoCode, promoDiscount = 0, onPaymentSuccess, isProcessing }) {
  const [paymentMode, setPaymentMode] = useState('card'); // card | upi | express | netbanking
  
  // Card state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('ALEX ATTENDEE');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');
  const [cardFocused, setCardFocused] = useState(false);

  // UPI state
  const [upiId, setUpiId] = useState('alex.attendee@okaxis');
  const [upiTimer, setUpiTimer] = useState(299);

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Processing state
  const [stage, setStage] = useState('idle'); // idle | processing | authorized

  useEffect(() => {
    let interval;
    if (isOpen && paymentMode === 'upi' && upiTimer > 0) {
      interval = setInterval(() => setUpiTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, paymentMode, upiTimer]);

  if (!isOpen) return null;

  // Calculations
  const ticketEntries = Object.entries(selectedTickets || {});
  let subtotal = 0;
  const items = ticketEntries.map(([ttId, qty]) => {
    const tt = (event?.ticketTypes || []).find((t) => t._id === ttId);
    const price = tt?.price || 0;
    const itemSubtotal = price * qty;
    subtotal += itemSubtotal;
    return { name: tt?.name || 'Standard Pass', price, qty, subtotal: itemSubtotal };
  });

  const discountAmount = promoDiscount > 0 ? promoDiscount : 0;
  const processingFee = subtotal > 0 ? 2.50 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + processingFee);

  const formatCardNumber = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' ') || '•••• •••• •••• ••••');
  };

  const handlePay = () => {
    setStage('processing');
    const fakeTxnId = `TXN-ATOM-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      setStage('authorized');
      setTimeout(() => {
        setStage('idle');
        onPaymentSuccess({
          paymentMethod: paymentMode === 'express' ? 'apple_pay' : paymentMode,
          transactionId: fakeTxnId
        });
      }, 700);
    }, 1400);
  };

  const minutes = Math.floor(upiTimer / 60);
  const seconds = upiTimer % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-brand-dark/75 backdrop-blur-md animate-fade-in font-helvetica-neue">
      <div className="relative w-full max-w-2xl bg-[#faf8f5] border border-brand-dark/20 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark/10 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-dark uppercase tracking-tight">Atomic Secure Checkout</h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-brand-dark/50">
                <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <span>•</span>
                <span>PCI-DSS Level 1</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={stage !== 'idle'}
            className="p-2 rounded-full text-brand-dark/50 hover:text-brand-dark hover:bg-brand-cream transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Order Summary Dropdown Box */}
          <div className="bg-white p-4 rounded-2xl border border-brand-dark/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-dark/70">Order Summary</span>
              <span className="text-xs font-mono font-bold text-brand-dark">{items.reduce((s, i) => s + i.qty, 0)} Ticket(s)</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-brand-dark">
                  <span>{it.name} x{it.qty}</span>
                  <span className="font-semibold">${it.subtotal.toFixed(2)}</span>
                </div>
              ))}

              {promoCode && (
                <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                  <span>Promo Code Applied ({promoCode.toUpperCase()})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-dark/60">
                <span>Secure Processing & Service Fee</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-brand-dark pt-2 border-t border-brand-dark/10">
                <span>Grand Total Due</span>
                <span className="text-brand-green text-base">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                paymentMode === 'card'
                  ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                  : 'bg-white text-brand-dark/70 border-brand-dark/10 hover:border-brand-dark/30'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="font-bold text-[11px]">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                paymentMode === 'upi'
                  ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                  : 'bg-white text-brand-dark/70 border-brand-dark/10 hover:border-brand-dark/30'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="font-bold text-[11px]">UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('express')}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                paymentMode === 'express'
                  ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                  : 'bg-white text-brand-dark/70 border-brand-dark/10 hover:border-brand-dark/30'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="font-bold text-[11px]">Express</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('netbanking')}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                paymentMode === 'netbanking'
                  ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                  : 'bg-white text-brand-dark/70 border-brand-dark/10 hover:border-brand-dark/30'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="font-bold text-[11px]">NetBank</span>
            </button>
          </div>

          {/* TAB 1: CREDIT / DEBIT CARD */}
          {paymentMode === 'card' && (
            <div className="space-y-4">
              {/* Interactive Visual Credit Card */}
              <div className="w-full h-44 rounded-3xl bg-gradient-to-tr from-[#1e293b] via-[#0f172a] to-[#334155] p-5 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* EMV Chip */}
                    <div className="w-8 h-6 rounded-md bg-amber-300/80 border border-amber-400 flex items-center justify-center">
                      <div className="w-4 h-3 border border-amber-600/60 rounded-sm" />
                    </div>
                    {/* Contactless symbol */}
                    <span className="text-[10px] font-mono tracking-widest text-slate-400">)))</span>
                  </div>
                  <span className="font-bold text-xs uppercase font-mono tracking-wider text-emerald-400">Atomic Shield</span>
                </div>

                <div className="font-mono text-lg sm:text-xl tracking-widest text-slate-100 font-semibold text-center drop-shadow-sm">
                  {cardNumber}
                </div>

                <div className="flex items-end justify-between text-xs font-mono">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                    <span className="font-bold tracking-wider uppercase truncate block max-w-[160px]">{cardHolder}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 block">Expires</span>
                    <span className="font-bold tracking-wider">{expiry}</span>
                  </div>
                  <div className="font-bold text-sm tracking-wider text-slate-300 italic">VISA</div>
                </div>
              </div>

              {/* Card Input Fields */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-brand-dark/70 font-bold uppercase tracking-wider block mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    onChange={(e) => formatCardNumber(e.target.value)}
                    className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-brand-dark font-bold tracking-widest focus:outline-none focus:border-brand-dark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-brand-dark/70 font-bold uppercase tracking-wider block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Alex Attendee"
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase() || 'ALEX ATTENDEE')}
                      className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-brand-dark font-bold uppercase focus:outline-none focus:border-brand-dark"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-brand-dark/70 font-bold uppercase tracking-wider block mb-1">Exp (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        onChange={(e) => setExpiry(e.target.value || '12/28')}
                        className="w-full bg-white border border-brand-dark/15 rounded-2xl px-3 py-2.5 text-brand-dark font-bold text-center focus:outline-none focus:border-brand-dark"
                      />
                    </div>
                    <div>
                      <label className="text-brand-dark/70 font-bold uppercase tracking-wider block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="888"
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full bg-white border border-brand-dark/15 rounded-2xl px-3 py-2.5 text-brand-dark font-bold text-center focus:outline-none focus:border-brand-dark"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPI / QR INSTANT */}
          {paymentMode === 'upi' && (
            <div className="bg-white p-5 rounded-3xl border border-brand-dark/10 text-center space-y-4 font-mono">
              <div className="flex items-center justify-between text-xs text-brand-dark/60 pb-2 border-b border-brand-dark/10">
                <span>Scan with Any UPI App</span>
                <span className="text-rose-600 font-bold">
                  Expires in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>

              {/* Dynamic UPI QR Code */}
              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10 w-fit mx-auto shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `upi://pay?pa=atomicops@upi&pn=Atomic%20Ops&am=${grandTotal}&cu=USD`
                  )}`}
                  alt="UPI QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-brand-dark/70 block">Or enter Virtual Payment Address (UPI ID)</span>
                <div className="flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1 bg-brand-cream border border-brand-dark/15 rounded-xl px-3 py-2 text-xs text-brand-dark font-bold focus:outline-none focus:border-brand-dark"
                  />
                  <button
                    type="button"
                    onClick={handlePay}
                    className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition-colors uppercase"
                  >
                    Verify & Pay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPLE PAY / GOOGLE PAY */}
          {paymentMode === 'express' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-4 bg-black hover:bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.19-9.55-11.03-20.67-14.52-33.34-3.48-12.67-5.23-24.36-5.23-35.08 0-14.7 3.59-26.79 10.77-36.27 7.18-9.48 16.5-14.33 27.97-14.55 4.35 0 9.38 1.15 15.09 3.44 5.71 2.3 9.49 3.44 11.33 3.44 1.41 0 5.48-1.22 12.2-3.66 6.72-2.44 12.16-3.5 16.32-3.18 12.83.65 22.95 5.76 30.36 15.34-11.09 6.74-16.52 16.09-16.3 28.05.22 9.57 3.91 17.5 11.08 23.81 7.17 6.31 15.65 9.9 25.44 10.77-2.61 7.83-5.76 15.22-9.45 22.18zM119.22 33.58c0-7.39 2.65-14.4 7.96-21.03 5.3-6.63 11.85-10.97 19.64-13.01.65 2.17.98 4.24.98 6.2 0 7.39-2.76 14.5-8.28 21.32-5.52 6.82-12.28 11.16-20.3 13.02z" />
                </svg>
                <span className="text-sm font-semibold tracking-wide">Pay with Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={handlePay}
                className="w-full py-4 bg-white hover:bg-slate-50 text-brand-dark border border-brand-dark/20 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-semibold tracking-wide">Pay with Google Pay</span>
              </button>
            </div>
          )}

          {/* TAB 4: NET BANKING */}
          {paymentMode === 'netbanking' && (
            <div className="space-y-3 font-mono text-xs">
              <label className="text-brand-dark/70 font-bold uppercase tracking-wider block">Select Your Bank</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Chase Bank', 'Citi Private'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-colors ${
                      selectedBank === b
                        ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                        : 'bg-white text-brand-dark/80 border-brand-dark/15 hover:border-brand-dark/40'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Processing / Verification Indicator */}
          {stage !== 'idle' && (
            <div className="bg-brand-dark text-white p-4 rounded-2xl space-y-2 text-center animate-fade-up font-mono">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {stage === 'processing'
                    ? 'Processing with 3D-Secure Network...'
                    : 'Authorized! Minting Atomic Pass...'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Locking inventory atomicity • Guaranteeing zero double-allocation</p>
            </div>
          )}

          {/* Pay Button */}
          {stage === 'idle' && (
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-4 bg-brand-green hover:bg-brand-dark text-white font-bold text-sm uppercase tracking-wider rounded-full transition-colors flex items-center justify-center space-x-2 shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Authorize & Pay ${grandTotal.toFixed(2)}</span>
            </button>
          )}

          {/* Guarantee Badges Footer */}
          <div className="flex items-center justify-center space-x-6 text-[10px] font-mono text-brand-dark/50 pt-2 border-t border-brand-dark/10">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
              <span>100% Refund Guarantee</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
              <span>Instant Pass Delivery</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
