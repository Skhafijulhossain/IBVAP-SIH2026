import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Radio, 
  ShieldCheck,
  Award,
  KeyRound
} from 'lucide-react';
import type { UserRole } from '../types';

interface SignUpPageProps {
  onNavigateToSignIn: () => void;
  onSuccess?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigateToSignIn, onSuccess }) => {
  const { signUp, isLoading, error, clearError, isSupabaseActive } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Commander');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (!fullName.trim()) {
      setLocalError('Please enter your full defense personnel name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please provide a valid defense clearance email');
      return;
    }
    if (password.length < 6) {
      setLocalError('Tactical password must be at least 6 characters in length');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Security password and confirm password do not match');
      return;
    }

    const res = await signUp(email.trim(), password, fullName.trim(), role);
    if (res.success) {
      setSuccessMessage(
        'Defense credentials registered! Your profile has been assigned to the tactical grid. Redirecting to Command Center...'
      );
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onNavigateToSignIn();
        }
      }, 1500);
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  const activeError = localError || error;

  const roleDescriptions: Record<UserRole, { badge: string; desc: string; clearance: string }> = {
    Commander: {
      badge: 'MISSION COMMAND',
      desc: 'Authorized for QRF deployment, emergency lockdown & sector defense command',
      clearance: 'DEFENSE LEVEL 4',
    },
    Analyst: {
      badge: 'VIDEO INTELLIGENCE',
      desc: 'Live CCTV threat triage, YOLOv11 deep analytics & surveillance event tracking',
      clearance: 'DEFENSE LEVEL 3',
    },
    Admin: {
      badge: 'STATION INFRASTRUCTURE',
      desc: 'Full camera network node configuration, RTSP ingest & platform administration',
      clearance: 'DEFENSE LEVEL 5',
    },
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 transition-colors">
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        
        {/* Left Side (5 cols): Tactical Clearance Dossier */}
        <div className="md:col-span-5 p-6 lg:p-8 bg-[var(--surface-raised)] border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
          <div className="tactical-grid-bg absolute inset-0 opacity-20 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-600 to-blue-700 shadow-lg border border-sky-300/40 shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[var(--text)] flex items-center gap-1.5">
                  IBVAP
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-400/30 font-mono font-bold">
                    SIH 2026
                  </span>
                </h1>
                <p className="text-[11px] font-mono text-sky-600 dark:text-cyan-400">Tactical Registration Portal</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enroll new defense personnel into the Intelligent Border Video Analytics Platform. Profiles are synchronized directly with Supabase database security rules.
            </p>
          </div>

          {/* Selected Role Clearance Card */}
          <div className="relative z-10 my-6 p-3.5 rounded-2xl bg-[var(--card)] border border-sky-500/30 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-sky-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-sky-500" />
                CLEARANCE ASSIGNED
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-500/25">
                {roleDescriptions[role].clearance}
              </span>
            </div>
            <div className="font-black text-sm text-[var(--text)] flex items-center gap-2">
              <span>{role}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {roleDescriptions[role].badge}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              {roleDescriptions[role].desc}
            </p>
          </div>

          {/* Security Protocols */}
          <div className="relative z-10 space-y-2 text-[11px] font-mono text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase RLS & Role Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              <span>FastAPI Backend JWT Handshake Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span>Live Mesh Telemetry Subscription</span>
            </div>
          </div>

          {/* Footer Status */}
          <div className="relative z-10 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted)] font-mono">
            <span>DATABASE: {isSupabaseActive ? 'SUPABASE CLOUD' : 'LOCAL CACHE'}</span>
            <span className="text-emerald-500 font-bold">GRID SECURE</span>
          </div>
        </div>

        {/* Right Side (7 cols): Registration Form */}
        <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-5 bg-[var(--card)]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-500" />
                  Request Defense Clearance
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Register new personnel profile & choose operational authorization
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {activeError && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <div className="font-bold">Clearance Registration Refused</div>
                  <div className="text-[11px] mt-0.5 opacity-90">{activeError}</div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <div className="flex-1">
                  <div className="font-bold">Personnel Cleared</div>
                  <div className="text-[11px] mt-0.5 opacity-90">{successMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">
                  Full Name & Rank
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Major Vikram Rathore"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-sans text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">
                  Defense Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@ibvap.mil"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">
                  Defense Assignment / User Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Commander', 'Analyst', 'Admin'] as UserRole[]).map((r) => {
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-400 shadow-sm font-bold'
                            : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:border-sky-500/40 hover:text-[var(--text)]'
                        }`}
                      >
                        <div className="text-xs">{r}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password & Confirm Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">
                    Password (min. 6 chars)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enrolling Defense Personnel...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Register Defense Personnel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Sign In Link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[var(--muted)]">
                Already hold authorized security clearance?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="font-bold text-sky-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Authenticate (Sign In)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
