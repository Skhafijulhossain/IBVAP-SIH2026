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
  const [activeLayer, setActiveLayer] = useState<'all' | 'breaches' | 'patrol'>('all');
  const [hoveredCamera, setHoveredCamera] = useState<Camera | null>(null);

  // Approximate relative percentages on our custom vector tactical border grid
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
    <div className="rounded-2xl bg-[#090e1a]/95 border border-sky-950/70 p-4 shadow-xl flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Tactical Border Geo-Sector Grid
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE RADAR
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Sector 1-8 Northern Defense Line • Camera FOV & Intrusion Vector Tracking
            </p>
          </div>
        </div>

        {/* Layer Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeLayer === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setActiveLayer('breaches')}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeLayer === 'breaches' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Breach Zones
          </button>
        </div>
      </div>

      {/* Vector Tactical Radar Map Viewport */}
      <div className="relative flex-1 min-h-[320px] lg:min-h-[380px] w-full rounded-xl bg-[#050914] border border-sky-900/40 overflow-hidden tactical-grid-bg select-none">
        {/* Radar Sweep Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="w-[300px] h-[300px] rounded-full border border-cyan-500/30 relative">
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/20" />
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-cyan-400/40 animate-radar-sweep" />
          </div>
        </div>

        {/* SVG Tactical Map Layers: Border Fence Lines, Ravines, Waterways */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Concentric Radar Rings */}
          <circle cx="50" cy="50" r="20" fill="none" stroke="#0284c7" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0284c7" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.25" />

          {/* Primary Border Demarcation Line (Yellow/Red dashed) */}
          <path
            d="M 5,25 Q 30,15 50,22 T 95,18"
            fill="none"
            stroke="#eab308"
            strokeWidth="0.7"
            strokeDasharray="2,1"
            opacity="0.8"
          />

          {/* Buffer Zone Area */}
          <path
            d="M 5,35 Q 30,28 50,34 T 95,30"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="0.4"
            strokeDasharray="1,1"
            opacity="0.5"
          />

          {/* Riverine Boundary (Sector 4) */}
          <path
            d="M 55,60 Q 65,70 80,65 T 95,85"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Patrol Route Paths */}
          <line x1="20" y1="40" x2="48" y2="46" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.6" />
          <line x1="48" y1="46" x2="62" y2="68" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.6" />
        </svg>

        {/* Sector Labels */}
        <div className="absolute top-4 left-6 text-[10px] font-mono text-cyan-400/80 font-bold pointer-events-none">
          SECTOR-1 (NORTH PERIMETER)
        </div>
        <div className="absolute top-4 right-6 text-[10px] font-mono text-cyan-400/80 font-bold pointer-events-none">
          SECTOR-5 (ALPINE FOREST)
        </div>
        <div className="absolute bottom-4 left-6 text-[10px] font-mono text-cyan-400/80 font-bold pointer-events-none">
          COMMAND POST ALPHA (HQ)
        </div>
        <div className="absolute bottom-4 right-6 text-[10px] font-mono text-cyan-400/80 font-bold pointer-events-none">
          SECTOR-7 (EASTERN DUNES)
        </div>

        {/* QRF Fast Response Units on Map */}
        <div
          style={{ left: '46%', top: '54%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-300 pointer-events-none shadow"
        >
          <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span>QRF-1 READY</span>
        </div>

        <div
          style={{ left: '68%', top: '48%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-300 pointer-events-none shadow"
        >
          <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span>QRF-2 PATROL</span>
        </div>

        {/* Camera Node Markers */}
        {cameras.map((camera) => {
          const coords = cameraMapCoords[camera.id] || { x: 50, y: 50, fovStart: 0, fovEnd: 60 };
          const isCritical = criticalCameras.has(camera.id);
          const isSelected = selectedCamera?.id === camera.id;
          const isOffline = camera.status === 'offline';

          if (activeLayer === 'breaches' && !isCritical) {
            return null;
          }

          return (
            <div
              key={camera.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              onMouseEnter={() => setHoveredCamera(camera)}
              onMouseLeave={() => setHoveredCamera(null)}
            >
              {/* Field of View (FOV) Arc Cone */}
              {!isOffline && (
                <div
                  className="absolute pointer-events-none w-20 h-20 -translate-x-1/2 -translate-y-1/2 opacity-20"
                  style={{
                    transform: `rotate(${camera.location.heading}deg)`,
                    background: isCritical
                      ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)',
                    clipPath: 'polygon(50% 50%, 20% 0%, 80% 0%)',
                  }}
                />
              )}

              {/* Pulsing Alarm Glow if Breach */}
              {isCritical && (
                <span className="absolute -inset-2 rounded-full bg-red-500 opacity-75 animate-ping" />
              )}

              {/* Camera Pin Button */}
              <button
                onClick={() => {
                  setSelectedCamera(camera);
                  if (onSelectCamera) onSelectCamera(camera);
                }}
                className={`relative flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 shadow-md ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-white ring-4 ring-cyan-500/40 scale-125 z-30'
                    : isCritical
                    ? 'bg-red-600 text-white border-red-400 animate-pulse scale-110'
                    : isOffline
                    ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : 'bg-slate-900 text-sky-400 border-sky-500/50 hover:border-cyan-400 hover:scale-110'
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Node ID Tag */}
              <div
                className={`absolute top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow border ${
                  isSelected
                    ? 'bg-cyan-400 text-black border-white'
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
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-xs text-slate-200 flex items-center gap-4 animate-fadeIn">
            <div>
              <div className="font-bold text-cyan-300">{hoveredCamera.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                GPS: {hoveredCamera.location.lat.toFixed(4)}°N, {hoveredCamera.location.lng.toFixed(4)}°E • Elev: {hoveredCamera.location.elevation}
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
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
      <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-cyan-200" />
            <span>Active Camera Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-300" />
            <span>Intrusion Alert Breach</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-yellow-400" />
            <span>Border Fence Line</span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-sky-400">
          COORDINATES: GRID 34.08°N / 74.79°E
        </div>
      </div>
    </div>
  );
};
