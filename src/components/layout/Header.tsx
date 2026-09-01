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
    <header className="sticky top-0 z-40 w-full bg-[#080e1b]/95 backdrop-blur-md border-b border-sky-950/60 shadow-lg px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        {/* Left Branding: SIH 2026 + IBVAP + Team */}
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-500 shadow-md shadow-sky-600/30 border border-sky-400/40">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base lg:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                IBVAP
                <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30 font-mono font-semibold">
                  SIH 2026
                </span>
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Team: BWU NEURAL NEXUS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Intelligent Border Video Analytics Platform • Existing CCTV AI Engine
            </p>
          </div>
        </div>

        {/* Center: System Status & Time synchronization */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
          {/* System Defense Grid Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">DEFENSE GRID:</span>
            <span className="font-mono text-emerald-400 font-bold">ONLINE (100%)</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Real-time sync clocks */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-sky-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentTime}</span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{currentUtc}</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* QRF Ready Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">QRF Units:</span>
            <span className="font-mono font-bold text-cyan-400">{stats.qrfUnitsDeployed} Deployed</span>
          </div>
        </div>

        {/* Right: Quick Action Controls, Demo Triggers & Operator Profile */}
        <div className="flex items-center gap-2">
          {/* Hackathon Demo Trigger Tool (Jury Presentation) */}
          <div className="relative">
            <button
              onClick={() => setShowDemoAlertDropdown(!showDemoAlertDropdown)}
              title="Trigger simulated live border intrusion alerts for hackathon jury evaluation"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="hidden sm:inline">Simulate Threat</span>
              <ChevronDown className="w-3 h-3 text-amber-400" />
            </button>

            {showDemoAlertDropdown && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs"
                onClick={() => setShowDemoAlertDropdown(false)}
              >
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Trigger Jury Demo Event
                </div>
                <button
                  onClick={() => triggerManualAlert('intrusion')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between"
                >
                  <span>🚨 Fence Intrusion</span>
                  <span className="text-[10px] font-mono text-red-400">CRITICAL</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('line_crossing')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between"
                >
                  <span>⚡ Tripwire Breach</span>
                  <span className="text-[10px] font-mono text-red-400">CRITICAL</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('vehicle')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/20 text-amber-300 flex items-center justify-between"
                >
                  <span>🚙 Unregistered Vehicle</span>
                  <span className="text-[10px] font-mono text-amber-400">WARNING</span>
                </button>
                <button
                  onClick={() => triggerManualAlert('person')}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-500/20 text-blue-300 flex items-center justify-between"
                >
                  <span>👮 Guard Patrol Unit</span>
                  <span className="text-[10px] font-mono text-blue-400">INFO</span>
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
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
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
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
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
                ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
                : 'bg-slate-800/80 hover:bg-red-950/40 text-slate-300 border-slate-700 hover:border-red-500/40'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${isEmergencyLockdown ? 'text-white' : 'text-red-400'}`} />
            <span className="hidden md:inline">
              {isEmergencyLockdown ? 'LOCKDOWN ACTIVE' : 'LOCKDOWN'}
            </span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title="Toggle SIH Theme"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* User Profile / Clearance Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-sky-900 border border-sky-400/40 flex items-center justify-center text-xs font-bold text-sky-300">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1] || ''}
                </div>
                <div className="text-[10px] text-sky-400 font-mono leading-tight">
                  {currentUser?.badgeId}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-xs"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="p-2 border-b border-slate-800 mb-2">
                  <div className="font-bold text-slate-100">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-400">{currentUser?.role}</div>
                  <div className="mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 inline-block border border-sky-500/30">
                    {currentUser?.clearanceLevel}
                  </div>
                </div>

                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Switch Operator (Jury / Reviewer Demo)
                </div>
                <div className="space-y-1 my-1">
                  {availableDemoUsers.map((u, i) => (
                    <button
                      key={u.id}
                      onClick={() => loginAsDemoUser(i)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        currentUser?.id === u.id
                          ? 'bg-sky-600/30 text-sky-300 font-semibold border border-sky-500/30'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{u.name}</span>
                      {currentUser?.id === u.id && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-2 mt-2">
                  <button
                    onClick={logout}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Station / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
