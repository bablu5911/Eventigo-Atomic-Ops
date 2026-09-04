import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, AlertTriangle } from 'lucide-react';

export default function EventCard({ event }) {
  const isSoldOut = event.remainingCapacity !== undefined && event.remainingCapacity <= 0;
  const isLowStock = event.remainingCapacity !== undefined && event.remainingCapacity > 0 && event.remainingCapacity <= 15;

  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="aceternity-card aceternity-glow-hover rounded-2xl overflow-hidden flex flex-col justify-between group"
    >
      {/* Banner & Badges */}
      <div className="relative h-52 overflow-hidden bg-neutral-900">
        <img
          src={event.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Category Tag */}
        <span className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          {event.category?.name || 'Event'}
        </span>

        {/* Capacity / Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <span>SOLD OUT</span>
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Only {event.remainingCapacity} Left</span>
            </span>
          ) : (
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md text-xs font-mono font-semibold px-3 py-1 rounded-full shadow-sm">
              {event.remainingCapacity !== undefined ? `${event.remainingCapacity} Seats` : 'Available'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-xl text-slate-100 font-helvetica-neue leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {event.title}
          </h3>

          <div className="mt-4 space-y-2 text-xs text-slate-400 font-helvetica-neue">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {event.startDateTime ? new Date(event.startDateTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'TBA'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {event.isOnline ? 'Online Event' : `${event.venue?.name || ''}, ${event.venue?.city || ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Price */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">Starting from</span>
            <span className="text-xl font-bold text-white font-helvetica-neue">
              {event.minPrice !== undefined ? `$${event.minPrice.toFixed(2)}` : 'Free'}
            </span>
          </div>

          <Link
            to={`/events/${event.slug}`}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-full transition-all duration-200 flex items-center space-x-1.5 uppercase tracking-wide shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Ticket</span>
          </Link>
        </div>

      </div>

    </motion.div>
  );
}
