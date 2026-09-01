import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DEMO_USERS } from '../data/mockData';
import type { User } from '../types';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginAsDemoUser } = useAuth();
  const [badgeId, setBadgeId] = useState<string>('BSF-OFFICER-774');
  const [passcode, setPasscode] = useState<string>('••••••••');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId.trim()) {
      setError('Please provide a valid Security Badge ID');
      return;
    }
    const success = login(badgeId, passcode);
    if (success) {
      onSuccess();
    } else {
      setError('Invalid clearance credentials');
    }
  };

  const handleDemoSelect = (index: number) => {
    loginAsDemoUser(index);
    onSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[#090e1a]/95 border border-sky-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Left Side (5 Cols): Defense Command Visual & Branding */}
        <div className="md:col-span-5 p-6 lg:p-8 bg-gradient-to-br from-sky-950/80 via-[#071324] to-[#050b14] border-b md:border-b-0 md:border-r border-sky-900/40 flex flex-col justify-between relative overflow-hidden">
          <div className="tactical-grid-bg absolute inset-0 opacity-30 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-400 shadow-lg shadow-sky-500/30 border border-sky-300/40">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  IBVAP
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-cyan-300 border border-sky-400/30 font-mono font-bold">
                    SIH 2026
                  </span>
                </h1>
                <p className="text-[11px] font-mono text-cyan-400">Team: BWU NEURAL NEXUS</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure.
            </p>
          </div>

          {/* Defense Grid Status Highlights */}
          <div className="relative z-10 my-6 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Offline-First Edge Inference: READY</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>RTSP / ONVIF Integration: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Autonomous QRF Radio Mesh: SYNCED</span>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-sky-900/40 text-[10px] text-slate-400 font-mono">
            SECURE ACCESS PORTAL • DEFENSE LEVEL 4
          </div>
        </div>

        {/* Right Side (7 Cols): Operator Login Form & 1-Click Jury Quick Demo Logins */}
        <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Operator Clearance Verification
                </h2>
                <p className="text-xs text-slate-400">
                  Authenticate using military/command badge ID
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tactical Badge ID / Operator Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. BSF-OFFICER-774"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Access Passcode / Biometric Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Authorize & Enter Surveillance Grid</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick 1-Click Demo Profiles for SIH 2026 Jury Review */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>1-Click Demo Logins (Jury & Evaluators)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_USERS.map((user: User, idx: number) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoSelect(idx)}
                  className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex items-center justify-between text-xs"
                >
                  <div className="truncate">
                    <div className="font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {user.role}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                    {user.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
