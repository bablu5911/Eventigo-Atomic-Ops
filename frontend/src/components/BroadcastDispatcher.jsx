import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  Send,
  Radio,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  Users,
  Building2,
  Clock
} from 'lucide-react';

const PRESET_DIRECTIVES = [
  {
    title: '🚪 Rapid Entry Directive',
    message: 'Please proceed to Gate A for rapid barcode entry. Express lanes are now open.',
    targetGate: 'Gate A',
    priority: 'gate_directive'
  },
  {
    title: '⚡ Gate B Crowd Relief',
    message: 'Main entrance is currently congested. Turnstile Gate B has zero wait time.',
    targetGate: 'Gate B',
    priority: 'gate_directive'
  },
  {
    title: '🕒 Schedule Notice',
    message: 'The main stage keynote is delayed by 15 minutes. Complimentary refreshments available in Hall 2.',
    targetGate: 'All Gates',
    priority: 'info'
  },
  {
    title: '⚠️ Final Call For Entry',
    message: 'Auditorium doors close in 10 minutes. Please have your digital passes ready at turnstiles.',
    targetGate: 'All Gates',
    priority: 'urgent'
  },
  {
    title: '🍔 Food & Networking Open',
    message: 'Exhibition floor and culinary zones are officially open for all ticket holders.',
    targetGate: 'All Gates',
    priority: 'info'
  }
];

