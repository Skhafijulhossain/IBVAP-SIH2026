import React from 'react';
import { Radio, Scan } from 'lucide-react';

interface TacticalSkeletonProps {
  type?: 'feed' | 'card' | 'matrix';
  label?: string;
  count?: number;
}

export const TacticalSkeleton: React.FC<TacticalSkeletonProps> = ({
  type = 'feed',
  label = 'INITIALIZING SENSOR TELEMETRY...',
  count = 4,
}) => {
  if (type === 'matrix') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <TacticalSkeleton key={i} type="feed" label={`SYNCING EDGE SENSOR CH-0${i + 1}...`} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="p-4 rounded-2xl bg-[#090e1a]/90 border border-slate-800/80 animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="h-4 w-12 bg-slate-800 rounded" />
        </div>
        <div className="h-8 w-20 bg-slate-800 rounded" />
        <div className="h-2 w-full bg-slate-800 rounded" />
      </div>
    );
  }

  // Default: Tactical CCTV Feed skeleton with radar scanner sweep
  return (
    <div className="relative aspect-video w-full rounded-2xl bg-[#070b14] border border-sky-950/70 overflow-hidden flex flex-col items-center justify-center select-none shadow-xl">
      {/* Tactical HUD Corner brackets */}
      <div className="hud-corner-tl opacity-50" />
      <div className="hud-corner-tr opacity-50" />
      <div className="hud-corner-bl opacity-50" />
      <div className="hud-corner-br opacity-50" />

      {/* Background Radar Grid */}
      <div className="absolute inset-0 tactical-grid-bg opacity-30 pointer-events-none" />

      {/* Radar sweep animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full border border-sky-500/20 border-dashed animate-spin flex items-center justify-center" style={{ animationDuration: '8s' }}>
          <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Scanning sweep line */}
      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-scan pointer-events-none" />

      {/* Status indicator */}
      <div className="z-10 mt-16 text-center space-y-1 px-4">
        <div className="text-xs font-mono font-bold tracking-widest text-sky-300 flex items-center justify-center gap-1.5 uppercase">
          <Scan className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{label}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          CONNECTING EDGE YOLO PIPELINE • 8-12 FPS CALIBRATION
        </div>
      </div>

      {/* Top HUD Skeleton */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500/60 animate-ping" />
          <span>INITIALIZING</span>
        </div>
        <span>IBVAP TAC-AI</span>
      </div>
    </div>
  );
};
