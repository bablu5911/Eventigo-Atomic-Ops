import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminDash } from '../services/reactQueryHooks';
import api from '../services/api';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  UserPlus, 
  Lock, 
  CheckCircle, 
  PauseCircle, 
  Ban, 
  RefreshCw, 
  Tag, 
  Key,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
  PlayCircle,
  Briefcase,
  QrCode,
  MapPin,
  Cpu,
  Ticket as TicketIcon,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: dashData, isLoading, isError, error, refetch } = useAdminDash();
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'staff' | 'tickets' | 'promos' | 'users'

  // Users & Staff & Organizers State
  const [usersList, setUsersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [organizersList, setOrganizersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');

  // Events & Organizer Assignment State
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [assignOrgModal, setAssignOrgModal] = useState(false);
  const [selectedEventForOrg, setSelectedEventForOrg] = useState(null);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState('');

  // Staff Work Assignments State
  const [staffAssignments, setStaffAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignStaffModal, setAssignStaffModal] = useState(false);
  const [assignmentStaffId, setAssignmentStaffId] = useState('');
  const [assignmentEventId, setAssignmentEventId] = useState('');
  const [assignmentDuty, setAssignmentDuty] = useState('Gate Check-in & QR Verification');
  const [assignmentGate, setAssignmentGate] = useState('Main North Gate Turnstile');
  const [assignmentShiftStart, setAssignmentShiftStart] = useState('');
  const [assignmentShiftEnd, setAssignmentShiftEnd] = useState('');

  // Ticket Tiers State
  const [ticketTiersList, setTicketTiersList] = useState([]);

  // Promo Code State
  const [promosList, setPromosList] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [promoModal, setPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(20);
  const [usageLimit, setUsageLimit] = useState(100);
  const [promoScope, setPromoScope] = useState('all'); // 'all' | 'event'
  const [targetEventId, setTargetEventId] = useState('');
  const [promoEventSearch, setPromoEventSearch] = useState('');
  const [oneTimePerUser, setOneTimePerUser] = useState(true);
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [isNewUserOnly, setIsNewUserOnly] = useState(false);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStaff();
    fetchOrganizers();
    fetchEvents();
    fetchStaffAssignments();
    fetchPromos();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsersList(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      if (res.data.success) {
        setStaffList(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff members', err);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/admin/organizers');
      if (res.data.success) {
        setOrganizersList(res.data.organizers || []);
      }
    } catch (err) {
      console.error('Failed to load organizers', err);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/events?limit=100');
      if (res.data.success) {
        const evts = res.data.events || [];
        setEventsList(evts);
        // Extract ticket types
        const allTiers = [];
        evts.forEach(evt => {
          if (Array.isArray(evt.ticketTypes)) {
            evt.ticketTypes.forEach(tt => {
              allTiers.push({ ...tt, eventTitle: evt.title, eventIdStr: evt.eventId });
            });
          }
        });
        setTicketTiersList(allTiers);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchStaffAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await api.get('/admin/staff-assignments');
      if (res.data.success) {
        setStaffAssignments(res.data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load staff assignments', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchPromos = async () => {
    setLoadingPromos(true);
    try {
      const res = await api.get('/promocodes');
      if (res.data?.success && Array.isArray(res.data.promoCodes)) {
        setPromosList(res.data.promoCodes);
      }
    } catch (err) {
      console.error('Failed to load promo codes', err);
    } finally {
      setLoadingPromos(false);
    }
  };

  // Assign Organizer to Event Handler
  const handleAssignOrganizer = async (e) => {
    e.preventDefault();
    if (!selectedEventForOrg || !selectedOrganizerId) {
      toast.error('Please choose an organizer');
      return;
    }

    try {
      const res = await api.put(`/admin/events/${selectedEventForOrg._id}/assign-organizer`, {
        organizerId: selectedOrganizerId
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Organizer assigned successfully!');
        setAssignOrgModal(false);
        setSelectedEventForOrg(null);
        setSelectedOrganizerId('');
        fetchEvents();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign organizer');
    }
  };

  // Staff Assignment Handlers
  const handleCreateStaffAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentStaffId || !assignmentEventId) {
      toast.error('Please select both a staff member and an event');
      return;
    }

    try {
      const res = await api.post('/admin/staff-assignments', {
        staffId: assignmentStaffId,
        eventId: assignmentEventId,
        duty: assignmentDuty,
        gate: assignmentGate,
        shiftStart: assignmentShiftStart ? new Date(assignmentShiftStart).toISOString() : new Date().toISOString(),
        shiftEnd: assignmentShiftEnd ? new Date(assignmentShiftEnd).toISOString() : new Date(Date.now() + 8 * 3600000).toISOString()
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Staff duty assigned successfully!');
        setAssignStaffModal(false);
        setAssignmentStaffId('');
        setAssignmentEventId('');
        setAssignmentDuty('Gate Check-in & QR Verification');
        setAssignmentGate('Main North Gate Turnstile');
        fetchStaffAssignments();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign staff duty');
    }
  };

  const handleDeleteStaffAssignment = async (id, staffName) => {
    if (!window.confirm(`Unassign staff duty for ${staffName || 'this member'}?`)) return;
    try {
      const res = await api.delete(`/admin/staff-assignments/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Staff duty removed');
        fetchStaffAssignments();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove staff assignment');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      if (res.data.success) {
        toast.success(res.data.message || 'User created successfully');
        setCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
        fetchStaff();
        fetchOrganizers();
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Account status updated to '${newStatus}'`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(`User role changed to '${newRole}'`);
        fetchUsers();
        fetchStaff();
        fetchOrganizers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleCreatePromoCode = async (e) => {
    e.preventDefault();
    if (promoScope === 'event' && !targetEventId) {
      toast.error('Please select or search an event for the event-specific coupon');
      return;
    }

    try {
      const res = await api.post('/promocodes', {
        scope: promoScope,
        eventId: promoScope === 'event' ? targetEventId : undefined,
        code: promoCode.toUpperCase().trim(),
        discountType,
        value: Number(discountValue),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: oneTimePerUser ? 1 : Number(perUserLimit),
        isNewUserOnly: Boolean(isNewUserOnly),
        validFrom: hasTimeLimit && validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: hasTimeLimit && validUntil ? new Date(validUntil).toISOString() : null
      });
      if (res.data.success) {
        toast.success(
          promoScope === 'all'
            ? 'Platform-wide global coupon deployed!'
            : 'Event-specific coupon deployed successfully!'
        );
        setPromoModal(false);
        setPromoCode('');
        setTargetEventId('');
        setPromoEventSearch('');
        setIsNewUserOnly(false);
        setHasTimeLimit(false);
        setValidFrom('');
        setValidUntil('');
        fetchPromos();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create promo code');
    }
  };

  const handleTogglePromoStatus = async (promoId) => {
    try {
      const res = await api.patch(`/promocodes/${promoId}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchPromos();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle promo status');
    }
  };

  const handleDeletePromo = async (promoId, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon '${code}'?`)) {
      return;
    }
    try {
      const res = await api.delete(`/promocodes/${promoId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Promo code deleted');
        fetchPromos();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete promo code');
    }
  };

  const stats = {
    totalUsers: dashData?.totalUsers || usersList.length,
    totalOrganizers: dashData?.totalOrganizers || organizersList.length,
    totalStaff: dashData?.totalStaff || staffList.length,
    totalEvents: dashData?.totalEvents || eventsList.length,
    totalBookings: dashData?.totalBookings || 0,
    totalRevenue: dashData?.totalRevenue || 0
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-10 px-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-dark/10 pb-6 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-mono font-bold uppercase mb-2">
            <Shield className="w-4 h-4" />
            <span>Operations, Events & Staff Management Console</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-dark uppercase tracking-tight">Admin Control Panel</h1>
          <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
            Manage events & assign organizers, organize staff & gate duties, oversee tickets and govern promo codes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/organizer"
            className="px-5 py-2.5 bg-brand-green hover:bg-brand-dark text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>

          <button
            onClick={() => setAssignStaffModal(true)}
            className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            <span>Assign Staff Duty</span>
          </button>

          <button
            onClick={() => setPromoModal(true)}
            className="px-5 py-2.5 bg-brand-cream hover:bg-brand-light text-brand-dark border border-brand-dark/20 font-bold text-xs rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors"
          >
            <Tag className="w-4 h-4 text-brand-green" />
            <span>New Promo Code</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
          <h3 className="text-xl font-bold text-rose-900">Failed to load platform metrics</h3>
          <p className="text-sm text-rose-700">{error?.message}</p>
        </div>
      ) : (
        <>
          {/* Operations Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Managed Events</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalEvents}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Active Staff Duties</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{staffAssignments.length}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Staff & Organizers</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalStaff + stats.totalOrganizers}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Platform Bookings</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalBookings}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <TicketIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Operational Tab Switcher */}
          <div className="flex items-center space-x-2 border-b border-brand-dark/10 pb-2 overflow-x-auto text-xs font-bold uppercase font-mono tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 ${
                activeTab === 'events'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-white/80 text-brand-dark/60 hover:text-brand-dark border border-brand-dark/10'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Events & Organizer Assignments ({eventsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 ${
                activeTab === 'staff'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-white/80 text-brand-dark/60 hover:text-brand-dark border border-brand-dark/10'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Staff Manager & Duties ({staffAssignments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 ${
                activeTab === 'tickets'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-white/80 text-brand-dark/60 hover:text-brand-dark border border-brand-dark/10'
              }`}
            >
              <TicketIcon className="w-4 h-4 text-blue-400" />
              <span>Ticket Tiers & Inventory ({ticketTiersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('promos')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 ${
                activeTab === 'promos'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-white/80 text-brand-dark/60 hover:text-brand-dark border border-brand-dark/10'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Promo Code Governance ({promosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-2 ${
                activeTab === 'users'
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-white/80 text-brand-dark/60 hover:text-brand-dark border border-brand-dark/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Users & Roles ({usersList.length})</span>
            </button>
          </div>

          {/* TAB 1: EVENTS & ORGANIZER ASSIGNMENT */}
          {activeTab === 'events' && (
            <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-brand-green" />
                    <span>Event Registry & Organizer Accountability</span>
                  </h2>
                  <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
                    Admins assign registered Organizers to specific events to authorize them for production & management
                  </p>
                </div>

                <button
                  onClick={() => setCreateUserModal(true)}
                  className="px-4 py-2 bg-brand-cream hover:bg-brand-light border border-brand-dark/20 text-xs font-mono font-bold rounded-full text-brand-dark"
                >
                  + Add New Organizer Account
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">Event & Token</th>
                      <th className="py-3 px-4">Venue & City</th>
                      <th className="py-3 px-4">Assigned Organizer</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Assign Organizer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {eventsList.map((evt) => (
                      <tr key={evt._id} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-brand-dark">
                          <div>{evt.title}</div>
                          <span className="text-[10px] font-mono text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {evt.eventId || 'EVT-GEN'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-brand-dark/70">
                          <div>{evt.venue?.name || 'Main Hall'}</div>
                          <div className="text-[10px] text-brand-dark/50">{evt.venue?.city || 'San Francisco'}</div>
                        </td>
                        <td className="py-4 px-4">
                          {evt.organizer ? (
                            <div>
                              <div className="font-bold text-brand-dark">{evt.organizer.name}</div>
                              <div className="text-[10px] text-brand-dark/50">{evt.organizer.email}</div>
                            </div>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-brand-dark/60 text-[11px]">
                          {new Date(evt.startDateTime).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase">
                            {evt.status || 'published'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedEventForOrg(evt);
                              setSelectedOrganizerId(evt.organizer?._id || '');
                              setAssignOrgModal(true);
                            }}
                            className="px-3 py-1.5 bg-brand-cream hover:bg-brand-dark hover:text-white text-brand-dark border border-brand-dark/20 text-[11px] font-bold rounded-xl transition-all"
                          >
                            Assign Organizer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STAFF MANAGER & WORK ASSIGNMENTS */}
          {activeTab === 'staff' && (
            <div className="space-y-8">
              {/* Active Duty Roster */}
              <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-purple-700" />
                      <span>Active Staff Duty Assignments</span>
                    </h2>
                    <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
                      Assigned staff members receive gate access and operational duties for scheduled event doors
                    </p>
                  </div>

                  <button
                    onClick={() => setAssignStaffModal(true)}
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-green text-white text-xs font-mono font-bold rounded-full flex items-center space-x-2 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Duty to Staff</span>
                  </button>
                </div>

                {staffAssignments.length === 0 ? (
                  <div className="p-8 text-center text-brand-dark/60 font-mono text-xs border border-dashed border-brand-dark/20 rounded-2xl">
                    No active staff assignments. Click "+ Assign Duty to Staff" to dispatch staff to gates.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                          <th className="py-3 px-4">Staff Member</th>
                          <th className="py-3 px-4">Assigned Event</th>
                          <th className="py-3 px-4">Assigned Duty & Role</th>
                          <th className="py-3 px-4">Assigned Gate Door</th>
                          <th className="py-3 px-4">Duty Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-dark/5">
                        {staffAssignments.map((asg) => (
                          <tr key={asg._id} className="hover:bg-brand-cream/30 transition-colors">
                            <td className="py-4 px-4 font-sans font-bold text-brand-dark">
                              <div>{asg.staff?.name || 'Staff Member'}</div>
                              <div className="text-[10px] font-mono text-brand-dark/50">{asg.staff?.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-brand-dark">{asg.event?.title || 'General Event'}</div>
                              <div className="text-[10px] text-brand-green font-bold">{asg.event?.eventId}</div>
                            </td>
                            <td className="py-4 px-4 font-bold text-purple-900">
                              {asg.duty}
                            </td>
                            <td className="py-4 px-4 text-brand-dark/80 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>{asg.gate}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green font-bold text-[10px] uppercase">
                                {asg.status || 'assigned'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleDeleteStaffAssignment(asg._id, asg.staff?.name)}
                                className="p-1.5 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Unassign duty"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Staff Team Members Roster */}
              <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold uppercase tracking-tight flex items-center space-x-2">
                    <Users className="w-4 h-4 text-brand-green" />
                    <span>Registered Staff Members ({staffList.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setNewUserRole('staff');
                      setCreateUserModal(true);
                    }}
                    className="text-xs font-mono font-bold text-brand-green hover:underline"
                  >
                    + Register New Staff Account
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffList.map((st) => (
                    <div key={st._id} className="p-4 rounded-2xl border border-brand-dark/10 bg-brand-cream/30 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-bold text-xs">
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-brand-dark">{st.name}</div>
                          <div className="text-[10px] font-mono text-brand-dark/50">{st.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-mono font-bold uppercase">
                        Staff
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TICKET TIERS & PRICING */}
          {activeTab === 'tickets' && (
            <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight flex items-center space-x-2">
                  <TicketIcon className="w-5 h-5 text-blue-600" />
                  <span>Ticket Inventory & Pricing Tiers</span>
                </h2>
                <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
                  Overview of all active ticket tiers and ticket inventory across managed events
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">Tier Name</th>
                      <th className="py-3 px-4">Target Event</th>
                      <th className="py-3 px-4">Price ($)</th>
                      <th className="py-3 px-4">Inventory Sold / Total</th>
                      <th className="py-3 px-4">Max Per Attendee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {ticketTiersList.map((tt, idx) => (
                      <tr key={idx} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-brand-dark">{tt.name}</td>
                        <td className="py-4 px-4 font-sans text-brand-dark/80">
                          {tt.eventTitle} <span className="text-[10px] text-brand-green font-mono">({tt.eventIdStr})</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-brand-green">${tt.price}</td>
                        <td className="py-4 px-4">
                          {tt.soldQuantity || 0} / {tt.totalQuantity || tt.capacity || 100}
                        </td>
                        <td className="py-4 px-4 font-bold">{tt.maxPerUser || 4} passes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROMOS & COUPONS */}
          {activeTab === 'promos' && (
            <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <span>Coupon & Promo Code Governance</span>
                  </h2>
                  <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
                    Single-use limits, new user welcome rules, time/date limits (e.g. Diwali offer), and event bindings
                  </p>
                </div>

                <button
                  onClick={() => setPromoModal(true)}
                  className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Promo Code</span>
                </button>
              </div>

              {promosList.length === 0 ? (
                <div className="p-8 text-center text-brand-dark/60 font-mono text-xs border border-dashed border-brand-dark/20 rounded-2xl">
                  No promotional codes deployed. Click "Create Promo Code" to launch one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Scope</th>
                        <th className="py-3 px-4">Discount</th>
                        <th className="py-3 px-4">Policy Rules</th>
                        <th className="py-3 px-4">Validity Window</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-dark/5">
                      {promosList.map((promo) => (
                        <tr key={promo._id} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-brand-dark flex items-center space-x-1.5">
                            <Tag className="w-3.5 h-3.5 text-brand-green" />
                            <span>{promo.code}</span>
                          </td>
                          <td className="py-4 px-4">
                            {promo.scope === 'event' ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                Event Bound: {promo.event?.title || promo.eventId || 'Specific Event'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">
                                Global (All Events)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-emerald-700">
                            {promo.discountType === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                          </td>
                          <td className="py-4 px-4 text-[11px] space-y-0.5">
                            <div>{promo.perUserLimit === 1 ? '1x Single Use Per User' : `${promo.perUserLimit}x per user`}</div>
                            {promo.isNewUserOnly && (
                              <div className="text-amber-800 font-bold">New Customers Only</div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-[10px] text-brand-dark/60">
                            {promo.validUntil ? (
                              <span>Expires {new Date(promo.validUntil).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-brand-green font-bold">Never Expires</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleTogglePromoStatus(promo._id)}
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase transition-colors ${
                                promo.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-800'
                                  : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                            >
                              {promo.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleDeletePromo(promo._id, promo.code)}
                              className="p-1.5 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Promo Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ALL USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="bg-white/80 border border-brand-dark/10 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight flex items-center space-x-2">
                    <Users className="w-5 h-5 text-brand-green" />
                    <span>All Platform Users & Roles</span>
                  </h2>
                  <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
                    Promote accounts between Attendee, Organizer, Staff, and Admin roles
                  </p>
                </div>

                <button
                  onClick={() => setCreateUserModal(true)}
                  className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-xs rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 bg-brand-cream/40 text-brand-dark/60 uppercase font-bold text-[11px]">
                      <th className="py-3 px-4">Name & Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/5">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="py-4 px-4 font-sans font-bold text-brand-dark">
                          <div>{usr.name}</div>
                          <div className="text-[10px] font-mono text-brand-dark/50">{usr.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={usr.role}
                            onChange={(e) => handleUpdateRole(usr._id, e.target.value)}
                            className="bg-brand-cream border border-brand-dark/15 rounded-xl px-2.5 py-1 text-xs font-mono font-bold uppercase text-brand-dark"
                          >
                            <option value="attendee">Attendee</option>
                            <option value="organizer">Organizer</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={usr.status}
                            onChange={(e) => handleUpdateStatus(usr._id, e.target.value)}
                            className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                              usr.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="on_hold">On Hold</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 text-brand-dark/50 text-[10px]">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-[10px] text-brand-dark/40 font-mono">Live</span>
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

      {/* MODAL: ASSIGN ORGANIZER TO EVENT */}
      {assignOrgModal && selectedEventForOrg && (
        <Modal isOpen={assignOrgModal} onClose={() => setAssignOrgModal(false)} title="Assign Organizer to Event">
          <form onSubmit={handleAssignOrganizer} className="space-y-4">
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Target Event</label>
              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10 font-bold text-sm text-brand-dark">
                {selectedEventForOrg.title} ({selectedEventForOrg.eventId})
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Select Organizer</label>
              <select
                required
                value={selectedOrganizerId}
                onChange={(e) => setSelectedOrganizerId(e.target.value)}
                className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-brand-dark"
              >
                <option value="">-- Choose Organizer --</option>
                {organizersList.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name} ({org.email})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] font-mono text-brand-dark/60">
              Assigning this event authorizes the organizer to manage ticket tiers, inspect bookings, and run check-ins in Organizer Studio.
            </p>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-xs shadow-sm"
            >
              Confirm Organizer Assignment
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: ASSIGN STAFF DUTY */}
      {assignStaffModal && (
        <Modal isOpen={assignStaffModal} onClose={() => setAssignStaffModal(false)} title="Assign Staff Work & Gate Duty">
          <form onSubmit={handleCreateStaffAssignment} className="space-y-4">
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Select Staff Member *</label>
              <select
                required
                value={assignmentStaffId}
                onChange={(e) => setAssignmentStaffId(e.target.value)}
                className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-dark"
              >
                <option value="">-- Choose Staff Member --</option>
                {staffList.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Assign to Event *</label>
              <select
                required
                value={assignmentEventId}
                onChange={(e) => setAssignmentEventId(e.target.value)}
                className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-brand-dark"
              >
                <option value="">-- Choose Event --</option>
                {eventsList.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title} ({evt.eventId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Gate Door / Location</label>
                <input
                  type="text"
                  required
                  value={assignmentGate}
                  onChange={(e) => setAssignmentGate(e.target.value)}
                  placeholder="e.g. Main North Gate Turnstile"
                  className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-2 text-xs font-mono text-brand-dark"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Assigned Duty / Work</label>
                <input
                  type="text"
                  required
                  value={assignmentDuty}
                  onChange={(e) => setAssignmentDuty(e.target.value)}
                  placeholder="e.g. Gate Check-in & Security"
                  className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-2 text-xs font-mono text-brand-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Shift Start</label>
                <input
                  type="datetime-local"
                  value={assignmentShiftStart}
                  onChange={(e) => setAssignmentShiftStart(e.target.value)}
                  className="w-full bg-white border border-brand-dark/20 rounded-2xl px-3 py-2 text-xs font-mono text-brand-dark"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Shift End</label>
                <input
                  type="datetime-local"
                  value={assignmentShiftEnd}
                  onChange={(e) => setAssignmentShiftEnd(e.target.value)}
                  className="w-full bg-white border border-brand-dark/20 rounded-2xl px-3 py-2 text-xs font-mono text-brand-dark"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-xs shadow-sm"
            >
              Confirm Staff Assignment
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE NEW USER */}
      {createUserModal && (
        <Modal isOpen={createUserModal} onClose={() => setCreateUserModal(false)} title="Register New Account">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Password</label>
              <input
                type="password"
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs font-bold uppercase"
              >
                <option value="staff">Staff (Gate Scanner)</option>
                <option value="organizer">Organizer (Event Host)</option>
                <option value="admin">Admin (Operations Manager)</option>
                <option value="attendee">Attendee (Ticket Buyer)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-xs shadow-sm"
            >
              Create Account
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE PROMO CODE */}
      {promoModal && (
        <Modal isOpen={promoModal} onClose={() => setPromoModal(false)} title="Create New Promo Code">
          <form onSubmit={handleCreatePromoCode} className="space-y-4">
            {/* Promo Code String */}
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. DIWALI2026 or NEONVIP"
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-sm uppercase tracking-wider font-bold"
              />
            </div>

            {/* Scope Selection */}
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">
                Coupon Scope *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPromoScope('all')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    promoScope === 'all'
                      ? 'border-brand-dark bg-white shadow-sm ring-1 ring-brand-dark'
                      : 'border-brand-dark/15 bg-brand-cream/50 text-brand-dark/70'
                  }`}
                >
                  <div className="font-bold text-xs">🌐 All Events</div>
                  <div className="text-[10px] text-brand-dark/60 font-mono mt-0.5">Global coupon for all shows</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPromoScope('event')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    promoScope === 'event'
                      ? 'border-brand-dark bg-white shadow-sm ring-1 ring-brand-dark'
                      : 'border-brand-dark/15 bg-brand-cream/50 text-brand-dark/70'
                  }`}
                >
                  <div className="font-bold text-xs">🎯 Specific Event</div>
                  <div className="text-[10px] text-brand-dark/60 font-mono mt-0.5">Bound only to 1 event</div>
                </button>
              </div>
            </div>

            {/* Event Specific Selection */}
            {promoScope === 'event' && (
              <div className="space-y-3 p-4 bg-brand-cream rounded-2xl border border-brand-dark/10">
                <label className="text-xs font-mono font-bold text-brand-dark/80 block">
                  Select or Search Event (via Event ID or Name) *
                </label>
                <select
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs font-mono text-brand-dark"
                >
                  <option value="">-- Choose an Event --</option>
                  {eventsList.map((e) => (
                    <option key={e._id} value={e._id}>
                      [{e.eventId || 'NO-ID'}] {e.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Discount Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">
                  Discount Value {discountType === 'percentage' ? '(%)' : '($)'} *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={discountType === 'percentage' ? 100 : 1000}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div>
              <label className="text-xs font-mono font-bold text-brand-dark/70 block mb-1">
                Total Platform Usage Limit
              </label>
              <input
                type="number"
                required
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2 text-brand-dark font-mono text-xs"
              />
            </div>

            {/* New Users Only Policy */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewUserOnly}
                  onChange={(e) => setIsNewUserOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
                <span className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Only Work For First-Time / New Users</span>
                </span>
              </label>
              <p className="text-[10px] text-amber-800/80 font-mono pl-6">
                Customers who already have 1 or more confirmed bookings will be blocked from applying this code.
              </p>
            </div>

            {/* Time & Date Expiration */}
            <div className="p-3 bg-brand-cream border border-brand-dark/15 rounded-2xl space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTimeLimit}
                  onChange={(e) => setHasTimeLimit(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-dark focus:ring-brand-green border-brand-dark/20"
                />
                <span className="font-bold text-brand-dark text-xs flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-green" />
                  <span>Limit Coupon With Time and Date (e.g. Diwali Offer)</span>
                </span>
              </label>

              {hasTimeLimit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 pt-1 animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-brand-dark/70 font-mono block mb-1">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full bg-white border border-brand-dark/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-dark/70 font-mono block mb-1">
                      Valid Until *
                    </label>
                    <input
                      type="datetime-local"
                      required={hasTimeLimit}
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-white border border-brand-dark/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-brand-dark"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-xs shadow-sm"
            >
              Deploy Promo Code
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
