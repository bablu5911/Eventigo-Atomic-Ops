import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Triangle, Ticket, Calendar, Shield, Cpu, LogOut, User as UserIcon, LogIn, UserPlus, QrCode, MessageSquare, Plus, Crown } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  const toggleMobileMenu = () => setMobileOpen(prev => !prev);
  const closeMobileMenu = () => setMobileOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-neutral-950/85 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 md:h-20">
          
          {/* Logo & Brand (Links to Role Home) */}
          <Link
            to={
              user?.role === 'superadmin' ? '/superadmin' :
              user?.role === 'admin' ? '/admin' :
              user?.role === 'organizer' ? '/organizer' :
              user?.role === 'staff' ? '/door-checker' : '/'
            }
            className="flex items-center space-x-2.5 group"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-neutral-950 font-black text-lg shadow-md transition-transform group-hover:scale-105 ${
              user?.role === 'superadmin' ? 'bg-amber-400 shadow-amber-500/30' :
              user?.role === 'admin' ? 'bg-purple-400 shadow-purple-500/30' :
              user?.role === 'staff' ? 'bg-cyan-400 shadow-cyan-500/30' :
              'bg-emerald-500 shadow-emerald-500/30'
            }`}>
              {user?.role === 'superadmin' ? '👑' : user?.role === 'admin' ? '🛡️' : user?.role === 'staff' ? '🚪' : 'E'}
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-helvetica-neue leading-none">
                Eventigo
              </span>
              {user?.role && (
                <span className={`text-[9px] uppercase font-mono tracking-widest font-bold mt-0.5 ${
                  user.role === 'superadmin' ? 'text-amber-400' :
                  user.role === 'admin' ? 'text-purple-400' :
                  user.role === 'organizer' ? 'text-emerald-400' :
                  user.role === 'staff' ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {user.role === 'superadmin' ? 'Super Admin Deck' :
                   user.role === 'admin' ? 'Operations Admin' :
                   user.role === 'organizer' ? 'Organizer Studio' :
                   user.role === 'staff' ? 'Gate Turnstile Staff' : 'Attendee Portal'}
                </span>
              )}
            </div>
          </Link>

          {/* Navigation Links STRICTLY based on User Role */}
          <nav className="hidden md:flex items-center space-x-2.5 text-sm font-medium font-helvetica-neue">
            {/* 1. SUPER ADMIN EXCLUSIVE LINKS */}
            {user?.role === 'superadmin' && (
              <>
                <Link
                  to="/superadmin"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/superadmin') ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 shadow-sm' : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Venue Controls & Freeze</span>
                </Link>

                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/admin') ? 'text-purple-300 font-bold bg-purple-500/20 border border-purple-500/40 shadow-sm' : 'text-slate-300 hover:text-purple-200 hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Operations Console</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/chat') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Team Chat</span>
                </Link>
              </>
            )}

            {/* 2. ADMIN EXCLUSIVE LINKS */}
            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/admin') ? 'text-purple-300 font-bold bg-purple-500/20 border border-purple-500/40 shadow-sm' : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/10'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Operations & Staff</span>
                </Link>

                <Link
                  to="/door-scanner"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/door-scanner') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Door Scanner</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/chat') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Team Chat</span>
                </Link>
              </>
            )}

            {/* 3. ORGANIZER EXCLUSIVE LINKS */}
            {user?.role === 'organizer' && (
              <>
                <Link
                  to="/organizer"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/organizer') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Organizer Studio</span>
                </Link>

                <Link
                  to="/door-scanner"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/door-scanner') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Gate Scanner</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/chat') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Team Chat</span>
                </Link>
              </>
            )}

            {/* 4. GATE STAFF EXCLUSIVE LINKS */}
            {user?.role === 'staff' && (
              <>
                <Link
                  to="/door-checker"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/door-checker') ? 'text-cyan-300 font-bold bg-cyan-500/20 border border-cyan-500/40 shadow-sm' : 'text-cyan-300/80 hover:text-cyan-200 hover:bg-cyan-500/10'
                  }`}
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Turnstile Check-In</span>
                </Link>

                <Link
                  to="/door-scanner"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/door-scanner') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Camera Scanner</span>
                </Link>

                <Link
                  to="/chat"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/chat') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Staff Chat</span>
                </Link>
              </>
            )}

            {/* 5. ATTENDEE & GUEST LINKS */}
            {(!user || user?.role === 'attendee') && (
              <>
                <Link
                  to="/"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                    isActive('/') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Events</span>
                </Link>

                {user && (
                  <Link
                    to="/my-bookings"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      isActive('/my-bookings') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    <span>My Bookings &amp; 3D Passes</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Auth & Actions */}
          <div className="hidden md:flex items-center space-x-3 font-helvetica-neue">
            {/* Create Event button ONLY for Organizer */}
            {user?.role === 'organizer' && (
              <Link
                to="/organizer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Event</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-900/90 border border-white/10 hover:border-emerald-500/40 transition-colors shadow-sm"
                >
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">{user.name.split(' ')[0]}</span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                    user.role === 'superadmin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : user.role === 'organizer'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : user.role === 'staff'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors uppercase tracking-wide"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-full transition-all shadow-md shadow-emerald-500/20 uppercase tracking-wide"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden ml-auto z-50 w-10 h-10 relative flex flex-col justify-center items-center focus:outline-none"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-[2px] bg-white rounded absolute transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                mobileOpen ? 'top-[19px] rotate-45' : 'top-[14px]'
              }`}
            />
            <span
              className={`w-6 h-[2px] bg-white rounded absolute transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                mobileOpen ? 'top-[19px] -rotate-45' : 'top-[22px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile overlay - strictly role filtered */}
      <div
        className={`md:hidden fixed inset-0 bg-neutral-950/95 backdrop-blur-xl z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center h-full gap-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-100 ${
            mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          {/* SUPER ADMIN MOBILE */}
          {user?.role === 'superadmin' && (
            <>
              <Link to="/superadmin" onClick={closeMobileMenu} className="text-xl font-bold text-amber-300 flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Venue Controls &amp; Freeze</span>
              </Link>
              <Link to="/admin" onClick={closeMobileMenu} className="text-xl font-bold text-purple-300 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Operations Console</span>
              </Link>
              <Link to="/chat" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Team Chat
              </Link>
            </>
          )}

          {/* ADMIN MOBILE */}
          {user?.role === 'admin' && (
            <>
              <Link to="/admin" onClick={closeMobileMenu} className="text-xl font-bold text-purple-300 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Operations &amp; Staff</span>
              </Link>
              <Link to="/door-scanner" onClick={closeMobileMenu} className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Door Scanner</span>
              </Link>
              <Link to="/chat" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Team Chat
              </Link>
            </>
          )}

          {/* ORGANIZER MOBILE */}
          {user?.role === 'organizer' && (
            <>
              <Link to="/organizer" onClick={closeMobileMenu} className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Event</span>
              </Link>
              <Link to="/organizer" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Organizer Studio
              </Link>
              <Link to="/door-scanner" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Gate Scanner
              </Link>
              <Link to="/chat" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Team Chat
              </Link>
            </>
          )}

          {/* STAFF MOBILE */}
          {user?.role === 'staff' && (
            <>
              <Link to="/door-checker" onClick={closeMobileMenu} className="text-xl font-bold text-cyan-300 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Turnstile Check-In</span>
              </Link>
              <Link to="/door-scanner" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Live Scanner
              </Link>
              <Link to="/chat" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Staff Chat
              </Link>
            </>
          )}

          {/* ATTENDEE & GUEST MOBILE */}
          {(!user || user?.role === 'attendee') && (
            <>
              <Link to="/" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                Discover Events
              </Link>
              {user && (
                <Link to="/my-bookings" onClick={closeMobileMenu} className="text-xl font-bold text-white">
                  My Bookings &amp; 3D Passes
                </Link>
              )}
            </>
          )}

          <div className="pt-4 flex flex-col items-center gap-3 w-64">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-3 bg-neutral-900 border border-white/10 text-white font-bold rounded-full text-sm"
                >
                  My Profile ({user.role})
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-center py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-3 bg-neutral-900 border border-white/10 text-white font-bold rounded-full text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-full text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
