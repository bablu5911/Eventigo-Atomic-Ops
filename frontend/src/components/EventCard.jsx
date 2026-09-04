import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, AlertTriangle } from 'lucide-react';

export default function EventCard({ event }) {
  const isSoldOut = event.remainingCapacity !== undefined && event.remainingCapacity <= 0;
  const isLowStock = event.remainingCapacity !== undefined && event.remainingCapacity > 0 && event.remainingCapacity <= 15;

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-brand-dark/10 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-brand-dark/30 hover:shadow-md transition-all">
      
      {/* Banner & Badges */}
      <div className="relative h-52 overflow-hidden bg-brand-cream">
        <img
          src={event.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Category Tag */}
        <span className="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-md text-white text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {event.category?.name || 'Event'}
        </span>

        {/* Capacity / Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="bg-rose-600/90 text-white text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <span>SOLD OUT</span>
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600/90 text-white text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              <span>Only {event.remainingCapacity} Left</span>
            </span>
          ) : (
            <span className="bg-brand-green/90 text-white text-xs font-mono font-semibold px-3 py-1 rounded-full shadow-sm">
              {event.remainingCapacity !== undefined ? `${event.remainingCapacity} Seats` : 'Available'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-xl text-brand-dark font-helvetica-neue leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">
            {event.title}
          </h3>

          <div className="mt-4 space-y-2 text-xs text-brand-dark/70 font-helvetica-neue">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-green" />
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
              <MapPin className="w-4 h-4 text-brand-green" />
              <span>
                {event.isOnline ? 'Online Event' : `${event.venue?.name || ''}, ${event.venue?.city || ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Price */}
        <div className="pt-4 border-t border-brand-dark/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-brand-dark/50 font-mono block">Starting from</span>
            <span className="text-lg font-bold text-brand-dark font-helvetica-neue">
              {event.minPrice !== undefined ? `$${event.minPrice.toFixed(2)}` : 'Free'}
            </span>
          </div>

          <Link
            to={`/events/${event.slug}`}
            className="px-5 py-2.5 bg-brand-dark hover:bg-brand-green text-white text-xs font-bold rounded-full transition-colors flex items-center space-x-1.5 uppercase tracking-wide"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Ticket</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
