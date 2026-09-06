import React, { useState } from 'react';
import { Camera } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Crosshair, 
  Radio, 
  ShieldAlert, 
  Navigation
} from 'lucide-react';

interface BorderMapProps {
  onSelectCamera?: (camera: Camera) => void;
}

export const BorderMap: React.FC<BorderMapProps> = ({ onSelectCamera }) => {
  const { cameras, alerts, selectedCamera, setSelectedCamera } = useApp();
  const [activeLayer, setActiveLayer] = useState<'all' | 'breaches'>('all');
  const [hoveredCamera, setHoveredCamera] = useState<Camera | null>(null);

  const cameraMapCoords: Record<string, { x: number; y: number; fovStart: number; fovEnd: number }> = {
    'CAM-01': { x: 28, y: 32, fovStart: 310, fovEnd: 390 }, // Sector 1
    'CAM-02': { x: 18, y: 55, fovStart: 240, fovEnd: 310 }, // Sector 2
    'CAM-03': { x: 48, y: 46, fovStart: 140, fovEnd: 220 }, // Checkpoint
    'CAM-04': { x: 62, y: 68, fovStart: 80, fovEnd: 160 },  // River
    'CAM-05': { x: 74, y: 30, fovStart: 10, fovEnd: 80 },   // Forest
    'CAM-06': { x: 42, y: 20, fovStart: 340, fovEnd: 410 }, // Mountain Pass
    'CAM-07': { x: 86, y: 62, fovStart: 50, fovEnd: 120 },  // Desert
    'CAM-08': { x: 38, y: 78, fovStart: 180, fovEnd: 250 }, // Watchtower
  };

  const criticalCameras = new Set(
    alerts.filter((a) => a.severity === 'critical' && a.status === 'new').map((a) => a.cameraId)
  );

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-sm flex flex-col h-full transition-colors">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              Tactical Border Geo-Sector Grid
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                LIVE RADAR
              </span>
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Sector 1-8 Northern Defense Line • Camera FOV & Intrusion Vector Tracking
            </p>
          </div>
        </div>

        {/* Layer Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--surface-raised)] p-1 rounded-xl border border-[var(--border)] text-xs">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeLayer === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setActiveLayer('breaches')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeLayer === 'breaches' ? 'bg-red-600 text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Breach Zones
          </button>
        </div>
      </div>

      {/* Vector Tactical Radar Map Viewport */}
      <div className="relative flex-1 min-h-[300px] lg:min-h-[360px] w-full rounded-xl bg-[#050914] border border-sky-950 overflow-hidden tactical-grid-bg select-none shadow-inner">
        {/* Radar Sweep Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[280px] h-[280px] rounded-full border border-cyan-500/30 relative">
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/20" />
            <div className="w-full h-full rounded-full border border-transparent border-t-cyan-400/40 animate-radar-sweep" />
          </div>
        </div>

        {/* SVG Tactical Map Layers */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Concentric Radar Rings */}
          <circle cx="50" cy="50" r="20" fill="none" stroke="#0284c7" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0284c7" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.25" />

          {/* Primary Border Demarcation Line */}
          <path
            d="M 5,25 Q 30,15 50,22 T 95,18"
            fill="none"
            stroke="#eab308"
            strokeWidth="0.7"
            strokeDasharray="2,1"
            opacity="0.8"
          />

          {/* Buffer Perimeter Zone */}
          <path
            d="M 5,35 Q 30,25 50,32 T 95,28"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.4"
            strokeDasharray="1,2"
            opacity="0.5"
          />

          {/* River / Natural Barrier Feature */}
          <path
            d="M 55,60 Q 65,75 75,95"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
        </svg>

        {/* Interactive Camera Nodes */}
        {cameras.map((camera) => {
          const coords = cameraMapCoords[camera.id] || { x: 50, y: 50 };
          const isCritical = criticalCameras.has(camera.id);
          const isSelected = selectedCamera?.id === camera.id;
          const isOffline = camera.status === 'offline';

          if (activeLayer === 'breaches' && !isCritical) return null;

          return (
            <div
              key={camera.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
              onMouseEnter={() => setHoveredCamera(camera)}
              onMouseLeave={() => setHoveredCamera(null)}
            >
              {/* FOV Visualizer Arc */}
              <div
                className={`absolute w-16 h-16 -top-5 -left-5 rounded-full pointer-events-none transition-opacity duration-200 ${
                  isSelected || isCritical ? 'opacity-30 bg-sky-500/30' : 'opacity-10 group-hover:opacity-25 bg-cyan-500/20'
                }`}
                style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0)' }}
              />

              <button
                onClick={() => {
                  setSelectedCamera(camera);
                  if (onSelectCamera) onSelectCamera(camera);
                }}
                className={`relative flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-150 shadow-sm ${
                  isSelected
                    ? 'bg-sky-500 text-white border-white scale-110 ring-2 ring-sky-500/40 z-30'
                    : isCritical
                    ? 'bg-red-600 text-white border-red-400 animate-pulse scale-105'
                    : isOffline
                    ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-slate-900 text-sky-400 border-sky-500/50 hover:border-cyan-400 hover:scale-105'
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="w-3 h-3 text-white" />
                ) : (
                  <Crosshair className="w-3 h-3" />
                )}
              </button>

              {/* Node ID Tag */}
              <div
                className={`absolute top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-sm border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-400'
                    : isCritical
                    ? 'bg-red-950 text-red-300 border-red-600'
                    : 'bg-black/80 text-slate-300 border-slate-800'
                }`}
              >
                {camera.id}
              </div>
            </div>
          );
        })}

        {/* Hover / Selection Telemetry Tooltip */}
        {hoveredCamera && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-xl backdrop-blur-md text-xs text-slate-200 flex items-center gap-3">
            <div>
              <div className="font-bold text-cyan-300 text-xs">{hoveredCamera.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                GPS: {hoveredCamera.location.lat.toFixed(4)}°N, {hoveredCamera.location.lng.toFixed(4)}°E
              </div>
            </div>

            <div className="text-right font-mono text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded font-bold ${
                  hoveredCamera.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {hoveredCamera.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Legend */}
      <div className="mt-3 pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between text-[11px] text-[var(--muted)] gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Active Camera Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Intrusion Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-yellow-400" />
            <span>Border Fence Line</span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-sky-600 dark:text-sky-400">
          GRID 34.08°N / 74.79°E
        </div>
      </div>
    </div>
  );
};
