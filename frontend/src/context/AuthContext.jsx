import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, getAccessToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkLoggedIn();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const checkLoggedIn = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAccessToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
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
        const user = res.data.user || res.data?.data?.user;
        if (token) setAccessToken(token);
        if (user) setUser(user);
        return { success: true, user };
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
      const userData = res.data?.data?.user || res.data?.user;
      if (token && userData) {
        setAccessToken(token);
        setUser(userData);
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
