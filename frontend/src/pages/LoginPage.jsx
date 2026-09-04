import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken, setRefreshToken } from '../services/api';
import SocialAuthModal from '../components/SocialAuthModal';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { Triangle, LogIn, Key, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or User ID is required'),
  password: z.string().min(1, 'Password is required')
});

export default function LoginPage() {
  const { checkLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [step2FA, setStep2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [socialModal, setSocialModal] = useState({ isOpen: false, provider: 'google' });

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onLoginSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: data.email, password: data.password });

      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        toast.error('API endpoint returned HTML. Ensure VITE_API_URL is configured to point to your live backend.');
        return;
      }

      if (res.data.requires2FA) {
        setStep2FA(true);
        setTempToken(res.data.tempToken);
        setUserEmail(res.data.email);
        toast.success('Credentials verified. Please enter 6-digit OTP code.');
      } else if (res.data.token || res.data?.data?.accessToken) {
        const token = res.data.token || res.data?.data?.accessToken;
        const refreshTokenVal = res.data.refreshToken || res.data?.data?.refreshToken;
        const user = res.data.user || res.data?.data?.user;
        setAccessToken(token);
        if (refreshTokenVal) setRefreshToken(refreshTokenVal);
        if (user) {
          localStorage.setItem('atomic_ops_user', JSON.stringify(user));
        }
        await checkLoggedIn();
        toast.success(`Authenticated successfully as ${user?.name || 'User'} (${user?.role?.toUpperCase() || ''})`);

        // Redirect based on role
        if (user?.role === 'superadmin') navigate('/superadmin');
        else if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'organizer') navigate('/organizer');
        else if (user?.role === 'staff') navigate('/door-checker');
        else navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FASubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-2fa', { tempToken, otp: otpCode });
      if (res.data.success) {
        const token = res.data.token || res.data?.data?.accessToken;
        const refreshTokenVal = res.data.refreshToken || res.data?.data?.refreshToken;
        const user = res.data.user || res.data?.data?.user;
        setAccessToken(token);
        if (refreshTokenVal) setRefreshToken(refreshTokenVal);
        if (user) {
          localStorage.setItem('atomic_ops_user', JSON.stringify(user));
        }
        await checkLoggedIn();
        toast.success(`Authenticated successfully as ${user?.name || 'User'} (${user?.role?.toUpperCase() || ''})`);
        
        // Redirect based on role
        if (user?.role === 'superadmin') navigate('/superadmin');
        else if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'organizer') navigate('/organizer');
        else if (user?.role === 'staff') navigate('/door-checker');
        else navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 space-y-6 font-helvetica-neue">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center mx-auto text-brand-cream font-bold text-2xl shadow-sm">
          E
        </div>
        <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Eventigo</h1>
        <p className="text-xs text-brand-dark/60 font-medium">Sign in to access your tickets, passes, and events</p>
      </div>

      {!step2FA ? (
        /* Step 1: Username & Password Login */
        <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-7 rounded-3xl space-y-4 shadow-sm">
          
          {/* Social OAuth Buttons (Google & Apple ID) */}
          <div className="space-y-3">
            <SocialLoginButtons />

            <button
              type="button"
              onClick={() => setSocialModal({ isOpen: true, provider: 'apple' })}
              className="w-full py-3 bg-black hover:bg-neutral-900 text-white font-bold rounded-full transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider shadow-sm active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.19-9.55-11.03-20.67-14.52-33.34-3.48-12.67-5.23-24.36-5.23-35.08 0-14.7 3.59-26.79 10.77-36.27 7.18-9.48 16.5-14.33 27.97-14.55 4.35 0 9.38 1.15 15.09 3.44 5.71 2.3 9.49 3.44 11.33 3.44 1.41 0 5.48-1.22 12.2-3.66 6.72-2.44 12.16-3.5 16.32-3.18 12.83.65 22.95 5.76 30.36 15.34-11.09 6.74-16.52 16.09-16.3 28.05.22 9.57 3.91 17.5 11.08 23.81 7.17 6.31 15.65 9.9 25.44 10.77-2.61 7.83-5.76 15.22-9.45 22.18zM119.22 33.58c0-7.39 2.65-14.4 7.96-21.03 5.3-6.63 11.85-10.97 19.64-13.01.65 2.17.98 4.24.98 6.2 0 7.39-2.76 14.5-8.28 21.32-5.52 6.82-12.28 11.16-20.3 13.02z" />
              </svg>
              <span>Sign in with Apple ID</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-brand-dark/40 uppercase">
            <span className="flex-1 h-[1px] bg-brand-dark/10" />
            <span>or sign in with ID / email</span>
            <span className="flex-1 h-[1px] bg-brand-dark/10" />
          </div>

          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-brand-dark font-semibold block">Email or User ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="superadmin1, admin1, organizer1, staff1, user1"
                  {...register('email')}
                  className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl pl-10 pr-4 py-2.5 text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-mono"
                />
              </div>
              {errors.email && <p className="text-rose-600 text-[11px] mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-brand-dark font-semibold block">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-brand-cream border border-brand-dark/10 rounded-2xl pl-10 pr-4 py-2.5 text-brand-dark placeholder-brand-dark/40 focus:outline-none focus:border-brand-dark/40 font-mono"
                />
              </div>
              {errors.password && <p className="text-rose-600 text-[11px] mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors flex items-center justify-center space-x-2 text-sm uppercase tracking-wide disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-brand-dark/10 text-xs text-brand-dark/60">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-green font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      ) : (
        /* Step 2: 2FA OTP Verification Step */
        <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-7 rounded-3xl space-y-5 shadow-sm animate-fade-up">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark uppercase">2FA Security Challenge</h2>
            <p className="text-xs text-brand-dark/60">Verification code sent to {userEmail}</p>
          </div>

          <form onSubmit={onVerify2FASubmit} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-brand-dark/70 block">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-brand-cream border border-brand-dark/20 rounded-2xl py-3 text-center text-2xl font-mono tracking-widest text-brand-dark font-bold focus:outline-none focus:border-brand-dark"
              />
            </div>

            <div className="bg-brand-green/10 border border-brand-green/30 p-3 rounded-2xl text-center text-xs text-brand-dark font-mono">
              <span>Demo 2FA OTP Code: </span>
              <strong className="text-brand-green font-bold text-sm">123456</strong>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-green text-white font-bold rounded-full transition-colors flex items-center justify-center space-x-2 text-sm uppercase tracking-wide disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Complete Security Check'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Social Verification Modal */}
      <SocialAuthModal
        isOpen={socialModal.isOpen}
        provider={socialModal.provider}
        onClose={() => setSocialModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={(u) => {
          if (u.role === 'admin') navigate('/admin');
          else if (u.role === 'organizer') navigate('/organizer');
          else if (u.role === 'staff') navigate('/door-checker');
          else navigate(from, { replace: true });
        }}
      />
    </div>
  );
}
