import React from 'react';
import { Camera, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickStats: React.FC = () => {
  const { stats, cameras, alerts } = useApp();

  const activeCount = cameras.filter((c) => c.status === 'online').length;
  const offlineCount = cameras.filter((c) => c.status === 'offline').length;
  const totalCount = cameras.length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;

  const statCards = [
    {
      title: 'Total Cameras',
      value: totalCount,
      subtitle: 'Across 8 Border Sectors',
      icon: Camera,
      color: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      badge: 'RTSP/ONVIF',
      badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
    },
    {
      title: 'Active Cameras',
      value: activeCount,
      subtitle: `${Math.round((activeCount / (totalCount || 1)) * 100)}% Network Coverage`,
      icon: Wifi,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      badge: 'LIVE STREAMS',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    },
    {
      title: 'Intrusion Alerts Today',
      value: stats.intrusionAlertsToday,
      subtitle: `${criticalAlertsCount} Critical Breaches`,
      icon: ShieldAlert,
      color: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-500/15 border-red-500/30',
      badge: 'ACTIVE THREATS',
      badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30 animate-pulse',
    },
    {
      title: 'Offline Cameras',
      value: offlineCount,
      subtitle: offlineCount > 0 ? 'Requires Node Inspection' : 'All Feeds Operational',
      icon: WifiOff,
      color: offlineCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400',
      iconBg: offlineCount > 0 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-[var(--surface-raised)] border-[var(--border)]',
      badge: offlineCount > 0 ? 'ATTENTION' : 'NOMINAL',
      badgeColor: offlineCount > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30' : 'bg-[var(--surface-raised)] text-[var(--muted)] border-[var(--border)]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 transition-colors">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-sky-500/40"
          >
            {/* Background watermark icon */}
            <Icon className="absolute -right-2 -bottom-2 w-20 h-20 opacity-5 pointer-events-none text-[var(--text)]" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-[var(--text)]">
                    {card.value}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${card.iconBg} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-2 text-[11px] text-[var(--muted)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
