import React from 'react';
import { Triangle, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-dark/10 bg-brand-cream text-brand-dark/70 py-12 text-sm font-helvetica-neue">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <Triangle className="w-5 h-5 text-brand-dark fill-brand-dark" />
            <div>
              <p className="text-base font-bold text-brand-dark tracking-tight uppercase">Atomic Ops</p>
              <p className="text-xs text-brand-dark/50">High-Concurrency Event & Ticketing Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono text-brand-dark/70">
            <span className="flex items-center space-x-1.5 text-brand-green font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Atomic Concurrency Guard Active</span>
            </span>
            <span className="flex items-center space-x-1.5 text-brand-dark">
              <Zap className="w-4 h-4 text-brand-green" />
              <span>MongoDB Transactions Enabled</span>
            </span>
          </div>

          <p className="text-xs text-brand-dark/50 font-mono">
            &copy; {new Date().getFullYear()} Atomic Ops. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
