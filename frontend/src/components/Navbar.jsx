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
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black text-lg shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              E
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white font-helvetica-neue">
              Eventigo
            </span>
          </Link>

          {/* Navigation Links based on User Role */}
          <nav className="hidden md:flex items-center space-x-3 text-sm font-medium font-helvetica-neue">
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
                <span>My Bookings</span>
              </Link>
            )}

            {user && (
              <Link
                to="/organizer"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/organizer') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Organizer Studio</span>
              </Link>
            )}

            {(user?.role === 'staff' || user?.role === 'organizer' || user?.role === 'admin') && (
              <Link
                to="/door-scanner"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/door-scanner') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Live Scanner</span>
              </Link>
            )}

            {user?.role === 'superadmin' && (
              <Link
                to="/superadmin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/superadmin') ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 shadow-sm' : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Venue Financials</span>
              </Link>
            )}

            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/admin') ? 'text-purple-300 font-bold bg-purple-500/20 border border-purple-500/40 shadow-sm' : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Operations & Staff</span>
              </Link>
            )}

            {(user?.role === 'staff' || user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'superadmin') && (
              <Link
                to="/chat"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/chat') ? 'text-emerald-400 font-bold bg-white/10 border border-emerald-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Team Chat</span>
              </Link>
            )}
          </nav>

          {/* User Auth & Create Event Actions */}
          <div className="hidden md:flex items-center space-x-3 font-helvetica-neue">
            {/* Direct Create Event Quick Action */}
            <Link
              to="/organizer"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>

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

      {/* Mobile overlay */}
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
          <Link to="/" onClick={closeMobileMenu} className="text-xl font-bold text-white">
            Events
          </Link>
          {user && (
            <Link to="/my-bookings" onClick={closeMobileMenu} className="text-xl font-bold text-white">
              My Bookings
            </Link>
          )}
          <Link to="/organizer" onClick={closeMobileMenu} className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </Link>
          {user && (
            <Link to="/organizer" onClick={closeMobileMenu} className="text-xl font-bold text-white">
              Organizer Studio
            </Link>
          )}
          {(user?.role === 'staff' || user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link to="/door-scanner" onClick={closeMobileMenu} className="text-xl font-bold text-white">
              Live Scanner
            </Link>
          )}
          {user?.role === 'superadmin' && (
            <Link to="/superadmin" onClick={closeMobileMenu} className="text-xl font-bold text-amber-300 flex items-center space-x-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Venue Financials</span>
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link to="/admin" onClick={closeMobileMenu} className="text-xl font-bold text-purple-300">
              Operations & Staff
            </Link>
          )}
          {(user?.role === 'staff' || user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link to="/chat" onClick={closeMobileMenu} className="text-xl font-bold text-white">
              Team Chat
            </Link>
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
