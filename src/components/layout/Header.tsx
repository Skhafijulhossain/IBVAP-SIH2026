import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Radio, 
  Clock, 
  AlertTriangle, 
  Zap,
  CheckCircle2,
  ChevronDown,
  User,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { 
    soundEnabled, 
    toggleSound, 
    isSimulatingAlerts, 
    toggleSimulation, 
    isEmergencyLockdown, 
    toggleEmergencyLockdown, 
    triggerManualAlert,
    stats
  } = useApp();
  const { currentUser, logout, loginAsDemoUser, availableDemoUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentUtc, setCurrentUtc] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showDemoAlertDropdown, setShowDemoAlertDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      // IST Time
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
      // UTC Time
      setCurrentUtc(
        now.toISOString().substring(11, 19) + ' UTC'
      );
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--border)] shadow-sm px-4 lg:px-6 py-2.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        {/* Left Branding: SIH 2026 + IBVAP + Team */}
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-500 shadow-sm border border-sky-400/40 shrink-0">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black tracking-tight text-[var(--text)] flex items-center gap-1.5">
                IBVAP
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-400/30 font-mono font-semibold">
                  SIH 2026
                </span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Team: BWU NEURAL NEXUS
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] hidden md:block">
              Intelligent Border Video Analytics Platform • Existing CCTV AI Engine
            </p>
          </div>
        </div>

        {/* Center: System Status & Time synchronization */}
        <div className="hidden xl:flex items-center gap-4 bg-[var(--surface-raised)] px-3.5 py-1.5 rounded-xl border border-[var(--border)]">
          {/* Defense Grid Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[var(--text)]">GRID:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">ONLINE (100%)</span>
          </div>

          <div className="h-3.5 w-px bg-[var(--border)]" />

          {/* Real-time sync clocks */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-sky-600 dark:text-sky-300">
              <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>{currentTime}</span>
            </div>
            <span className="text-[var(--muted-light)]">|</span>
            <span className="text-[var(--muted)]">{currentUtc}</span>
          </div>

          <div className="h-3.5 w-px bg-[var(--border)]" />

          {/* QRF Ready Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
            <span className="text-[var(--text-secondary)]">QRF Units:</span>
            <span className="font-mono font-bold text-sky-600 dark:text-cyan-400">{stats.qrfUnitsDeployed} Deployed</span>
          </div>
        </div>

        {/* Right: Quick Action Controls, Demo Triggers, Theme Toggle & Operator Profile */}
        <div className="flex items-center gap-2">
          {/* Hackathon Demo Trigger Tool (Jury Presentation) */}
          <div className="relative">
            <button
              onClick={() => setShowDemoAlertDropdown(!showDemoAlertDropdown)}
              title="Trigger simulated live border intrusion alerts for hackathon jury evaluation"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-bounce" />
              <span className="hidden sm:inline">Simulate Threat</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoAlertDropdown && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-2 z-50 text-xs"
                onClick={() => setShowDemoAlertDropdown(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                  Trigger Jury Demo Event
                </div>
                <button
                  onClick={() => triggerManualAlert('intrusion')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/15 text-red-600 dark:text-red-300 flex items-center justify-between"
                >
                  <span>🚨 Fence Intrusion</span>
                  <span className="text-[10px] font-mono font-bold text-red-500">CRITICAL</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('line_crossing')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/15 text-red-600 dark:text-red-300 flex items-center justify-between"
                >
                  <span>⚡ Tripwire Breach</span>
                  <span className="text-[10px] font-mono font-bold text-red-500">CRITICAL</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('vehicle')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-between"
                >
                  <span>🚙 Unregistered Vehicle</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500">WARNING</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('person')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-between"
                >
                  <span>👮 Guard Patrol Unit</span>
                  <span className="text-[10px] font-mono font-bold text-blue-500">INFO</span>
                </button>
              </div>
            )}
          </div>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Tactical Siren Audio' : 'Unmute Tactical Siren Audio'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center justify-center ${
              soundEnabled
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25'
                : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Live Simulation On/Off */}
          <button
            onClick={toggleSimulation}
            title={isSimulatingAlerts ? 'Pause Background Alert Ticker' : 'Resume Background Alert Ticker'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center justify-center ${
              isSimulatingAlerts
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {isSimulatingAlerts ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Emergency Lockdown Toggle */}
          <button
            onClick={toggleEmergencyLockdown}
            title={isEmergencyLockdown ? 'Disarm Perimeter Lockdown' : 'Trigger Immediate Perimeter Lockdown'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              isEmergencyLockdown
                ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-sm'
                : 'bg-[var(--surface-raised)] hover:bg-red-500/15 text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 border-[var(--border)] hover:border-red-500/40'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${isEmergencyLockdown ? 'text-white' : 'text-red-500'}`} />
            <span className="hidden md:inline">
              {isEmergencyLockdown ? 'LOCKDOWN ACTIVE' : 'LOCKDOWN'}
            </span>
          </button>

          {/* Theme Switcher Toggle (Placed beside Profile Section) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text)] transition-all text-xs flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600 hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          {/* User Profile / Clearance Dropdown */}
          {!currentUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-cyan-400 text-xs font-mono font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>SECURE ACCESS PORTAL</span>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] hover:border-sky-500/40 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-sky-600/20 border border-sky-400/40 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-300">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-[var(--text)] leading-tight flex items-center gap-1.5">
                    <span className="truncate max-w-[110px]">{currentUser.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase border ${
                      currentUser.role === 'Commander'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : currentUser.role === 'Analyst'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)] font-mono leading-tight truncate max-w-[140px]">
                    {currentUser.email || currentUser.badgeId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
              </button>

              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-3 z-50 text-xs text-[var(--text)]"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="p-2 border-b border-[var(--border)] mb-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[var(--text)] text-sm">{currentUser.name}</div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                        currentUser.role === 'Commander'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : currentUser.role === 'Analyst'
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    {currentUser.email && (
                      <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{currentUser.email}</div>
                    )}
                    <div className="mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 inline-block border border-sky-500/30">
                      {currentUser.clearanceLevel || 'DEFENSE LEVEL 4'}
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">
                    Quick Role Clearance Switcher
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-1.5">
                    {(['Commander', 'Analyst', 'Admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => loginAsDemoUser(r)}
                        className={`py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all ${
                          currentUser.role === r
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] border border-[var(--border)]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[var(--border)] pt-2 mt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Lock Station / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
