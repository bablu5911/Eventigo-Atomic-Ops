import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCategories } from '../services/reactQueryHooks';
import EventCard from '../components/EventCard';
import SkeletonCard from '../components/SkeletonCard';
import { 
  Search, 
  MapPin, 
  Tag, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Ticket, 
  QrCode, 
  Compass, 
  Flame 
} from 'lucide-react';

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
      <section className="relative w-full min-h-[640px] md:min-h-[720px] -mt-16 md:-mt-20 overflow-hidden flex flex-col justify-center">
        {/* Live Event Background Image Layer */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=2400&q=85"
            alt="Live Events and Festivals"
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.15]"
          />
          {/* Dark Radial & Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a08] via-[#070a08]/75 to-black/60 backdrop-blur-[1px]" />
        </div>

        {/* Content column */}
        <div className="relative z-10 flex flex-col items-start max-w-7xl mx-auto pt-28 md:pt-36 pb-16 px-6 lg:px-8 w-full">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md shadow-sm mb-6 animate-fade-up stagger-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Discover The Best Live Experiences &amp; Summits</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-left text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.06] tracking-tight max-w-4xl font-helvetica-neue font-bold animate-fade-up stagger-3">
            Discover, Book &amp; Experience Live Events That Move You
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 text-left text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-helvetica-neue animate-fade-up stagger-4 leading-relaxed font-medium">
            The premier platform for passionate attendees and visionary organizers. Explore top concerts, conferences, and festivals — or host your own with seamless ticketing.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 mt-8 animate-fade-up stagger-5">
            <a
              href="#events-list"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 active:scale-95"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/organizer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm active:scale-95"
            >
              <Ticket className="w-4 h-4 text-emerald-400" />
              <span>Host an Event</span>
            </Link>
          </div>

          {/* Popular Categories Quick Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10 w-full max-w-3xl animate-fade-up stagger-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Popular:
            </span>
            {['Conferences', 'Music', 'Festivals', 'Workshops', 'Nightlife'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearch(tag);
                  const el = document.getElementById('events-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 rounded-full transition-all duration-150 shadow-xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2) Main Content & Search Controls */}
      <div id="events-list" className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">
        
        {/* Value Proposition Cards Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="aceternity-card aceternity-glow-hover p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white uppercase tracking-wide">Curated Experiences</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              From intimate acoustic showcases to flagship tech summits, discover verified events tailored to what you love.
            </p>
          </div>

          <div className="aceternity-card aceternity-glow-hover p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white uppercase tracking-wide">Instant Mobile Pass</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Direct digital QR tickets straight on your phone. Fast door entry, zero printing, and encrypted authentication.
            </p>
          </div>

          <div className="aceternity-card aceternity-glow-hover p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white uppercase tracking-wide">Organizer Power Tools</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Host your events with ease. Set multiple ticket tiers, manage promotional codes, and scan tickets at the door.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="aceternity-card p-5 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search concerts, summits, festivals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-helvetica-neue"
            />
          </div>

          {/* City Search */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="City (e.g. San Francisco, New York)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-helvetica-neue"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 font-helvetica-neue appearance-none"
            >
              <option value="" className="bg-neutral-900 text-slate-100">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-neutral-900 text-slate-100">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={clearFilters}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 text-slate-200 text-xs font-bold uppercase rounded-2xl border border-white/10 transition-colors font-helvetica-neue"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Events Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-helvetica-neue tracking-tight uppercase">
              Featured &amp; Upcoming Events
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Live ticket availability • Showing {events.length} published events
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
          <div className="bg-rose-950/40 border border-rose-800/50 p-8 rounded-3xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-rose-200">Failed to fetch live events</h3>
            <p className="text-sm text-rose-300">{error?.message || 'Server connection error'}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full transition-colors uppercase shadow-md shadow-rose-600/30"
            >
              Retry Loading
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 aceternity-card rounded-3xl p-8 space-y-4">
            <Sparkles className="w-12 h-12 text-emerald-400/50 mx-auto" />
            <p className="text-slate-200 font-bold text-lg">No events found matching your search parameters.</p>
            <button
              onClick={clearFilters}
              className="text-sm font-mono text-emerald-400 underline hover:text-emerald-300 transition-colors"
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
