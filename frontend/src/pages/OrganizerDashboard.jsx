import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrganizerDash, useCategories } from '../services/reactQueryHooks';
import api from '../services/api';
import Modal from '../components/Modal';
import QRScannerModal from '../components/QRScannerModal';
import Spinner from '../components/Spinner';
import BroadcastDispatcher from '../components/BroadcastDispatcher';
import { Cpu, Plus, Calendar, DollarSign, Users, Ticket, QrCode, Download, RefreshCw, AlertCircle } from 'lucide-react';

export default function OrganizerDashboard() {
  const { data: dashData, isLoading, isError, error, refetch } = useOrganizerDash();
  const { data: categories = [] } = useCategories();

  const events = dashData?.events || [];
  const stats = {
    totalEvents: dashData?.totalEvents || 0,
    totalBookings: dashData?.totalBookings || 0,
    totalRevenue: dashData?.totalRevenue || 0,
    totalCheckedIn: dashData?.totalCheckedIn || 0
  };

  const [createEventModal, setCreateEventModal] = useState(false);
  const [ticketTierModalEvent, setTicketTierModalEvent] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    venueName: 'Tech Hub Arena',
    venueAddress: '100 Innovation Way',
    venueCity: 'San Francisco',
    startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    totalCapacity: 200,
    tierPrice: 49.99,
    tierName: 'General Admission Pass'
  });

  const [ticketForm, setTicketForm] = useState({
    name: 'General Admission',
    price: 49.99,
    totalQuantity: 100,
    maxPerUser: 5,
    saleStartDate: new Date().toISOString().slice(0, 16),
    saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    description: ''
  });

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    const catId = eventForm.categoryId || (categories.length > 0 ? categories[0]._id : '');

    try {
      const res = await api.post('/events', {
        title: eventForm.title,
        categoryId: catId,
        description: eventForm.description,
        venue: {
          name: eventForm.venueName || 'Tech Hub Arena',
          address: eventForm.venueAddress || '100 Innovation Way',
          city: eventForm.venueCity || 'San Francisco'
        },
        startDateTime: new Date(eventForm.startDateTime || (Date.now() + 86400000)).toISOString(),
        endDateTime: new Date(eventForm.endDateTime || (Date.now() + 172800000)).toISOString(),
        totalCapacity: Number(eventForm.totalCapacity) || 200,
        tierName: eventForm.tierName || 'General Admission Pass',
        tierPrice: Number(eventForm.tierPrice || 49.99),
        tierQuantity: Number(eventForm.totalCapacity) || 200,
        status: 'published'
      });

      if (res.data.success) {
        toast.success(`Event '${res.data.event?.title || eventForm.title}' published with verified tickets!`);
        setCreateEventModal(false);
        setEventForm({
          title: '',
          categoryId: '',
          description: '',
          venueName: 'Tech Hub Arena',
          venueAddress: '100 Innovation Way',
          venueCity: 'San Francisco',
          startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
          totalCapacity: 200,
          tierPrice: 49.99,
          tierName: 'General Admission Pass'
        });
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Event creation failed');
    }
  };

  const handleAddTicketTier = async (e) => {
    e.preventDefault();
    if (!ticketTierModalEvent) return;

    try {
      const res = await api.post('/ticket-types', {
        eventId: ticketTierModalEvent._id,
        name: ticketForm.name,
        price: Number(ticketForm.price),
        totalQuantity: Number(ticketForm.totalQuantity),
        maxPerUser: Number(ticketForm.maxPerUser),
        saleStartDate: new Date(ticketForm.saleStartDate).toISOString(),
        saleEndDate: new Date(ticketForm.saleEndDate).toISOString(),
        description: ticketForm.description
      });
      if (res.data.success) {
        toast.success('Ticket tier created successfully!');
        setTicketTierModalEvent(null);
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ticket tier');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-10 px-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-mono font-bold uppercase mb-2">
            <Cpu className="w-4 h-4" />
            <span>Assigned Event Coordinator Studio</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-dark uppercase tracking-tight">Organizer Studio</h1>
          <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
            Manage your specifically assigned events, ticket tier inventory, attendee check-in and door verification
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-5 py-2.5 bg-brand-cream hover:bg-brand-light text-brand-dark border border-brand-dark/20 text-xs font-bold rounded-full flex items-center space-x-2 uppercase tracking-wide transition-colors"
          >
            <QrCode className="w-4 h-4 text-brand-green" />
            <span>Door Scanner</span>
          </button>

          <button
            onClick={() => setCreateEventModal(true)}
            className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white font-bold text-xs rounded-full flex items-center space-x-2 shadow-sm transition-colors uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Explicit 3 UI States */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="text-xl font-bold text-rose-900">Failed to load organizer studio</h3>
          <p className="text-sm text-rose-700">{error?.message || 'Server error'}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full uppercase transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Hosted Events</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalEvents}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Total Bookings</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalBookings}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
                <Ticket className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Gross Revenue</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-dark/50 font-mono block font-semibold">Checked-In Gate</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{stats.totalCheckedIn}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Organizer Gate Directives & Attendee Broadcast Center */}
          <BroadcastDispatcher events={events} />

          {/* Events Management Table */}
          <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-brand-dark/10 flex items-center justify-between">
              <h2 className="font-bold text-xl text-brand-dark uppercase tracking-tight">My Hosted Events</h2>
              <button onClick={() => refetch()} className="p-2 text-brand-dark/60 hover:text-brand-dark transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="p-16 text-center text-brand-dark/60 font-mono text-xs space-y-2">
                <p className="font-bold text-sm">No events created yet.</p>
                <p>Click "Create Event" above to publish your first high-concurrency event!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-brand-cream text-brand-dark/70 uppercase text-[10px] border-b border-brand-dark/10">
                    <tr>
                      <th className="p-4">Event ID</th>
                      <th className="p-4">Event Title</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark/10 text-brand-dark">
                    {events.map((ev) => (
                      <tr key={ev._id} className="hover:bg-brand-cream/50">
                        <td className="p-4 font-mono font-bold text-xs text-brand-green">
                          <span className="px-2 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/20">
                            {ev.eventId || `EVT-${String(ev._id).slice(-4).toUpperCase()}`}
                          </span>
                        </td>
                        <td className="p-4 font-sans font-bold text-sm text-brand-dark">{ev.title}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${
                              ev.status === 'published' ? 'bg-brand-green/10 text-brand-green border border-brand-green/30' : 'bg-brand-cream text-brand-dark/60'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-4 font-bold">{ev.totalCapacity}</td>
                        <td className="p-4 text-right font-sans">
                          <button
                            onClick={() => setTicketTierModalEvent(ev)}
                            className="px-4 py-1.5 bg-brand-dark hover:bg-brand-green text-white rounded-full text-xs font-bold uppercase transition-colors"
                          >
                            + Ticket Tier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Event Modal */}
      {createEventModal && (
        <Modal isOpen={createEventModal} onClose={() => setCreateEventModal(false)} title="Create New Event">
          <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-helvetica-neue">
            <div>
              <label className="text-brand-dark font-semibold block mb-1">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. NextGen AI & Cloud Summit 2026"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-brand-dark"
              />
            </div>

            <div>
              <label className="text-brand-dark font-semibold block mb-1">Event Category</label>
              <select
                value={eventForm.categoryId}
                onChange={(e) => setEventForm({ ...eventForm, categoryId: e.target.value })}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-brand-dark font-mono"
              >
                <option value="">Auto-select Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Venue / Auditorium</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tech Hub Arena"
                  value={eventForm.venueName}
                  onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark"
                />
              </div>
              <div>
                <label className="text-brand-dark font-semibold block mb-1">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Francisco"
                  value={eventForm.venueCity}
                  onChange={(e) => setEventForm({ ...eventForm, venueCity: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Initial Ticket Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={eventForm.tierPrice}
                  onChange={(e) => setEventForm({ ...eventForm, tierPrice: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Total Capacity (Tickets)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={eventForm.totalCapacity}
                  onChange={(e) => setEventForm({ ...eventForm, totalCapacity: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-brand-dark font-semibold block mb-1">Description & Agenda</label>
              <textarea
                required
                rows={3}
                placeholder="Event overview, keynote speaker list, and agenda..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl p-3.5 text-brand-dark font-mono"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.startDateTime}
                  onChange={(e) => setEventForm({ ...eventForm, startDateTime: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
              <div>
                <label className="text-brand-dark font-semibold block mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.endDateTime}
                  onChange={(e) => setEventForm({ ...eventForm, endDateTime: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 font-mono flex items-center space-x-2">
              <span className="font-bold">✓ Instant Publish:</span>
              <span>Event will be published immediately with verified tickets ready for purchase.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-sm shadow-sm"
            >
              Deploy & Publish Event
            </button>
          </form>
        </Modal>
      )}

      {/* Add Ticket Tier Modal */}
      {ticketTierModalEvent && (
        <Modal
          isOpen={Boolean(ticketTierModalEvent)}
          onClose={() => setTicketTierModalEvent(null)}
          title={`Add Ticket Tier (${ticketTierModalEvent.title})`}
        >
          <form onSubmit={handleAddTicketTier} className="space-y-4 text-xs font-helvetica-neue">
            <div>
              <label className="text-brand-dark font-semibold block mb-1">Tier Name</label>
              <input
                type="text"
                required
                value={ticketForm.name}
                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-brand-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ticketForm.price}
                  onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
              <div>
                <label className="text-brand-dark font-semibold block mb-1">Total Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={ticketForm.totalQuantity}
                  onChange={(e) => setTicketForm({ ...ticketForm, totalQuantity: e.target.value })}
                  className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3 py-2 text-brand-dark font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors uppercase tracking-wide text-sm"
            >
              Save Ticket Tier
            </button>
          </form>
        </Modal>
      )}

      {/* Door Check-In Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCheckInSuccess={() => refetch()}
      />
    </div>
  );
}
