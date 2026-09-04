import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ShieldCheck, UserCheck, Users, RefreshCw, BarChart2, Award, ChevronDown, ChevronUp } from 'lucide-react';

export default function ScannerMetricsBar({ eventId, refreshTrigger = 0 }) {
  const [metrics, setMetrics] = useState({
    personalCount: 0,
    totalAdmitted: 0,
    totalTickets: 0,
    remainingTickets: 0,
    checkedInPercent: 0,
    teamCheckers: []
  });
  const [loading, setLoading] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const url = eventId && eventId !== 'all'
        ? `/bookings/scanner-metrics?eventId=${encodeURIComponent(eventId)}`
        : `/bookings/scanner-metrics`;
      const res = await api.get(url);
      if (res.data?.success && res.data.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load scanner metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshTrigger]);

  const { personalCount, totalAdmitted, totalTickets, remainingTickets, checkedInPercent, teamCheckers } = metrics;

  return (
    <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-white font-helvetica-neue">
      {/* Top Header & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold uppercase tracking-tight text-white">Live Gate Scanner Telemetry</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Individual staff performance &amp; synchronized turnstile team counts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={loading}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Sync Counts</span>
        </button>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* Metric 1: Personal Scanned Count */}
        <div className="bg-gradient-to-br from-cyan-950/60 to-neutral-950 p-4 rounded-2xl border border-cyan-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-12 h-12 text-cyan-400" />
          </div>
          <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Your Scans</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            {personalCount}
          </div>
          <div className="text-[10px] text-cyan-200/70 font-sans mt-0.5">
            Verified by you at this gate
          </div>
        </div>

        {/* Metric 2: Total Gate Turnout */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-neutral-950 p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Total Admitted</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            {totalAdmitted}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {totalTickets}</span>
          </div>
          <div className="text-[10px] text-emerald-200/70 font-sans mt-0.5">
            {checkedInPercent}% overall venue turnout
          </div>
        </div>

        {/* Metric 3: Remaining Outside */}
        <div className="bg-gradient-to-br from-amber-950/40 to-neutral-950 p-4 rounded-2xl border border-amber-500/20 relative overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            Outside Gate
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1 tracking-tight">
            {remainingTickets}
          </div>
          <div className="text-[10px] text-amber-200/60 font-sans mt-0.5">
            Pending arrival &amp; check-in
          </div>
        </div>

        {/* Metric 4: Active Checkers Roster Toggle */}
        <div 
          onClick={() => setTeamExpanded(!teamExpanded)}
          className="bg-neutral-950 p-4 rounded-2xl border border-white/10 flex flex-col justify-between cursor-pointer hover:border-white/20 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Checker Team
            </div>
            {teamExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white" />
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {teamCheckers.length || (personalCount > 0 ? 1 : 0)} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
          <div className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1">
            <span>{teamExpanded ? 'Hide team breakdown' : 'View all checker stats'}</span>
          </div>
        </div>
      </div>

      {/* Turnstile Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Gate Processing Progress</span>
          <span className="text-emerald-400 font-bold">{checkedInPercent}% Checked In</span>
        </div>
        <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, checkedInPercent))}%` }}
          />
        </div>
      </div>

      {/* Team Checkers Roster Detail (Expanded View) */}
      {teamExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Gate Checker Staff Leaderboard</span>
            </span>
            <span>Total Checkers: {teamCheckers.length}</span>
          </div>

          {teamCheckers.length === 0 ? (
            <div className="text-center py-4 text-xs font-mono text-slate-400 bg-neutral-950/60 rounded-2xl border border-white/5">
              No ticket scans logged by staff yet for this event gate.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {teamCheckers.map((checker, index) => {
                const isTop = index === 0;
                return (
                  <div
                    key={checker.staffId || index}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      isTop
                        ? 'bg-cyan-950/40 border-cyan-500/40 shadow-sm'
                        : 'bg-neutral-950/70 border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                        isTop ? 'bg-cyan-500 text-neutral-950' : 'bg-white/10 text-slate-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 flex items-center space-x-1">
                          <span>{checker.name || 'Gate Checker'}</span>
                          {isTop && <span className="text-[10px]">👑</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {checker.lastScanAt ? `Last: ${new Date(checker.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-cyan-400">{checker.count}</div>
                      <div className="text-[9px] text-slate-500 uppercase">passes</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