export default function BroadcastDispatcher({ events = [] }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('gate_directive');
  const [targetGate, setTargetGate] = useState('Gate A');
  const [sending, setSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  // Auto-select first event if available
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id || events[0].eventId);
    }
  }, [events, selectedEventId]);

  // Fetch past broadcasts for currently selected event
  const fetchEventBroadcasts = useCallback(async () => {
    if (!selectedEventId) {
      setBroadcasts([]);
      return;
    }
    try {
      setLoadingBroadcasts(true);
      const res = await api.get(`/broadcasts/events/${selectedEventId}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBroadcasts(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load broadcasts for event:', err);
    } finally {
      setLoadingBroadcasts(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEventBroadcasts();
  }, [fetchEventBroadcasts]);

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setTargetGate(preset.targetGate);
    setPriority(preset.priority);
    toast.success(`Preset directive loaded: "${preset.title}"`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event to broadcast to');
      return;
    }
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both a title and message for the directive');
      return;
    }

    setSending(true);
    try {
      const res = await api.post(`/broadcasts/events/${selectedEventId}`, {
        title: title.trim(),
        message: message.trim(),
        priority,
        targetGate
      });

      if (res.data?.success) {
        toast.success(
          `📢 Broadcast Sent! Delivered to ${res.data.recipientCount || 0} confirmed ticket holders.`,
          { duration: 5000 }
        );
        setTitle('');
        setMessage('');
        fetchEventBroadcasts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (broadcastId) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this broadcast alert?')) {
      return;
    }
    try {
      const res = await api.delete(`/broadcasts/${broadcastId}`);
      if (res.data?.success) {
        toast.success('Broadcast directive deactivated');
        fetchEventBroadcasts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate broadcast');
    }
  };

  const selectedEvent = events.find((e) => (e._id || e.eventId) === selectedEventId);

  return (
    <div className="bg-white/90 backdrop-blur-md border border-brand-dark/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-dark/10 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green text-[10px] font-mono font-bold uppercase mb-1">
              <span>Event-Bound Directives</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-dark uppercase tracking-tight">
              Live Gate &amp; Attendee Broadcast Center
            </h2>
            <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
              Transmit live instructions (e.g. "Go to Gate A") exclusively to confirmed ticket holders
            </p>
          </div>
        </div>

        {/* Event Selector */}
        <div className="w-full sm:w-72">
          <label className="text-[11px] font-mono uppercase tracking-wider text-brand-dark/60 font-bold block mb-1">
            Target Event Audience
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold text-brand-dark focus:outline-none focus:border-brand-green"
          >
            {events.length === 0 ? (
              <option value="">No events published yet</option>
            ) : (
              events.map((evt) => (
                <option key={evt._id || evt.eventId} value={evt._id || evt.eventId}>
                  {evt.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Selected Event Context Pill */}
      {selectedEvent && (
        <div className="p-3.5 bg-brand-cream border border-brand-dark/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brand-green" />
            <span className="font-bold text-brand-dark">{selectedEvent.title}</span>
            <span className="text-brand-dark/50">•</span>
            <span className="text-brand-dark/70">{selectedEvent.venue?.name || 'Main Arena'}</span>
          </div>
          <div className="flex items-center space-x-2 text-brand-green font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Target: Confirmed Ticket Holders Only</span>
          </div>
        </div>
      )}

      {/* Preset Directives (1-Click Templates) */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase font-bold text-brand-dark/70 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick 1-Click Directive Presets:</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_DIRECTIVES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 rounded-full bg-brand-cream hover:bg-brand-dark hover:text-white border border-brand-dark/15 text-xs text-brand-dark font-medium transition-all active:scale-95 shadow-2xs"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatch Form */}
      <form onSubmit={handleSend} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-brand-dark uppercase font-mono block mb-1">
              Directive Title / Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 🚪 Rapid Entry Directive: Go to Gate A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-2.5 text-xs font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark uppercase font-mono block mb-1">
              Target Turnstile Gate
            </label>
            <select
              value={targetGate}
              onChange={(e) => setTargetGate(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-brand-dark focus:outline-none focus:border-brand-green"
            >
              <option value="Gate A">Gate A (North Wing)</option>
              <option value="Gate B">Gate B (South Wing)</option>
              <option value="Gate C">Gate C (East Entry)</option>
              <option value="VIP Gate">VIP / Express Turnstile</option>
              <option value="All Gates">All Gates</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-brand-dark uppercase font-mono block mb-1">
              Broadcast Message Content
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Gate A express lanes are currently running with zero wait time. Please proceed to Gate A with your barcode passes ready..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl p-3.5 text-xs font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-brand-dark uppercase font-mono block mb-1">
                Directive Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-brand-cream border border-brand-dark/15 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-brand-dark focus:outline-none focus:border-brand-green"
              >
                <option value="gate_directive">🚪 Gate Directive (Turnstile Routing)</option>
                <option value="urgent">🚨 Urgent Alert (Emergency / Closure)</option>
                <option value="info">ℹ️ General Information (Schedule / Food)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sending || !selectedEventId}
              className="w-full py-3 px-4 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${sending ? 'animate-bounce' : ''}`} />
              <span>{sending ? 'Broadcasting Directive...' : 'Send Live Broadcast'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Active Broadcast Directives History */}
      <div className="pt-4 border-t border-brand-dark/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase text-brand-dark flex items-center space-x-1.5">
            <Bell className="w-3.5 h-3.5 text-brand-green" />
            <span>Active Directives for this Event ({broadcasts.length})</span>
          </span>
          <span className="text-brand-dark/60 text-[11px]">Visible only to ticket holders</span>
        </div>

        {loadingBroadcasts ? (
          <div className="text-center py-4 text-xs font-mono text-brand-dark/50">
            Checking active directives...
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-6 bg-brand-cream/60 rounded-2xl border border-brand-dark/10 text-xs font-mono text-brand-dark/60">
            No active directives sent yet for this event.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {broadcasts.map((b) => (
              <div
                key={b._id}
                className="p-4 rounded-2xl border border-brand-dark/15 bg-white space-y-2 relative shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : b.priority === 'info'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.priority === 'urgent' ? '🚨 Urgent' : b.priority === 'info' ? 'ℹ️ Info' : '🚪 Gate Directive'}
                      </span>
                      <span className="text-[10px] font-mono text-brand-dark/60 bg-brand-cream px-2 py-0.5 rounded-full border border-brand-dark/10">
                        {b.targetGate || 'All Gates'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mt-1">{b.title}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(b._id)}
                    title="Dismiss / Deactivate"
                    className="p-1.5 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-brand-dark/80 leading-relaxed font-sans">{b.message}</p>

                <div className="flex items-center justify-between pt-1 border-t border-brand-dark/5 text-[10px] font-mono text-brand-dark/50">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Sent: {new Date(b.sentAt || b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <span className="text-brand-green font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active in attendee apps</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
