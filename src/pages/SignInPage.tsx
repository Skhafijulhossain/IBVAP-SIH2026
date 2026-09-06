import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Radio, 
  KeyRound,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import type { UserRole } from '../types';

interface SignInPageProps {
  onNavigateToSignUp: () => void;
  onSuccess?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onNavigateToSignUp, onSuccess }) => {
  const { signIn, loginAsDemoUser, isLoading, error, clearError, isSupabaseActive } = useAuth();

  const [email, setEmail] = useState<string>('commander@ibvap.mil');
  const [password, setPassword] = useState<string>('Commander@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your defense clearance email');
      return;
    }
    if (!password) {
      setLocalError('Please enter your tactical password');
      return;
    }

    const res = await signIn(email.trim(), password);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    clearError();
    setLocalError(null);
    loginAsDemoUser(role);
    if (onSuccess) onSuccess();
  };

  const activeError = localError || error;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 transition-colors">
      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        
        {/* Left Col (5 cols): Tactical Defense Visuals & System Status */}
        <div className="md:col-span-5 p-6 lg:p-8 bg-[var(--surface-raised)] border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
          <div className="tactical-grid-bg absolute inset-0 opacity-20 pointer-events-none" />

          {/* Top Logo & Unit Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-400 shadow-lg border border-sky-300/40 shrink-0">
                <Shield className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
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
              Intelligent Border Video Analytics Platform. Defense-grade perimeter intelligence & edge AI surveillance hub.
            </p>
          </div>

          {/* Defense Node Status Tickers */}
          <div className="relative z-10 my-6 space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-mono">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Auth Engine
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isSupabaseActive 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
              }`}>
                {isSupabaseActive ? 'CLOUD CONNECTED' : 'LOCAL DEFENSE MODE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-mono">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                YOLOv11 Edge Inference
              </span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-cyan-400">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-mono">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                QRF Mesh Defense Grid
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                ARMED
              </span>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="relative z-10 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted)] font-mono">
            <span>DEFENSE CLEARANCE LEVEL 4</span>
            <span className="text-sky-600 dark:text-cyan-400">256-BIT ENCRYPTED</span>
          </div>
        </div>

        {/* Right Col (7 cols): Secure Authentication Form */}
        <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6 bg-[var(--card)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-sky-500" />
                  Sign In to Command Center
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Authenticate authorized security credentials for perimeter operations
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {activeError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <div className="font-bold">Authentication Refused</div>
                  <div className="text-[11px] mt-0.5 opacity-90">{activeError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Input */}
              <div>
                <label className="block font-bold text-[var(--text)] mb-1.5 flex items-center justify-between">
                  <span>Defense Clearance Email</span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">SECURE IDENTITY</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeError) setLocalError(null);
                    }}
                    placeholder="commander@ibvap.mil"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block font-bold text-[var(--text)] mb-1.5 flex items-center justify-between">
                  <span>Security Password</span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">CONFIDENTIAL</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (activeError) setLocalError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Security Clearance...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Enter Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link to Sign Up */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[var(--muted)]">
                New personnel or station operator?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="font-bold text-sky-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Request Defense Clearance (Sign Up)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </p>
            </div>
          </div>

          {/* Quick Jury / Evaluator 1-Click Access */}
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Role Clearance (SIH Hackathon Review)</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">1-CLICK LOGIN</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('Commander')}
                className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-sky-500/15 border border-[var(--border)] hover:border-sky-500/50 text-left transition-all group"
              >
                <div className="font-bold text-[11px] text-[var(--text)] group-hover:text-sky-600 dark:group-hover:text-cyan-300">
                  Commander
                </div>
                <div className="text-[9px] text-[var(--muted)] font-mono">Full Mission Command</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('Analyst')}
                className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-sky-500/15 border border-[var(--border)] hover:border-sky-500/50 text-left transition-all group"
              >
                <div className="font-bold text-[11px] text-[var(--text)] group-hover:text-sky-600 dark:group-hover:text-cyan-300">
                  Analyst
                </div>
                <div className="text-[9px] text-[var(--muted)] font-mono">Video & Threat Triage</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('Admin')}
                className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-sky-500/15 border border-[var(--border)] hover:border-sky-500/50 text-left transition-all group"
              >
                <div className="font-bold text-[11px] text-[var(--text)] group-hover:text-sky-600 dark:group-hover:text-cyan-300">
                  Admin
                </div>
                <div className="text-[9px] text-[var(--muted)] font-mono">Infrastructure & Nodes</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
