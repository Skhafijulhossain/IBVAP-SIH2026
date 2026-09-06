import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Camera, 
  Bell, 
  History, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActivePage = 'dashboard' | 'monitoring' | 'cameras' | 'alerts' | 'events' | 'login';

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
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
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
      badgeColor: criticalCount > 0 
        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse' 
        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    },
    {
      id: 'events' as ActivePage,
      label: 'Event History',
      icon: History,
      badge: undefined,
    },
    {
      id: 'login' as ActivePage,
      label: 'Operator Clearance',
      icon: ShieldCheck,
      badge: 'Auth',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
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
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-30 h-full lg:h-[calc(100vh-61px)] w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col justify-between transition-transform duration-300 ease-in-out select-none shadow-sm ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col justify-between">
          {/* Main Navigation Section */}
          <div>
            <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
              <span>Tactical Operations</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
            </div>

            <nav className="space-y-1.5">
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
                        ? 'bg-sky-600 text-white shadow-sm border border-sky-500'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--card-hover)] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive 
                            ? 'text-white' 
                            : 'text-sky-500 dark:text-cyan-400 group-hover:text-sky-600 dark:group-hover:text-cyan-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                            item.badgeColor || 'bg-[var(--card)] text-[var(--muted)] border-[var(--border)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive 
                            ? 'text-white translate-x-0.5' 
                            : 'text-[var(--muted-light)] group-hover:translate-x-0.5 group-hover:text-[var(--text)]'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick System Badge: Ends cleanly after Operator Clearance */}
          <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--muted)] uppercase font-semibold">
              <span>BORDER SENSORS</span>
              <span className="text-emerald-500 font-bold">ARMED</span>
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              {stats.activeCameras} OF {stats.totalCameras} NODES SYNCHRONIZED
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--border)] text-center bg-[var(--surface)]">
          <div className="text-[10px] font-mono font-semibold text-[var(--text)]">
            TEAM <span className="text-sky-600 dark:text-cyan-400">BWU NEURAL NEXUS</span>
          </div>
          <div className="text-[9px] text-[var(--muted)]">
            Smart India Hackathon 2026 Edition
          </div>
        </div>
      </aside>
    </>
  );
};
