import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api, { setAccessToken, setRefreshToken } from '../services/api';

export default function SocialLoginButtons({ onLoginSuccess }) {
  const { checkLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        toast.error('No Google credential token received');
        return;
      }

      const res = await api.post('/auth/google', { idToken });

      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        toast.error('API endpoint returned HTML. Ensure VITE_API_URL is configured to point to your live backend.');
        return;
      }

      const token = res.data?.data?.accessToken || res.data?.token;
      const refreshTokenVal = res.data?.data?.refreshToken || res.data?.refreshToken;
      const user = res.data?.data?.user || res.data?.user;

      if (!token) {
        toast.error(res.data?.message || res.data?.error || 'Authentication failed: no session token returned from backend.');
        return;
      }

      setAccessToken(token);
      if (refreshTokenVal) setRefreshToken(refreshTokenVal);
      if (user) {
        localStorage.setItem('atomic_ops_user', JSON.stringify(user));
      }
      await checkLoggedIn();

      toast.success(`Logged in with Google! Welcome ${user?.name || 'Attendee'}`);

      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        if (user?.role === 'superadmin') navigate('/superadmin');
        else if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'organizer') navigate('/organizer');
        else if (user?.role === 'staff') navigate('/door-checker');
        else navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Google login error:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Google sign-in failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleGoogleError = () => {
    console.error('Google sign-in prompt closed or error occurred');
    toast.error('Google sign-in failed');
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      <div className="w-full flex justify-center py-1">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
          width="360"
        />
      </div>
    </div>
  );
}
