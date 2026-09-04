import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import DoorCheckerPage from './pages/DoorCheckerPage';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-brand-cream text-brand-dark flex flex-col font-helvetica-neue selection:bg-brand-green selection:text-white">
            <Navbar />
            <main className="flex-1 pt-16 md:pt-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events/:slug" element={<EventDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/door-checker"
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'organizer', 'admin']}>
                      <DoorCheckerPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/superadmin"
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'organizer', 'admin']}>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
