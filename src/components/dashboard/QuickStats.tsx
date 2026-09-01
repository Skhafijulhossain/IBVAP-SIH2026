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
      color: 'text-sky-400',
      bgGlow: 'from-sky-500/10 to-blue-600/5 border-sky-500/30',
      badge: 'RTSP/ONVIF',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      title: 'Active Cameras',
      value: activeCount,
      subtitle: `${Math.round((activeCount / (totalCount || 1)) * 100)}% Network Coverage`,
      icon: Wifi,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-teal-600/5 border-emerald-500/30',
      badge: 'LIVE STREAMS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      title: 'Intrusion Alerts Today',
      value: stats.intrusionAlertsToday,
      subtitle: `${criticalAlertsCount} Critical Breaches`,
      icon: ShieldAlert,
      color: 'text-red-400',
      bgGlow: 'from-red-500/15 to-orange-600/5 border-red-500/40',
      badge: 'ACTIVE THREATS',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
    },
    {
      title: 'Offline Cameras',
      value: offlineCount,
      subtitle: offlineCount > 0 ? 'Requires Edge Node Inspection' : 'All Feeds Operational',
      icon: WifiOff,
      color: offlineCount > 0 ? 'text-amber-400' : 'text-slate-400',
      bgGlow: offlineCount > 0 ? 'from-amber-500/10 to-red-600/5 border-amber-500/30' : 'from-slate-800/40 to-slate-900/40 border-slate-700/50',
      badge: offlineCount > 0 ? 'ATTENTION' : 'NOMINAL',
      badgeColor: offlineCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700/40 text-slate-300 border-slate-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgGlow} border p-4 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] shadow-lg`}
          >
            {/* Background watermark icon */}
            <Icon className="absolute -right-2 -bottom-2 w-20 h-20 opacity-5 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
                    {card.value}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
