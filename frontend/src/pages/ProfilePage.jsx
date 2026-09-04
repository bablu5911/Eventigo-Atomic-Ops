import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Key, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, checkLoggedIn } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState(null);
  const [passErr, setPassErr] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await api.put('/auth/update-profile', { name, email });
      if (res.data.success) {
        setProfileMsg('Profile updated successfully');
        checkLoggedIn();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Profile update failed');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    setPassErr(null);
    try {
      const res = await api.put('/auth/update-password', { currentPassword, newPassword });
      if (res.data.success) {
        setPassMsg('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPassErr(err.response?.data?.error || 'Password update failed');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-2">
          <User className="w-6 h-6 text-cyan-400" />
          <span>User Profile & Security Settings</span>
        </h1>
      </div>

      <div className="wireframe-card p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-lg text-slate-100 border-b border-slate-800 pb-3">Personal Information</h2>
        
        {profileMsg && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Account Role</label>
            <input
              type="text"
              disabled
              value={user.role.toUpperCase()}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono font-bold cursor-not-allowed opacity-80"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20"
          >
            Update Profile
          </button>
        </form>
      </div>

      <div className="wireframe-card p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-lg text-slate-100 border-b border-slate-800 pb-3">Update Password</h2>
        
        {passMsg && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{passMsg}</span>
          </div>
        )}

        {passErr && (
          <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300">
            {passErr}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs border border-slate-700"
          >
            Update Password
          </button>
        </form>
      </div>

    </div>
  );
}
