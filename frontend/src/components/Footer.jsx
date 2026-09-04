import React from 'react';
import { ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md text-slate-400 py-12 text-sm font-helvetica-neue">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black text-sm shadow-md shadow-emerald-500/30">
              E
            </div>
            <div>
              <p className="text-base font-extrabold text-white tracking-tight">Eventigo</p>
              <p className="text-xs text-slate-400">Discover, book, and host unforgettable live events</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-300">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Verified Tickets</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Instant QR Entry</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Secure Checkout</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} Eventigo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
