import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Lock,
  Unlock,
  Sliders,
  Cpu,
  Server,
  Activity,
  FileText,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Trash2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, venues, tiers, admins, controls, settlements, telemetry

  // Main executive dashboard metrics
  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/superadmin');
      return res.data.data;
    }
  });

  // Venue settings & lockdown state
  const [venueSettings, setVenueSettings] = useState({
    venueCommissionRate: 20,
    emergencyGateLockdown: false,
    lockdownReason: '',
    lockdownActivatedAt: null,
    auditLogs: []
  });
  const [sliderCommission, setSliderCommission] = useState(20);
  const [savingCommission, setSavingCommission] = useState(false);

  // Admin management state
  const [adminsList, setAdminsList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [addAdminModal, setAddAdminModal] = useState(false);
  const [adminMode, setAdminMode] = useState('new'); // 'new' | 'promote'
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [promoteUserId, setPromoteUserId] = useState('');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Financial settlements state
  const [settlementData, setSettlementData] = useState(null);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [executingSettlement, setExecutingSettlement] = useState(false);
  const [settlementNotes, setSettlementNotes] = useState('');
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // System telemetry state
  const [diagnostics, setDiagnostics] = useState(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // Lockdown modal state
  const [lockdownModalOpen, setLockdownModalOpen] = useState(false);
  const [lockdownReasonInput, setLockdownReasonInput] = useState('');
  const [togglingLockdown, setTogglingLockdown] = useState(false);

  // Demote modal state
  const [demoteModalOpen, setDemoteModalOpen] = useState(false);
  const [selectedAdminForDemote, setSelectedAdminForDemote] = useState(null);
  const [targetDemoteRole, setTargetDemoteRole] = useState('organizer');

  useEffect(() => {
    fetchVenueSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'admins') fetchAdmins();
    if (activeTab === 'controls') fetchVenueSettings();
    if (activeTab === 'settlements') fetchSettlements();
    if (activeTab === 'telemetry') fetchDiagnostics();
  }, [activeTab]);

  const fetchVenueSettings = async () => {
    try {
      const res = await api.get('/superadmin/venue-settings');
      if (res.data?.success && res.data.settings) {
        setVenueSettings(res.data.settings);
        setSliderCommission(res.data.settings.venueCommissionRate || 20);
      }
    } catch (err) {
      console.error('Failed to load venue settings', err);
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get('/superadmin/admins');
      if (res.data?.success) {
        setAdminsList(res.data.admins || []);
      }
    } catch (err) {
      console.error('Failed to load admins', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchSettlements = async () => {
    setLoadingSettlements(true);
    try {
      const res = await api.get('/superadmin/settlements');
      if (res.data?.success) {
        setSettlementData(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load settlements', err);
    } finally {
      setLoadingSettlements(false);
    }
  };

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const res = await api.get('/superadmin/diagnostics');
      if (res.data?.success) {
        setDiagnostics(res.data.diagnostics);
      }
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  // Lockdown toggle
  const handleConfirmToggleLockdown = async () => {
    setTogglingLockdown(true);
    const targetState = !venueSettings.emergencyGateLockdown;
    try {
      const res = await api.post('/superadmin/lockdown', {
        enabled: targetState,
        reason: targetState ? (lockdownReasonInput.trim() || 'Super Admin Emergency Directive') : ''
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setLockdownModalOpen(false);
        setLockdownReasonInput('');
        fetchVenueSettings();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update gate lockdown status');
    } finally {
      setTogglingLockdown(false);
    }
  };

  // Commission update
  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const res = await api.put('/superadmin/venue-settings', {
        venueCommissionRate: Number(sliderCommission)
      });
      if (res.data?.success) {
        toast.success(`Venue facility commission updated to ${sliderCommission}%!`);
        fetchVenueSettings();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save commission settings');
    } finally {
      setSavingCommission(false);
    }
  };

  // Admin creation / promotion
  const handleAddOrPromoteAdmin = async (e) => {
    e.preventDefault();
    setSubmittingAdmin(true);
    try {
      const payload = adminMode === 'new' 
        ? { name: newAdminName, email: newAdminEmail, password: newAdminPassword }
        : { userId: promoteUserId };

      const res = await api.post('/superadmin/admins', payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Admin successfully configured!');
        setAddAdminModal(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setPromoteUserId('');
        fetchAdmins();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to configure Admin account');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Update Admin Status
  const handleUpdateAdminStatus = async (adminId, status) => {
    try {
      const res = await api.patch(`/superadmin/admins/${adminId}/status`, { status });
      if (res.data?.success) {
        toast.success(res.data.message || 'Admin status updated');
        fetchAdmins();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update Admin status');
    }
  };

  // Demote Admin
  const handleConfirmDemote = async () => {
    if (!selectedAdminForDemote) return;
    try {
      const res = await api.patch(`/superadmin/admins/${selectedAdminForDemote._id}/demote`, {
        newRole: targetDemoteRole
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Admin demoted successfully');
        setDemoteModalOpen(false);
        setSelectedAdminForDemote(null);
        fetchAdmins();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to demote Admin');
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to permanently delete Admin account "${adminName}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/superadmin/admins/${adminId}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Admin account deleted');
        fetchAdmins();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete Admin account');
    }
  };

  // Execute Settlement Batch
  const handleExecuteSettlement = async (e) => {
    e.preventDefault();
    setExecutingSettlement(true);
    try {
      const res = await api.post('/superadmin/settlements', { notes: settlementNotes });
      if (res.data?.success) {
        toast.success(res.data.message || 'Settlement batch executed successfully!');
        setSettleModalOpen(false);
        setSettlementNotes('');
        fetchSettlements();
        fetchVenueSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to execute settlement');
    } finally {
      setExecutingSettlement(false);
    }
  };

  const financials = dashboardData?.financials || {
    grossRevenue: 0,
    venueCommissionRate: venueSettings.venueCommissionRate || 20,
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
  const admins = adminsList.length > 0 ? adminsList : (dashboardData?.admins || []);

  const projectedVenueCut = (financials.grossRevenue * (sliderCommission / 100)).toFixed(2);
  const projectedOrganizerPool = Math.max(0, financials.grossRevenue - Number(projectedVenueCut)).toFixed(2);

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
            Venue Owner & Super Admin Suite
          </h1>
          <p className="text-xs text-brand-dark/70 font-mono mt-1">
            Real-time financial yield, venue gate emergency controls, admin supervisory oversight & settlement engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-full border font-mono text-xs font-bold flex items-center space-x-2 ${
            venueSettings.emergencyGateLockdown
              ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}>
            {venueSettings.emergencyGateLockdown ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>GATES FROZEN (LOCKDOWN)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>GATES OPERATIONAL</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              refetch();
              fetchVenueSettings();
              if (activeTab === 'admins') fetchAdmins();
              if (activeTab === 'settlements') fetchSettlements();
              if (activeTab === 'telemetry') fetchDiagnostics();
              toast.success('System state re-synchronized');
            }}
            disabled={isFetching}
            className="px-4 py-2.5 bg-white hover:bg-brand-cream border border-brand-dark/20 text-xs font-mono font-bold rounded-full flex items-center space-x-2 text-brand-dark transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Sync All'}</span>
          </button>
        </div>
      </div>

      {venueSettings.emergencyGateLockdown && (
        <div className="p-5 bg-rose-600 text-white rounded-3xl shadow-xl border-2 border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-700 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-wide">
                ⚠️ PLATFORM-WIDE GATE LOCKDOWN IS CURRENTLY ACTIVE
              </div>
              <div className="text-xs text-rose-100 font-mono mt-0.5">
                {venueSettings.lockdownReason || 'Security order active.'} Door checkers and scanners are actively refusing ticket validation until lifted.
              </div>
            </div>
          </div>
          <button
            onClick={() => setLockdownModalOpen(true)}
            className="px-5 py-2.5 bg-white text-rose-700 font-bold text-xs rounded-full hover:bg-rose-50 transition-colors uppercase font-mono tracking-wider shadow-sm self-start sm:self-auto"
          >
            Lift Lockdown Now
          </button>
        </div>
      )}

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
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'controls'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span>Venue Controls & Gate Security</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'admins'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-purple-600" />
          <span>Admin Management ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'settlements'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>Financial Settlements</span>
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
          <span>Venues & Seats ({venueBreakdown.length})</span>
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
          <span>Tier Sales ({tierBreakdown.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
            activeTab === 'telemetry'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'bg-white/60 text-brand-dark/60 hover:text-brand-dark hover:bg-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>System Diagnostics</span>
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

          {/* TAB: VENUE CONTROLS & GATE SECURITY */}
          {activeTab === 'controls' && (
            <div className="space-y-8">
              {/* Emergency Gate Lockdown Section */}
              <div className={`rounded-3xl p-8 border shadow-sm transition-all ${
                venueSettings.emergencyGateLockdown
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-white border-brand-dark/10'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Security Protocol Zero</span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-dark">
                      Emergency Venue Gate Lockdown / Freeze
                    </h2>
                    <p className="text-xs text-brand-dark/70 font-mono max-w-2xl">
                      Instant kill switch for all door scanner check-ins and turnstiles platform-wide. When enabled, any ticket scanning at physical venue gates will immediately fail with a security lockdown order until lifted by Super Admin.
                    </p>
                    {venueSettings.emergencyGateLockdown && (
                      <div className="p-3 bg-rose-100 border border-rose-200 rounded-2xl text-xs font-mono text-rose-900 space-y-1 mt-3">
                        <div className="font-bold">Active Directive: {venueSettings.lockdownReason || 'Emergency order'}</div>
                        <div className="text-[11px] text-rose-800/80">Activated At: {venueSettings.lockdownActivatedAt ? new Date(venueSettings.lockdownActivatedAt).toLocaleString() : 'Recent'}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => setLockdownModalOpen(true)}
                      className={`px-6 py-4 font-bold text-sm rounded-2xl uppercase font-mono tracking-wider transition-all shadow-md flex items-center space-x-2 ${
                        venueSettings.emergencyGateLockdown
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                          : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                      }`}
                    >
                      {venueSettings.emergencyGateLockdown ? (
                        <>
                          <Unlock className="w-5 h-5" />
                          <span>Lift Emergency Lockdown</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Trigger Gate Lockdown</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Venue Commission Rate Slider */}
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
                      <Sliders className="w-3.5 h-3.5 text-amber-700" />
                      <span>Financial Yield Architecture</span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-dark">
                      Dynamic Venue Facility Commission Take
                    </h2>
                    <p className="text-xs text-brand-dark/60 font-mono mt-1">
                      Adjust the venue owner's percentage take across ticket sales. Real-time projected earnings recalculate automatically.
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-black text-amber-900 font-mono">
                      {sliderCommission}%
                    </div>
                    <div className="text-[10px] uppercase font-mono text-brand-dark/50">Active Venue Rate</div>
                  </div>
                </div>

                {/* Slider Input */}
                <div className="p-6 bg-brand-cream/40 border border-brand-dark/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-brand-dark/70">
                    <span>Minimum (5%)</span>
                    <span>Standard Venue Lease (20%)</span>
                    <span>Maximum Yield (50%)</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={sliderCommission}
                    onChange={(e) => setSliderCommission(Number(e.target.value))}
                    className="w-full h-3 bg-brand-dark/15 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                {/* Live Financial Projection Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-brand-cream/30 border border-brand-dark/10 space-y-1">
                    <div className="text-[11px] font-mono text-brand-dark/60 uppercase">Gross Platform Sells</div>
                    <div className="text-xl font-black text-brand-dark font-mono">
                      ${financials.grossRevenue?.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <div className="text-[11px] font-mono text-amber-800 uppercase font-bold">
                      Projected Venue Take ({sliderCommission}%)
                    </div>
                    <div className="text-xl font-black text-amber-900 font-mono">
                      ${projectedVenueCut}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                    <div className="text-[11px] font-mono text-blue-800 uppercase font-bold">
                      Projected Organizer Pool ({100 - sliderCommission}%)
                    </div>
                    <div className="text-xl font-black text-blue-900 font-mono">
                      ${projectedOrganizerPool}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveCommission}
                    disabled={savingCommission || sliderCommission === venueSettings.venueCommissionRate}
                    className="px-6 py-3 bg-brand-dark hover:bg-brand-green disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors uppercase font-mono tracking-wider shadow-sm flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{savingCommission ? 'Saving...' : 'Apply & Save Venue Commission'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMIN MANAGEMENT SUITE */}
          {activeTab === 'admins' && (
            <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-700" />
                    <span>Admin Operations Roster & Privilege Control</span>
                  </h2>
                  <p className="text-xs text-brand-dark/60 font-mono mt-1">
                    Super Admin exclusive: appoint platform admins, change administrative status, demote, or terminate admin access. Regular admins cannot modify Super Admins.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setAdminMode('new');
                      setAddAdminModal(true);
                    }}
                    className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase font-mono tracking-wide transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create / Appoint Admin</span>
                  </button>
                </div>
              </div>

              {loadingAdmins ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-purple-700 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                        <th className="py-3 px-4">Administrator</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Supervisory Scope</th>
                        <th className="py-3 px-4">Staff Managed</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {admins.map((adm) => (
                        <tr key={adm._id} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="py-4 px-4 font-sans font-bold text-brand-dark flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold text-xs">
                              {adm.name?.slice(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div>
                              <div>{adm.name}</div>
                              <div className="text-[10px] font-mono text-brand-dark/50">Admin ID: {adm._id?.slice(-6)}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-brand-dark/70">{adm.email}</td>
                          <td className="py-4 px-4 font-bold text-purple-700">Events, Ticket & Staff Manager</td>
                          <td className="py-4 px-4 font-bold text-brand-green">{adm.assignedStaffCount || 0} Staff Assigned</td>
                          <td className="py-4 px-4">
                            <select
                              value={adm.status || 'active'}
                              onChange={(e) => handleUpdateAdminStatus(adm._id, e.target.value)}
                              className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                                adm.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : adm.status === 'suspended'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="on_hold">On Hold</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAdminForDemote(adm);
                                  setDemoteModalOpen(true);
                                }}
                                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-mono font-bold transition-colors"
                                title="Demote Admin to Staff, Organizer, or Attendee"
                              >
                                Demote
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(adm._id, adm.name)}
                                className="p-1.5 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Admin Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANCIAL SETTLEMENTS & PAYOUTS */}
          {activeTab === 'settlements' && (
            <div className="space-y-8">
              {/* Financial Settlement Overview Cards */}
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Automated Financial Settlement & Escrow Simulator</span>
                    </h2>
                    <p className="text-xs text-brand-dark/60 font-mono mt-1">
                      Execute facility commission settlements, deduct payment gateway processing reserves, and generate organizer disbursement batches.
                    </p>
                  </div>

                  <button
                    onClick={() => setSettleModalOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase font-mono tracking-wide transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Execute Settlement Batch</span>
                  </button>
                </div>

                {loadingSettlements ? (
                  <div className="py-12 flex justify-center">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-brand-cream/40 border border-brand-dark/10">
                      <div className="text-[10px] uppercase font-mono font-bold text-brand-dark/50">Gross Volume</div>
                      <div className="text-2xl font-black text-brand-dark mt-1">
                        ${settlementData?.grossRevenue?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] font-mono text-brand-dark/60 mt-1">
                        {settlementData?.totalTransactions || 0} Confirmed Bookings
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                      <div className="text-[10px] uppercase font-mono font-bold text-amber-800">
                        Venue Facility Take ({venueSettings.venueCommissionRate || 20}%)
                      </div>
                      <div className="text-2xl font-black text-amber-900 mt-1">
                        ${settlementData?.venueNetTake?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] font-mono text-amber-700/80 mt-1">
                        Retained facility revenue
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                      <div className="text-[10px] uppercase font-mono font-bold text-rose-800">
                        Stripe Processing Est. (2.9% + 30¢)
                      </div>
                      <div className="text-2xl font-black text-rose-900 mt-1">
                        ${settlementData?.stripeEstimatedFees?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] font-mono text-rose-700/80 mt-1">
                        Gateway transaction costs
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] uppercase font-mono font-bold text-emerald-800">
                        Organizer Escrow Pool
                      </div>
                      <div className="text-2xl font-black text-emerald-900 mt-1">
                        ${settlementData?.organizerEscrow?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700/80 mt-1">
                        Disbursable to event producers
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settlement History Ledger */}
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-5">
                <h3 className="font-bold text-base uppercase tracking-tight flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-brand-dark" />
                  <span>Settlement Batch Ledger & Payout History</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                        <th className="py-3 px-4">Batch ID</th>
                        <th className="py-3 px-4">Gross Settled</th>
                        <th className="py-3 px-4">Venue Cut</th>
                        <th className="py-3 px-4">Organizer Pool</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {(settlementData?.ledgerHistory || venueSettings.payoutLedger || []).map((b, idx) => (
                        <tr key={idx} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-brand-dark">{b.batchId}</td>
                          <td className="py-4 px-4">${b.grossAmount?.toFixed(2)}</td>
                          <td className="py-4 px-4 font-bold text-amber-700">${b.venueCutAmount?.toFixed(2)}</td>
                          <td className="py-4 px-4 font-bold text-emerald-700">${b.organizerPayoutPool?.toFixed(2)}</td>
                          <td className="py-4 px-4 text-brand-dark/60">{new Date(b.settledAt).toLocaleString()}</td>
                          <td className="py-4 px-4 text-brand-dark/70 max-w-xs truncate">{b.notes}</td>
                          <td className="py-4 px-4 text-right">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM DIAGNOSTICS & TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span>System Telemetry & Engine Health</span>
                    </h2>
                    <p className="text-xs text-brand-dark/60 font-mono mt-1">
                      Live Node.js process metrics, resilient database status, gate lockdown states, and security audit trails
                    </p>
                  </div>

                  <button
                    onClick={fetchDiagnostics}
                    className="px-4 py-2 bg-brand-cream hover:bg-brand-cream/80 border border-brand-dark/15 text-xs font-mono font-bold rounded-full flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-brand-dark" />
                    <span>Refresh Stats</span>
                  </button>
                </div>

                {loadingDiagnostics ? (
                  <div className="py-12 flex justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-brand-cream/40 border border-brand-dark/10">
                      <div className="text-[10px] font-mono text-brand-dark/50 uppercase font-bold">Process Uptime</div>
                      <div className="text-2xl font-black text-brand-dark font-mono mt-1">
                        {diagnostics?.uptimeSeconds ? `${Math.floor(diagnostics.uptimeSeconds / 60)}m ${diagnostics.uptimeSeconds % 60}s` : 'Active'}
                      </div>
                      <div className="text-[10px] font-mono text-brand-dark/60 mt-1">
                        Platform: {diagnostics?.platform} ({diagnostics?.arch})
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                      <div className="text-[10px] font-mono text-blue-800 uppercase font-bold">Memory RSS</div>
                      <div className="text-2xl font-black text-blue-900 font-mono mt-1">
                        {diagnostics?.memory?.rssMB || '42.50'} MB
                      </div>
                      <div className="text-[10px] font-mono text-blue-700/80 mt-1">
                        Heap: {diagnostics?.memory?.heapUsedMB} / {diagnostics?.memory?.heapTotalMB} MB
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-mono text-emerald-800 uppercase font-bold">Database Status</div>
                      <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
                        {diagnostics?.database?.status || 'ONLINE'}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700/80 mt-1">
                        Resilient Dual-Engine NeDB + Atlas
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
                      <div className="text-[10px] font-mono text-purple-800 uppercase font-bold">Node Runtime</div>
                      <div className="text-2xl font-black text-purple-900 font-mono mt-1">
                        {diagnostics?.nodeVersion || process.version || 'v20.x'}
                      </div>
                      <div className="text-[10px] font-mono text-purple-700/80 mt-1">
                        Gate: {diagnostics?.gateLockdownStatus || 'ACTIVE_OPERATIONAL'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Security Audit Trail */}
              <div className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-sm space-y-5">
                <h3 className="font-bold text-base uppercase tracking-tight flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>Super Admin Security Audit Log Trail</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                        <th className="py-3 px-4">Log ID</th>
                        <th className="py-3 px-4">Action Event</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {(venueSettings.auditLogs || []).map((log, idx) => (
                        <tr key={idx} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-brand-dark">{log.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-brand-dark text-white rounded text-[10px] font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-purple-700">{log.actor}</td>
                          <td className="py-3 px-4 text-brand-dark/60">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-4 text-brand-dark/80">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE / APPOINT ADMIN */}
      {addAdminModal && (
        <Modal
          isOpen={addAdminModal}
          onClose={() => setAddAdminModal(false)}
          title="Appoint Platform Administrator"
        >
          <form onSubmit={handleAddOrPromoteAdmin} className="space-y-4 font-mono">
            <div className="flex rounded-2xl bg-brand-cream p-1 border border-brand-dark/15 text-xs font-bold uppercase">
              <button
                type="button"
                onClick={() => setAdminMode('new')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  adminMode === 'new' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60'
                }`}
              >
                Create New Admin
              </button>
              <button
                type="button"
                onClick={() => setAdminMode('promote')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  adminMode === 'promote' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60'
                }`}
              >
                Promote Existing User
              </button>
            </div>

            {adminMode === 'new' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-brand-dark/70 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="e.g. Operations Director"
                    className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-dark/70 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@venue.com"
                    className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-dark/70 block mb-1">Secure Password *</label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-bold text-brand-dark/70 block mb-1">User Account ID *</label>
                <input
                  type="text"
                  required
                  value={promoteUserId}
                  onChange={(e) => setPromoteUserId(e.target.value)}
                  placeholder="Paste User Object ID (from database or user table)"
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submittingAdmin}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-xs shadow-sm"
            >
              {submittingAdmin ? 'Processing...' : adminMode === 'new' ? 'Create Admin Account' : 'Grant Admin Privileges'}
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: DEMOTE ADMIN */}
      {demoteModalOpen && selectedAdminForDemote && (
        <Modal
          isOpen={demoteModalOpen}
          onClose={() => setDemoteModalOpen(false)}
          title={`Demote Admin: ${selectedAdminForDemote.name}`}
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-brand-dark/70">
              Select the new role to assign to <strong className="text-brand-dark font-sans">{selectedAdminForDemote.name}</strong> ({selectedAdminForDemote.email}). They will immediately lose platform administrative privileges.
            </p>

            <div>
              <label className="text-xs font-bold text-brand-dark/70 block mb-1">Assign New Role *</label>
              <select
                value={targetDemoteRole}
                onChange={(e) => setTargetDemoteRole(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark uppercase font-bold"
              >
                <option value="organizer">Organizer (Event Host)</option>
                <option value="staff">Staff (Gate Scanner)</option>
                <option value="attendee">Attendee (Ticket Buyer)</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDemoteModalOpen(false)}
                className="flex-1 py-3 bg-brand-cream hover:bg-brand-cream/80 text-brand-dark font-bold rounded-full uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDemote}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full uppercase transition-colors shadow-sm"
              >
                Confirm Demotion
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: TOGGLE GATE LOCKDOWN */}
      {lockdownModalOpen && (
        <Modal
          isOpen={lockdownModalOpen}
          onClose={() => setLockdownModalOpen(false)}
          title={venueSettings.emergencyGateLockdown ? "Lift Emergency Gate Lockdown" : "Trigger Emergency Gate Freeze"}
        >
          <div className="space-y-4 font-mono text-xs">
            <p className="text-brand-dark/70">
              {venueSettings.emergencyGateLockdown
                ? "Lifting the gate lockdown will immediately resume normal ticket scanning and guest turnstile admission across all venues."
                : "Activating lockdown will immediately FREEZE all door scanning. All ticket verification calls will be rejected with an emergency security order until lifted."}
            </p>

            {!venueSettings.emergencyGateLockdown && (
              <div>
                <label className="text-xs font-bold text-brand-dark/70 block mb-1">Reason / Security Directive</label>
                <input
                  type="text"
                  value={lockdownReasonInput}
                  onChange={(e) => setLockdownReasonInput(e.target.value)}
                  placeholder="e.g. Overcrowding at Gate A / Security Order"
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
                />
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setLockdownModalOpen(false)}
                className="flex-1 py-3 bg-brand-cream hover:bg-brand-cream/80 text-brand-dark font-bold rounded-full uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleLockdown}
                disabled={togglingLockdown}
                className={`flex-1 py-3 font-bold rounded-full uppercase transition-colors text-white shadow-sm ${
                  venueSettings.emergencyGateLockdown
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {togglingLockdown ? 'Updating...' : venueSettings.emergencyGateLockdown ? 'Confirm Lift Lockdown' : 'ACTIVATE LOCKDOWN'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: EXECUTE SETTLEMENT BATCH */}
      {settleModalOpen && (
        <Modal
          isOpen={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          title="Execute Financial Settlement Batch"
        >
          <form onSubmit={handleExecuteSettlement} className="space-y-4 font-mono text-xs">
            <p className="text-brand-dark/70">
              Generating this settlement will lock in the current gross volume (${settlementData?.grossRevenue?.toFixed(2)}), calculate the venue cut (${settlementData?.venueNetTake?.toFixed(2)}), and disburse the remaining pool (${settlementData?.organizerEscrow?.toFixed(2)}) into the payout ledger.
            </p>

            <div>
              <label className="text-xs font-bold text-brand-dark/70 block mb-1">Settlement Memo / Notes</label>
              <input
                type="text"
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder="e.g. Monthly facility yield & organizer pool disbursement"
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs text-brand-dark"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSettleModalOpen(false)}
                className="flex-1 py-3 bg-brand-cream hover:bg-brand-cream/80 text-brand-dark font-bold rounded-full uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={executingSettlement}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full uppercase transition-colors shadow-sm"
              >
                {executingSettlement ? 'Executing...' : 'Confirm & Settle Batch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
