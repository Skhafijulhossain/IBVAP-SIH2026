import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Camera, 
  Bell, 
  History, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActivePage = 'dashboard' | 'monitoring' | 'cameras' | 'alerts' | 'events' | 'settings' | 'login';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { alerts, stats } = useApp();

  const newAlertsCount = alerts.filter((a) => a.status === 'new').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'new').length;

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Command Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'monitoring' as ActivePage,
      label: 'Live CCTV Monitoring',
      icon: Video,
      badge: `${stats.activeCameras} Live`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'cameras' as ActivePage,
      label: 'Camera Management',
      icon: Camera,
      badge: `${stats.totalCameras} Nodes`,
    },
    {
      id: 'alerts' as ActivePage,
      label: 'Alerts & Triage',
      icon: Bell,
      badge: newAlertsCount > 0 ? `${newAlertsCount} New` : undefined,
      badgeColor: criticalCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    },
    {
      id: 'events' as ActivePage,
      label: 'Event History',
      icon: History,
      badge: undefined,
    },
    {
      id: 'settings' as ActivePage,
      label: 'AI & System Config',
      icon: Settings,
      badge: undefined,
    },
    {
      id: 'login' as ActivePage,
      label: 'Operator Clearance',
      icon: ShieldCheck,
      badge: 'Auth',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-30 h-full lg:h-[calc(100vh-61px)] w-64 bg-[#090e1a] border-r border-sky-950/60 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Section: Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Tactical Operations</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPage(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600/90 to-blue-700/90 text-white shadow-md shadow-sky-600/30 border border-sky-400/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-sky-400 group-hover:text-cyan-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                          isActive ? 'text-white translate-x-0.5' : 'group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Edge AI Compute Status Widget */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-900/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edge AI Engine</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Model:</span>
                <span className="font-mono text-sky-300">YOLOv11-Border</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Pool:</span>
                <span className="font-mono text-emerald-400 font-bold">{stats.edgeAiInferenceFps} FPS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Edge Latency:</span>
                <span className="font-mono text-cyan-300">4.2 ms / frame</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-cyan-500 to-sky-500 h-full w-[48%] rounded-full animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>NPU Load: 48%</span>
                <span>VRAM: 3.4/8 GB</span>
              </div>
            </div>
          </div>

          {/* SIH 2026 Problem Statement Quick Reference */}
          <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-800/30 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-300">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>SIH 2026 PS Overview</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              AI Border Surveillance leveraging existing CCTV (RTSP/ONVIF) with offline-first edge compute & automated QRF dispatch.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sky-950/60 text-center bg-[#070b14]">
          <div className="text-[10px] font-mono text-slate-400">
            TEAM <strong className="text-sky-300">BWU NEURAL NEXUS</strong>
          </div>
          <div className="text-[9px] text-slate-400">
            Smart India Hackathon 2026 Edition
          </div>
        </div>
      </aside>
    </>
  );
};
