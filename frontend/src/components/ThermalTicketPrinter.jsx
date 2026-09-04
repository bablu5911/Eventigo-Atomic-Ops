import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Scissors, 
  Download, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';

// Code 39 Barcode standard encoding map (pure vanilla JS)
const CODE39_MAP = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110000000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

/**
 * Generate pure SVG barcode bars for any text
 */
function renderBarcodeSVG(rawText) {
  const sanitized = (rawText || 'ATOM-PASS')
    .toUpperCase()
    .replace(/[^0-9A-Z\-.$/+% ]/g, '-');
  const encodedStr = `*${sanitized}*`;

  const narrowWidth = 2;
  const wideWidth = 5;
  const gapWidth = 2;
  const barHeight = 44;

  let currentX = 12; // Initial quiet zone padding
  const rects = [];

  for (let i = 0; i < encodedStr.length; i++) {
    const char = encodedStr[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP['-'];

    for (let p = 0; p < pattern.length; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === '1';
      const width = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push({
          x: currentX,
          y: 0,
          width,
          height: barHeight
        });
      }
      currentX += width;
    }
    // Inter-character space
    currentX += gapWidth;
  }

  const totalWidth = currentX + 10;

  return { totalWidth, barHeight, rects };
}

/**
 * Subtle synthesized sound effects for thermal motor and paper tear
 */
function playThermalSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'print') {
      // Rapid soft mechanical pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'tear') {
      // Crisp tear noise burst
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  } catch (e) {
    // Audio optional / blocked by browser autoplay policy
  }
}

