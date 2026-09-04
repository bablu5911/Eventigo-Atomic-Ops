import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  DollarSign, 
  Ticket, 
  Users, 
  Shield, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Crown,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, venues, tiers, admins

  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/superadmin');
      return res.data.data;
    }
  });

  const financials = dashboardData?.financials || {
    grossRevenue: 0,
    venueCommissionRate: 20,
    venueNetEarnings: 0,
    organizerPayouts: 0,
    totalBookings: 0,
    totalTicketsSold: 0,
    averageTicketYield: 0
  };

  const capacity = dashboardData?.capacityAnalytics || {
    totalPlatformCapacity: 0,
    totalSeatsReserved: 0,
    seatsAvailable: 0,
    occupancyRate: 0
  };

  const venueBreakdown = dashboardData?.venueBreakdown || [];
  const tierBreakdown = dashboardData?.tierBreakdown || [];
  const admins = dashboardData?.admins || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-10 px-6 font-helvetica-neue text-brand-dark">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-dark/10 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Executive Suite • Venue Owner & Financial Director</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight uppercase">
            Venue Owner & Financial Intelligence
          </h1>
          <p className="text-xs text-brand-dark/70 font-mono mt-1">
            Real-time gross earnings, venue facility commission, seat reservation velocity & admin supervisory oversight
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              refetch();
              toast.success('Financial and capacity metrics updated');
            }}
            disabled={isFetching}
            className="px-4 py-2.5 bg-white hover:bg-brand-cream border border-brand-dark/20 text-xs font-mono font-bold rounded-full flex items-center space-x-2 text-brand-dark transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Sync Financials'}</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex space-x-2 border-b border-brand-dark/10 pb-2 overflow-x-auto text-xs font-bold uppercase font-mono tracking-wider">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('venues')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'venues'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Venue Occupancy & Seats ({venueBreakdown.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'tiers'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>Ticket Tier Sales ({tierBreakdown.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'admins'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Oversight ({admins.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60">Aggregating Venue Analytics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Financial KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Gross Platform Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-brand-dark/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-dark/50">Total Gross Sells</span>
                    <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-brand-dark">
                    ${financials.grossRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] font-mono text-brand-dark/60 mt-2 flex items-center space-x-1">
                    <span>From {financials.totalBookings} customer transactions</span>
                  </p>
                </div>

                {/* Venue Owner Net Earnings */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-2xl p-6 border border-amber-500/30 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-800">Venue Owner Earnings (20%)</span>
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700">
                      <Crown className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-900">
                    ${financials.venueNetEarnings?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] font-mono text-amber-800/80 mt-2">
                    Direct facility take & licensing yield
                  </p>
                </div>

                {/* Total Seats Reserved / Occupancy */}
                <div className="bg-white rounded-2xl p-6 border border-brand-dark/10 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-dark/50">Total Seats Reserved</span>
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-brand-dark">
                    {capacity.totalSeatsReserved?.toLocaleString()} <span className="text-sm font-normal text-brand-dark/50">/ {capacity.totalPlatformCapacity?.toLocaleString()}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
                      <span>Occupancy</span>
                      <span className="text-purple-700">{capacity.occupancyRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-dark/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, capacity.occupancyRate)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Average Ticket Yield */}
                <div className="bg-white rounded-2xl p-6 border border-brand-dark/10 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-dark/50">Average Ticket Yield</span>
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-brand-dark">
                    ${financials.averageTicketYield}
                  </div>
                  <p className="text-[11px] font-mono text-brand-dark/60 mt-2">
                    Across {financials.totalTicketsSold} verified attendee passes
                  </p>
                </div>
              </div>

              {/* Venue Asset Capacity Breakdown Grid */}
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-amber-600" />
                      <span>Physical Venue Assets & Seat Reservation Rates</span>
                    </h2>
                    <p className="text-xs text-brand-dark/60 font-mono mt-1">
                      Capacity allocation, reserved seating, and facility earnings breakdown per venue location
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-cream border border-brand-dark/15 text-[11px] font-mono font-bold">
                    {venueBreakdown.length} Venues Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venueBreakdown.map((venue, idx) => (
                    <div 
                      key={idx} 
                      className="p-6 rounded-2xl border border-brand-dark/10 bg-brand-cream/30 hover:bg-brand-cream/60 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-base text-brand-dark">{venue.venueName}</h3>
                          <p className="text-xs text-brand-dark/60 font-mono flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-brand-green" />
                            <span>{venue.city}</span>
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white border border-brand-dark/10 text-brand-dark">
                          {venue.eventsCount} {venue.eventsCount === 1 ? 'Event' : 'Events'}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-brand-dark/10">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-brand-dark/60">Total Capacity:</span>
                          <span className="font-bold text-brand-dark">{venue.totalCapacity.toLocaleString()} seats</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-brand-dark/60">Seats Reserved:</span>
                          <span className="font-bold text-purple-700">{venue.seatsReserved.toLocaleString()} seats</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-brand-dark/60">Venue Earnings Cut:</span>
                          <span className="font-bold text-brand-green">${venue.venueNetCut?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono font-bold">
                          <span className="text-brand-dark/50">Occupancy</span>
                          <span className="text-brand-dark">{venue.occupancyPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-brand-dark/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              venue.occupancyPercent > 75 ? 'bg-amber-500' : 'bg-brand-green'
                            }`}
                            style={{ width: `${Math.min(100, venue.occupancyPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown Summary Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Distribution */}
                <div className="bg-white rounded-3xl p-7 border border-brand-dark/10 shadow-sm space-y-5">
                  <h3 className="font-bold text-base uppercase tracking-tight flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-brand-green" />
                    <span>Financial Revenue Allocation</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-brand-cream/40 border border-brand-dark/5">
                      <div>
                        <div className="font-bold text-sm text-brand-dark">Gross Platform Volume</div>
                        <div className="text-[11px] font-mono text-brand-dark/60">Total customer checkout value</div>
                      </div>
                      <div className="font-mono font-bold text-base text-brand-dark">
                        ${financials.grossRevenue?.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div>
                        <div className="font-bold text-sm text-amber-900">Venue Owner Profit Cut (20%)</div>
                        <div className="text-[11px] font-mono text-amber-800/80">Retained facility lease & commission</div>
                      </div>
                      <div className="font-mono font-bold text-base text-amber-900">
                        ${financials.venueNetEarnings?.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/60 border border-blue-200/50">
                      <div>
                        <div className="font-bold text-sm text-blue-950">Organizer Payout Pool (80%)</div>
                        <div className="text-[11px] font-mono text-blue-800/70">Disbursed to assigned event producers</div>
                      </div>
                      <div className="font-mono font-bold text-base text-blue-900">
                        ${financials.organizerPayouts?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supervisory Admin Overview Card */}
                <div className="bg-white rounded-3xl p-7 border border-brand-dark/10 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base uppercase tracking-tight flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-purple-700" />
                      <span>Admin Oversight Roster</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('admins')}
                      className="text-xs font-mono font-bold text-purple-700 hover:underline flex items-center space-x-1"
                    >
                      <span>View Full Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-brand-dark/70 font-mono">
                    The Super Admin supervises operational Admins who manage event ticketing, staff assignments, and organizer coordination.
                  </p>

                  <div className="space-y-3">
                    {admins.slice(0, 3).map((admin) => (
                      <div key={admin._id} className="p-4 rounded-xl border border-brand-dark/10 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-brand-dark">{admin.name}</div>
                            <div className="text-[11px] font-mono text-brand-dark/50">{admin.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-mono text-[10px] font-bold uppercase">
                            {admin.status}
                          </span>
                          <div className="text-[10px] font-mono text-brand-dark/50 mt-1">
                            {admin.assignedStaffCount} Staff Assigned
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENUE CAPACITY & SEAT OCCUPANCY MATRIX */}
          {activeTab === 'venues' && (
            <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <span>Venue Seating & Capacity Utilization Matrix</span>
                </h2>
                <p className="text-xs text-brand-dark/60 font-mono mt-1">
                  Complete list of facilities, booked passes, and empty seat inventory
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">Venue Asset</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Hosted Events</th>
                      <th className="py-3 px-4">Seat Capacity</th>
                      <th className="py-3 px-4">Reserved Seats</th>
                      <th className="py-3 px-4">Occupancy</th>
                      <th className="py-3 px-4">Gross Revenue</th>
                      <th className="py-3 px-4">Venue Cut (20%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {venueBreakdown.map((venue, idx) => (
                      <tr key={idx} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-brand-dark">{venue.venueName}</td>
                        <td className="py-4 px-4 text-brand-dark/70">{venue.city}</td>
                        <td className="py-4 px-4 font-bold">{venue.eventsCount}</td>
                        <td className="py-4 px-4">{venue.totalCapacity.toLocaleString()}</td>
                        <td className="py-4 px-4 font-bold text-purple-700">{venue.seatsReserved.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            venue.occupancyPercent > 50 ? 'bg-amber-100 text-amber-800' : 'bg-brand-green/10 text-brand-green'
                          }`}>
                            {venue.occupancyPercent}%
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold">${venue.grossRevenue.toFixed(2)}</td>
                        <td className="py-4 px-4 font-bold text-amber-700">${venue.venueNetCut.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TICKET TIER SALES */}
          {activeTab === 'tiers' && (
            <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  <span>Ticket Tier Performance & Pricing Yield</span>
                </h2>
                <p className="text-xs text-brand-dark/60 font-mono mt-1">
                  Sales volume, unit pricing, and total revenue yield per pass category
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tierBreakdown.map((tier, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-brand-dark/10 bg-brand-cream/30 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-brand-dark">{tier.name}</h3>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-white rounded-full border border-brand-dark/10">
                        ${tier.price}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-brand-dark/10 pt-3 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-brand-dark/60">Tickets Sold:</span>
                        <span className="font-bold text-brand-dark">{tier.sold} passes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-dark/60">Gross Revenue:</span>
                        <span className="font-bold text-brand-green">${tier.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-dark/60">Venue Facility Cut:</span>
                        <span className="font-bold text-amber-700">${(tier.revenue * 0.2).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN OVERSIGHT */}
          {activeTab === 'admins' && (
            <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-700" />
                    <span>Administrator Directory & Supervisory Audit</span>
                  </h2>
                  <p className="text-xs text-brand-dark/60 font-mono mt-1">
                    The Super Admin / Venue Owner oversees all Platform Admins (Events & Staff Managers)
                  </p>
                </div>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 font-mono text-xs font-bold rounded-full border border-purple-200">
                  {admins.length} Admins Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">Administrator</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Operational Role</th>
                      <th className="py-3 px-4">Managed Platform Events</th>
                      <th className="py-3 px-4">Staff Assigned</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {admins.map((admin) => (
                      <tr key={admin._id} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-brand-dark flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold text-[10px]">
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{admin.name}</span>
                        </td>
                        <td className="py-4 px-4 text-brand-dark/70">{admin.email}</td>
                        <td className="py-4 px-4 font-bold text-purple-700">Events, Ticket & Staff Manager</td>
                        <td className="py-4 px-4 font-bold">{admin.managedEventsCount} Events</td>
                        <td className="py-4 px-4 font-bold text-brand-green">{admin.assignedStaffCount} Staff Assigned</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase">
                            {admin.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
