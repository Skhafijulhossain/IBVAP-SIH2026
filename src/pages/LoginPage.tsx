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
    <div className="min-h-[80vh] flex items-center justify-center p-4 transition-colors">
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl overflow-hidden">
        {/* Left Side (5 Cols): Defense Command Visual & Branding */}
        <div className="md:col-span-5 p-6 lg:p-8 bg-[var(--surface-raised)] border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
          <div className="tactical-grid-bg absolute inset-0 opacity-20 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-400 shadow-md border border-sky-300/40 shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[var(--text)] flex items-center gap-1.5">
                  IBVAP
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-400/30 font-mono font-bold">
                    SIH 2026
                  </span>
                </h1>
                <p className="text-[11px] font-mono text-sky-600 dark:text-cyan-400">Team: BWU NEURAL NEXUS</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure.
            </p>
          </div>

          {/* Defense Grid Status Highlights */}
          <div className="relative z-10 my-6 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline-First Edge Inference: READY</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>RTSP / ONVIF Integration: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Autonomous QRF Radio Mesh: SYNCED</span>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-[var(--border)] text-[10px] text-[var(--muted)] font-mono">
            SECURE ACCESS PORTAL • DEFENSE LEVEL 4
          </div>
        </div>

        {/* Right Side (7 Cols): Operator Login Form & 1-Click Jury Quick Demo Logins */}
        <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6 bg-[var(--card)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-[var(--text)] tracking-tight">
                  Operator Clearance Verification
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Enter authorized border defense credentials or select demo role
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Defense Badge ID / Call-Sign
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. BSF-OFFICER-774"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Tactical PIN / Security Passcode
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Authorize & Enter Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* 1-Click Quick Demo Switcher */}
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-cyan-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jury Evaluation / 1-Click Demo Profiles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_USERS.map((user: User, idx: number) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoSelect(idx)}
                  className="p-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] border border-[var(--border)] hover:border-sky-500/40 text-left transition-all group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-[var(--text)] truncate group-hover:text-sky-600 dark:group-hover:text-cyan-300">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">{user.role}</div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-cyan-300 shrink-0 border border-sky-500/25">
                    {user.clearanceLevel.split(' ')[0]}
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