export default function ThermalTicketPrinter({ booking, onFinish, onClose }) {
  // Normalize booking payload to support both nested event models and flat fixtures
  const bookingCode = booking?.bookingCode || 'ATOM-2026-PASS-9901';
  const eventTitle = booking?.eventName || booking?.event?.title || 'Atomic Live Festival 2026';
  const startDateTime = booking?.startDateTime || booking?.event?.startDateTime;
  const rawVenue = booking?.venue || booking?.event?.venue || { name: 'Grand Arena', city: 'Metro' };
  const venueString = typeof rawVenue === 'string'
    ? rawVenue
    : `${rawVenue?.name || 'Grand Arena'}${rawVenue?.city ? `, ${rawVenue.city}` : ''}`;
  
  const rawTickets = booking?.tickets || [];
  const ticketsList = rawTickets.length > 0
    ? rawTickets
    : [{ nameSnapshot: 'Standard Access Pass', priceSnapshot: booking?.totalAmount || 49, quantity: 1 }];
  
  const totalAmount = Number(booking?.totalAmount || 0);
  const userEmail = booking?.userEmail || booking?.user?.email || 'attendee@atomicops.com';
  const bookingId = booking?._id || booking?.id;
  const gateEntry = booking?.gateEntry || 'Gate A • Express FastTrack';

  // Component States: 'idle' | 'printing' | 'printed' | 'tearing' | 'torn'
  const [printState, setPrintState] = useState('idle');
  const [printCount, setPrintCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Staggered row animation index during printing
  const [revealedLines, setRevealedLines] = useState(0);
  const totalPrintLines = 14;

  const paperFeedRef = useRef(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Formatted event date/time
  const formattedDate = startDateTime 
    ? new Date(startDateTime).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Confirmed Event Date';

  // Format currency
  const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

  // Barcode data
  const { totalWidth, barHeight, rects } = renderBarcodeSVG(bookingCode);

  // Line item subtotal
  const itemsSubtotal = ticketsList.reduce(
    (acc, t) => acc + (t.priceSnapshot || 0) * (t.quantity || 1),
    0
  );
  const discountVal = Number(booking?.discountAmount || 0);
  const platformFee = itemsSubtotal > 0 ? 2.50 : 0;
  const finalCalculatedTotal = Math.max(0, totalAmount || (itemsSubtotal - discountVal + platformFee));

  // Handle Print Trigger
  const handlePrint = () => {
    if (printState === 'printing') return;

    setPrintState('printing');
    setRevealedLines(0);

    if (soundEnabled) {
      playThermalSound('print');
    }

    if (prefersReducedMotion) {
      setRevealedLines(totalPrintLines);
      setPrintState('printed');
      return;
    }

    // Step-by-step line reveal simulating thermal head pass
    let currentLine = 0;
    const lineInterval = setInterval(() => {
      currentLine += 1;
      setRevealedLines(currentLine);

      if (soundEnabled && currentLine % 4 === 0) {
        playThermalSound('print');
      }

      if (currentLine >= totalPrintLines) {
        clearInterval(lineInterval);
        setTimeout(() => {
          setPrintState('printed');
        }, 200);
      }
    }, 110);
  };

  // Handle Tear Trigger
  const handleTear = () => {
    if (printState !== 'printed') return;

    if (soundEnabled) {
      playThermalSound('tear');
    }

    setPrintState('tearing');

    setTimeout(() => {
      setPrintState('torn');
      setPrintCount((c) => c + 1);
    }, prefersReducedMotion ? 50 : 400);
  };

  // Reset to print again
  const handlePrintAgain = () => {
    setPrintState('idle');
    setRevealedLines(0);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#1d1c19]/90 backdrop-blur-md animate-fade-in font-sans selection:bg-amber-200"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.09) 0%, rgba(29, 28, 25, 0.98) 75%)'
      }}
    >
      {/* Device Enclosure Frame */}
      <div className="relative w-full max-w-lg bg-[#252422] border border-[#383632] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-5 sm:p-7 overflow-hidden text-neutral-200 my-6">
        
        {/* Subtle Brushed Metal Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600/30 via-emerald-500/40 to-amber-600/30" />

        {/* Chassis Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#383632]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-neutral-300 tracking-wider uppercase">
                Atomic Thermal Feed TP-800
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#171615] border border-[#383632] text-amber-400 font-semibold">
                HEAD 203 DPI
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Mechanical Audio' : 'Enable Mechanical Audio'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#1a1917] border border-[#383632] transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            {/* Exit / Return Button */}
            <button
              type="button"
              onClick={onClose || onFinish}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-[#1a1917] border border-[#383632] transition-colors"
              title="Close Printer Window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LCD Digital Display Panel */}
        <div className="mt-4 bg-[#121211] border border-[#2e2d2a] p-3.5 sm:p-4 rounded-2xl shadow-inner font-mono text-xs space-y-2 relative overflow-hidden">
          {/* LCD scanline simulation */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:8px_8px]"
          />

          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment Verified & Stock Locked</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold">
              {printCount > 0 ? `PRINTED: ${printCount}X` : 'STATUS: READY'}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="text-sm font-bold text-neutral-100 truncate">
              {eventTitle}
            </div>
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>Tier: {ticketsList.map((t) => `${t.nameSnapshot} (x${t.quantity})`).join(', ')}</span>
              <span className="text-white font-bold">{formatMoney(finalCalculatedTotal)}</span>
            </div>
          </div>
        </div>

        {/* Printer Action Button Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {printState === 'idle' && (
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#141312] font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket Pass</span>
            </button>
          )}

          {printState === 'printing' && (
            <button
              type="button"
              disabled
              className="w-full py-3 px-6 bg-[#1a1917] border border-[#383632] text-amber-400 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 cursor-wait"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Feeding Thermal Paper...</span>
            </button>
          )}

          {printState === 'printed' && (
            <button
              type="button"
              onClick={handleTear}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-2 animate-pulse active:scale-[0.99]"
            >
              <Scissors className="w-4 h-4" />
              <span>✂️ Tear Off Ticket</span>
            </button>
          )}

          {printState === 'tearing' && (
            <button
              type="button"
              disabled
              className="w-full py-3 px-6 bg-[#1a1917] border border-[#383632] text-neutral-400 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2"
            >
              <Scissors className="w-4 h-4 text-emerald-400" />
              <span>Tearing Paper Edge...</span>
            </button>
          )}

          {printState === 'torn' && (
            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handlePrintAgain}
                className="flex-1 w-full py-2.5 px-4 bg-[#1e1d1b] hover:bg-[#2e2d2a] border border-[#383632] text-neutral-300 font-mono font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Again</span>
              </button>

              {bookingId && (
                <a
                  href={`/api/bookings/${bookingId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 w-full py-2.5 px-4 bg-brand-cream text-brand-dark hover:bg-white border border-brand-dark/20 font-mono font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center space-x-1.5 text-center"
                >
                  <Download className="w-3.5 h-3.5 text-brand-green" />
                  <span>Download PDF</span>
                </a>
              )}

              <button
                type="button"
                onClick={onFinish}
                className="flex-1 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase rounded-xl transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>My Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* PRINTER MOUTH: Recessed Slit Shape */}
        <div className="mt-6 relative">
          {/* Beveled Top Edge of the Mouth */}
          <div className="w-[92%] mx-auto h-1.5 bg-[#171615] rounded-t-sm shadow-inner" />
          
          {/* Main Slot Opening */}
          <div className="w-[90%] mx-auto h-4 bg-[#0d0c0b] border-t-2 border-b border-[#050505] shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] relative flex items-center justify-center overflow-visible">
            {/* Roller guides */}
            <div className="absolute left-2 w-2.5 h-1.5 bg-[#252422] rounded-xs border border-[#383632]" />
            <div className="absolute right-2 w-2.5 h-1.5 bg-[#252422] rounded-xs border border-[#383632]" />
          </div>

          {/* Bottom Lip Shadow */}
          <div className="w-[92%] mx-auto h-1 bg-[#1e1d1b] rounded-b-sm" />
        </div>

        {/* RECEIPT PAPER CONTAINER (Emerging downwards from the mouth) */}
        <div className="relative w-full overflow-hidden pt-0 flex justify-center min-h-[30px]">
          
          {/* Post-Tear Empty Slot View */}
          {printState === 'torn' && (
            <div className="py-8 text-center font-mono text-xs space-y-2 text-neutral-400 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-bold text-neutral-200">Ticket Torn & Collected</p>
              <p className="text-[11px] text-neutral-500">
                A digital pass and QR code have been deposited into your Ticket Wallet.
              </p>
            </div>
          )}

          {/* Actual Receipt Paper */}
          {printState !== 'torn' && (
            <div 
              ref={paperFeedRef}
              className={`w-[86%] sm:w-[84%] bg-[#f6f1e4] text-[#1a1917] font-mono text-xs shadow-2xl transition-all ${
                printState === 'idle'
                  ? 'max-h-[14px] overflow-hidden opacity-90'
                  : printState === 'printing'
                  ? 'max-h-[640px] duration-[1800ms] ease-out overflow-hidden'
                  : printState === 'tearing'
                  ? 'max-h-[640px] transform translate-y-10 rotate-[-3deg] opacity-0 scale-[0.97] duration-400 ease-in pointer-events-none'
                  : 'max-h-[640px]'
              }`}
              style={{
                boxShadow: '0 12px 25px rgba(0, 0, 0, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.6)'
              }}
            >
              {/* Top Shadow where paper exits the dark mouth */}
              <div className="h-2 w-full bg-gradient-to-b from-black/25 to-transparent" />

              <div className="px-5 py-4 space-y-3">
                {/* 1. Brand Header */}
                <div 
                  className={`text-center transition-all duration-300 ${
                    revealedLines >= 1 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="font-extrabold tracking-widest text-xs uppercase text-[#111111]">
                    ✦ EVENTIGO TICKETING ✦
                  </div>
                  <div className="text-[9px] text-[#444] tracking-wider uppercase mt-0.5">
                    VERIFIED ACCESS PASS
                  </div>
                </div>

                {/* 2. Event Title & Date */}
                <div 
                  className={`text-center space-y-0.5 border-t border-b border-dashed border-[#a39e93] py-2 transition-all duration-300 ${
                    revealedLines >= 2 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="font-bold text-sm text-[#111111] leading-tight">
                    {eventTitle}
                  </div>
                  <div className="text-[10px] text-[#333]">
                    {formattedDate}
                  </div>
                  {/* 3. Venue & City */}
                  <div className="text-[10px] text-[#555] font-semibold">
                    📍 {venueString}
                  </div>
                  <div className="text-[9px] text-[#666]">
                    Gate: {gateEntry}
                  </div>
                </div>

                {/* 4. Dashed Divider & Line Items */}
                <div 
                  className={`space-y-1.5 text-[11px] transition-all duration-300 ${
                    revealedLines >= 4 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[9px] uppercase tracking-wider text-[#666] pb-1 border-b border-dashed border-[#b8b3a7]">
                    <span>Item / Tier</span>
                    <span>Qty</span>
                    <span>Price</span>
                  </div>

                  {ticketsList.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[#111111]">
                      <span className="font-semibold truncate max-w-[140px]">{t.nameSnapshot}</span>
                      <span className="text-[#555]">x{t.quantity}</span>
                      <span className="font-bold">{formatMoney((t.priceSnapshot || 0) * (t.quantity || 1))}</span>
                    </div>
                  ))}
                </div>

                {/* 5. Subtotal, Fee, Discount & Total */}
                <div 
                  className={`border-t border-dashed border-[#a39e93] pt-2 space-y-1 text-[11px] transition-all duration-300 ${
                    revealedLines >= 6 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="flex justify-between text-[#444]">
                    <span>Subtotal</span>
                    <span>{formatMoney(itemsSubtotal)}</span>
                  </div>

                  {discountVal > 0 && (
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Discount ({booking?.promoCode || 'Promo'})</span>
                      <span>-{formatMoney(discountVal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#555]">
                    <span>Platform Service Fee</span>
                    <span>{formatMoney(platformFee)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-[#111111] pt-1.5 border-t border-[#111111] mt-1">
                    <span>TOTAL DUE</span>
                    <span>{formatMoney(finalCalculatedTotal)}</span>
                  </div>
                </div>

                {/* 6. Metadata */}
                <div 
                  className={`border-t border-dashed border-[#a39e93] pt-2 space-y-0.5 text-[10px] text-[#444] transition-all duration-300 ${
                    revealedLines >= 8 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-[#666]">Booking Ref:</span>
                    <span className="font-bold text-[#111111] select-all">{bookingCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Paid with:</span>
                    <span>Online Checkout (3D-Sec)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Attendee:</span>
                    <span className="truncate max-w-[150px]">{userEmail}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Status:</span>
                    <span>CONFIRMED & ISSUED</span>
                  </div>
                </div>

                {/* 7. Programmatic SVG Barcode */}
                <div 
                  className={`pt-2 text-center transition-all duration-300 ${
                    revealedLines >= 10 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="flex justify-center my-1 bg-white p-2 rounded border border-[#cfcac0]">
                    <svg
                      width="100%"
                      height="46"
                      viewBox={`0 0 ${totalWidth} ${barHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      className="max-w-[260px]"
                    >
                      {rects.map((r, idx) => (
                        <rect
                          key={idx}
                          x={r.x}
                          y={r.y}
                          width={r.width}
                          height={r.height}
                          fill="#111111"
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="text-[10px] font-bold text-[#111111] tracking-widest mt-0.5">
                    {bookingCode}
                  </div>
                </div>

                {/* 8. Footer Disclaimer */}
                <div 
                  className={`border-t border-dashed border-[#a39e93] pt-2 text-center text-[9px] text-[#555] space-y-0.5 transition-all duration-300 ${
                    revealedLines >= 12 || printState === 'printed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  <div className="font-semibold text-[#333]">
                    Valid for single entry. Present at gate scanner.
                  </div>
                  <div className="text-[8px] text-[#777]">
                    Eventigo Verified Platform • Anti-Counterfeit Locked
                  </div>
                </div>
              </div>

              {/* REALISTIC ZIG-ZAG TORN PAPER BOTTOM EDGE */}
              <div className="w-full relative leading-none -mb-[1px]">
                <svg
                  className="w-full h-3.5 block fill-[#f6f1e4]"
                  viewBox="0 0 120 8"
                  preserveAspectRatio="none"
                >
                  <polygon points="
                    0,0 
                    3,8 6,0 9,8 12,0 15,8 18,0 21,8 24,0 27,8 30,0 
                    33,8 36,0 39,8 42,0 45,8 48,0 51,8 54,0 57,8 60,0 
                    63,8 66,0 69,8 72,0 75,8 78,0 81,8 84,0 87,8 90,0 
                    93,8 96,0 99,8 102,0 105,8 108,0 111,8 114,0 117,8 120,0 
                    120,0 0,0
                  " />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Chassis Footer Details */}
        <div className="mt-4 pt-3 border-t border-[#383632]/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>ATOMIC THERMAL ENGINE v2.4</span>
          <span>EMV COMPLIANT RECEIPT</span>
        </div>
      </div>
    </div>
  );
}
