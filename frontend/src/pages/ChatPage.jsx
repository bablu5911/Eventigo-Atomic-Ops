import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Radio, AlertTriangle, ShieldCheck, User, RefreshCw } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newMessage, setNewMessage] = useState('');
  const [msgType, setMsgType] = useState('general');
  const [isBroadcast, setIsBroadcast] = useState(user?.role === 'admin');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Auto-refresh team chat
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat/messages');
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await api.post('/chat/messages', {
        message: newMessage.trim(),
        isBroadcast: user?.role === 'admin' ? isBroadcast : false,
        type: msgType
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Message sent');
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-10 px-6 font-helvetica-neue">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-mono font-bold uppercase mb-2">
            <Radio className="w-4 h-4" />
            <span>Encrypted Internal Communications</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-dark uppercase tracking-tight">Team Communications Console</h1>
          <p className="text-xs text-brand-dark/60 font-mono mt-0.5">
            Operational communications, mass broadcasts, and incident reporting for Organizers & Staff
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="p-2.5 bg-brand-cream hover:bg-brand-light text-brand-dark rounded-full border border-brand-dark/15 transition-colors"
          title="Refresh Messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Messages List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-6 rounded-3xl space-y-4 shadow-sm min-h-[450px] flex flex-col justify-between">
            <h2 className="text-lg font-bold text-brand-dark uppercase tracking-tight border-b border-brand-dark/10 pb-3 flex items-center justify-between">
              <span>Operations Dispatch Stream</span>
              <span className="text-xs font-mono font-semibold text-brand-dark/50">{messages.length} Messages</span>
            </h2>

            {/* Chat Stream */}
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
              {loading ? (
                <div className="text-center py-10 text-xs font-mono text-brand-dark/50">Loading operations stream...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-brand-dark/50">No operations messages logged yet.</div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender === user?.id || msg.sender?._id === user?.id;

                  return (
                    <div
                      key={msg._id}
                      className={`p-4 rounded-2xl border ${
                        msg.isBroadcast
                          ? 'bg-purple-50 border-purple-200 text-purple-950'
                          : msg.type === 'urgent'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : isOwn
                          ? 'bg-brand-cream border-brand-dark/15 text-brand-dark ml-8'
                          : 'bg-white border-brand-dark/10 text-brand-dark mr-8'
                      } space-y-1.5 shadow-sm`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center space-x-2 font-bold">
                          <User className="w-3.5 h-3.5 text-brand-green" />
                          <span>{msg.senderName}</span>
                          <span className="uppercase text-[9px] px-2 py-0.5 rounded-full bg-brand-dark/10 text-brand-dark font-bold">
                            {msg.senderRole}
                          </span>
                        </div>
                        <span className="text-brand-dark/40">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <p className="text-sm font-helvetica-neue leading-relaxed">{msg.message}</p>

                      {msg.isBroadcast && (
                        <div className="pt-1 flex items-center space-x-1 text-[10px] font-mono text-purple-700 font-bold uppercase">
                          <Radio className="w-3 h-3" />
                          <span>SYSTEM MASS BROADCAST</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Send Input */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-brand-dark/10 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type operational update or report incident..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-brand-cream border border-brand-dark/15 rounded-2xl px-4 py-3 text-sm text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-helvetica-neue"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-2xl transition-colors flex items-center space-x-1.5 text-sm uppercase tracking-wide disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>

              {/* Message Type Selector */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1 text-brand-dark cursor-pointer">
                    <input
                      type="radio"
                      name="msgType"
                      value="general"
                      checked={msgType === 'general'}
                      onChange={() => setMsgType('general')}
                      className="accent-brand-dark"
                    />
                    <span>General</span>
                  </label>

                  <label className="flex items-center space-x-1 text-rose-700 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="msgType"
                      value="urgent"
                      checked={msgType === 'urgent'}
                      onChange={() => setMsgType('urgent')}
                      className="accent-rose-600"
                    />
                    <span>Urgent Issue</span>
                  </label>
                </div>

                {user?.role === 'admin' && (
                  <label className="flex items-center space-x-1.5 text-purple-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBroadcast}
                      onChange={(e) => setIsBroadcast(e.target.checked)}
                      className="accent-purple-700"
                    />
                    <span>Send as Mass Broadcast</span>
                  </label>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Ops Guide */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-bold text-lg text-brand-dark uppercase tracking-tight">Ops Protocols</h3>
            
            <div className="space-y-3 text-xs text-brand-dark/70 leading-relaxed font-helvetica-neue">
              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10">
                <strong className="text-brand-dark block font-bold mb-1">📢 Admin Mass Broadcast</strong>
                <p>System Admins can push instant updates visible to all event organizers and gate staff.</p>
              </div>

              <div className="p-3 bg-brand-cream rounded-2xl border border-brand-dark/10">
                <strong className="text-brand-dark block font-bold mb-1">🚨 Incident Reporting</strong>
                <p>Organizers & Gate Staff can flag ticket scan failures, capacity warnings, or venue emergencies directly to Admin Control.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
