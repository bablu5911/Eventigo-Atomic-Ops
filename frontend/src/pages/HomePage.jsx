import React, { useState } from 'react';
import { useEvents, useCategories } from '../services/reactQueryHooks';
import EventCard from '../components/EventCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, MapPin, Tag, RefreshCw, ArrowRight, Sparkles, AlertCircle, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: eventsData, isLoading, isError, error, refetch } = useEvents({
    search,
    city,
    category: selectedCategory
  });

  const events = eventsData?.events || [];

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setSelectedCategory('');
  };

  return (
    <div className="space-y-16 pb-20 font-helvetica-neue">
      {/* 1) Hero Banner */}
      <section className="relative w-full h-screen min-h-[700px] -mt-16 md:-mt-20 overflow-hidden bg-brand-cream flex flex-col justify-between">
        {/* Live Music Event Background Image Layer */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=2400&q=85"
            alt="Live Music Event & Festival Hero Background"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
          />
          {/* Gradient Overlay for Text Legibility & Palomar Cream Blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-brand-cream/70 to-black/30 backdrop-blur-[1px]" />
        </div>

        {/* Content column */}
        <div className="relative z-10 flex flex-col items-start max-w-7xl mx-auto pt-28 md:pt-36 px-6 lg:px-8 w-full">
          {/* Announcement pill */}
          <a
            href="#events-list"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-brand-dark/15 bg-white/80 backdrop-blur-md hover:bg-white transition-all mb-5 md:mb-6 animate-fade-up stagger-3 shadow-sm"
          >
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-brand-dark">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Atomic Concurrency Guard Active • Zero Overselling Under Peak Load</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-dark" />
          </a>

          {/* Headline */}
          <h1 className="text-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brand-dark leading-[1.05] tracking-tight max-w-4xl font-helvetica-neue font-bold animate-fade-up stagger-4">
            Engineered to reserve, ticket,<br className="hidden sm:block" /> verify, and scale high-demand events
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 text-left text-base sm:text-lg text-brand-dark/85 max-w-2xl font-helvetica-neue animate-fade-up stagger-4 leading-relaxed font-medium">
            High-concurrency ticket reservations powered by atomic MongoDB updates, instant QR code validation, and multi-tenant organizer controls.
          </p>

          {/* Trusted by / Partners */}
          <div className="w-full mt-8 md:mt-10 animate-fade-up stagger-5">
            <p className="text-left text-xs tracking-[0.25em] uppercase text-brand-dark/60 mb-6 md:mb-8 font-helvetica-neue font-bold">
              Powering High-Volume Organizers & Summits
            </p>
            <div className="flex flex-wrap items-center justify-start gap-6 md:gap-12 lg:gap-16 animate-fade-up stagger-6">
              <span className="font-playfair text-lg md:text-xl lg:text-2xl text-brand-dark/90 font-bold whitespace-nowrap">
                Meridian
              </span>
              <span className="font-oswald uppercase text-lg md:text-xl lg:text-2xl text-brand-dark/90 font-bold whitespace-nowrap">
                STELLEX
              </span>
              <span className="font-montserrat text-lg md:text-xl lg:text-2xl text-brand-dark/90 font-bold whitespace-nowrap">
                Luminar
              </span>
              <span className="font-roboto-slab uppercase text-lg md:text-xl lg:text-2xl text-brand-dark/90 font-bold whitespace-nowrap">
                OVERLAND
              </span>
              <span className="font-raleway text-lg md:text-xl lg:text-2xl text-brand-dark/90 font-bold whitespace-nowrap">
                Kinetic
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Main Content & Search Controls */}
      <div id="events-list" className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">
        
        {/* Value Proposition Cards Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-dark uppercase tracking-wide">Atomic Locking</h3>
            <p className="text-xs text-brand-dark/70 leading-relaxed">
              Prevents double-booking during high-demand ticket drops using atomic inventory decrements.
            </p>
          </div>

          <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-dark uppercase tracking-wide">Instant QR Check-In</h3>
            <p className="text-xs text-brand-dark/70 leading-relaxed">
              Cryptographically signed QR pass codes for real-time door scanning and attendance logging.
            </p>
          </div>

          <div className="bg-white/80 border border-brand-dark/10 p-6 rounded-3xl space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-2xl bg-brand-cream border border-brand-dark/15 flex items-center justify-center text-brand-green">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-dark uppercase tracking-wide">Organizer Studio</h3>
            <p className="text-xs text-brand-dark/70 leading-relaxed">
              Comprehensive dashboard for tier pricing, promo code management, and live sales analytics.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-5 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-brand-dark/40 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search summits, conferences..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-helvetica-neue"
            />
          </div>

          {/* City Search */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-brand-dark/40 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="City (e.g. San Francisco)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-helvetica-neue"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <Tag className="w-4 h-4 text-brand-dark/40 absolute left-4 top-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-brand-dark focus:outline-none focus:border-brand-dark/40 font-helvetica-neue appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={clearFilters}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-cream hover:bg-brand-light text-brand-dark text-xs font-bold uppercase rounded-2xl border border-brand-dark/15 transition-colors font-helvetica-neue"
          >
            <RefreshCw className="w-4 h-4 text-brand-green" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Events Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-brand-dark font-helvetica-neue tracking-tight uppercase">
              Live & Upcoming Summits
            </h2>
            <p className="text-xs text-brand-dark/60 font-mono mt-1">
              Real-time inventory sync • Showing {events.length} published events
            </p>
          </div>
        </div>

        {/* 3 UI States */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
            <h3 className="text-xl font-bold text-rose-900">Failed to fetch live events</h3>
            <p className="text-sm text-rose-700">{error?.message || 'Server connection error'}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-colors uppercase"
            >
              Retry Loading
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white/60 border border-brand-dark/10 rounded-3xl p-8 space-y-4">
            <Sparkles className="w-12 h-12 text-brand-dark/30 mx-auto" />
            <p className="text-brand-dark font-bold text-lg">No events found matching your search parameters.</p>
            <button
              onClick={clearFilters}
              className="text-sm font-mono text-brand-green underline hover:opacity-80"
            >
              Reset all search filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
