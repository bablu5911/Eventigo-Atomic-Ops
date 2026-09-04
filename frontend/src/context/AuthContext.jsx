import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, getAccessToken, setRefreshToken, getRefreshToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('atomic_ops_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkLoggedIn();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('atomic_ops_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const checkLoggedIn = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      localStorage.removeItem('atomic_ops_user');
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('atomic_ops_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      // ONLY clear session if server explicitly returns 401 Unauthorized
      // Never wipe login on transient network hiccups or serverless cold starts
      if (err.response?.status === 401) {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        localStorage.removeItem('atomic_ops_user');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const token = res.data.token || res.data?.data?.accessToken;
        const refreshTokenVal = res.data.refreshToken || res.data?.data?.refreshToken;
        const userData = res.data.user || res.data?.data?.user;

        if (token) setAccessToken(token);
        if (refreshTokenVal) setRefreshToken(refreshTokenVal);
        if (userData) {
          setUser(userData);
          localStorage.setItem('atomic_ops_user', JSON.stringify(userData));
        }
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role = 'attendee', username = '') => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, role, username });
      
      if (typeof res.data === 'string' && res.data.includes('<!doctype html>')) {
        const msg = 'API endpoint returned HTML. Ensure backend is running and connected.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (res.data?.success) {
        const token = res.data.token || res.data?.data?.accessToken;
        const refreshTokenVal = res.data.refreshToken || res.data?.data?.refreshToken;
        const userData = res.data.user || res.data?.data?.user;

        if (token) setAccessToken(token);
        if (refreshTokenVal) setRefreshToken(refreshTokenVal);
        if (userData) {
          setUser(userData);
          localStorage.setItem('atomic_ops_user', JSON.stringify(userData));
        }
        return { success: true, user: userData };
      }

      const msg = res.data?.error || res.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore error on logout
    }
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('atomic_ops_user');
    setUser(null);
  };

  const quickSwitchRole = async (targetRole) => {
    const defaultCredentials = {
      admin: { email: 'admin@atomicops.com', password: 'Password123!' },
      organizer: { email: 'organizer@atomicops.com', password: 'Password123!' },
      attendee: { email: 'attendee@atomicops.com', password: 'Password123!' }
    };

    const creds = defaultCredentials[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const loginWithGoogle = async (idToken) => {
    setError(null);
    try {
      const res = await api.post('/auth/google', { idToken });
      const token = res.data?.data?.accessToken || res.data?.token;
      const refreshTokenVal = res.data?.data?.refreshToken || res.data?.refreshToken;
      const userData = res.data?.data?.user || res.data?.user;
      if (token && userData) {
        setAccessToken(token);
        if (refreshTokenVal) setRefreshToken(refreshTokenVal);
        setUser(userData);
        localStorage.setItem('atomic_ops_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Failed to extract user payload' };
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Google authentication failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        quickSwitchRole,
        checkLoggedIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
