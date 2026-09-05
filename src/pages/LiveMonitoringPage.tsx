import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TacticalCctvFeed } from '../components/video/TacticalCctvFeed';
import type { VisionMode, Camera } from '../types';
import { 
  Grid2X2, 
  Grid3X3, 
  Square, 
  Flame, 
  Eye, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Video, 
  Sun
} from 'lucide-react';
import { TacticalSkeleton } from '../components/common/TacticalSkeleton';

export const LiveMonitoringPage: React.FC = () => {
  const { cameras, selectedCamera, setSelectedCamera } = useApp();
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [globalVisionMode, setGlobalVisionMode] = useState<VisionMode>('optical');
  const [ptzFeedback, setPtzFeedback] = useState<string>('PTZ Standby');

  const activeCam = selectedCamera || cameras[0];

  const handlePtzAction = (action: string) => {
    if (!activeCam) return;
    setPtzFeedback(`PTZ: ${action.toUpperCase()} (${activeCam.id})`);
    setTimeout(() => setPtzFeedback('PTZ Standby'), 1200);
  };

  const getGridClass = () => {
    if (gridLayout === '1x1') return 'grid-cols-1';
    if (gridLayout === '2x2') return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  const displayedCameras = gridLayout === '1x1' && activeCam ? [activeCam] : cameras;

  if (!activeCam) {
    return (
      <div className="p-4 space-y-4">
        <TacticalSkeleton type="matrix" count={4} label="SYNCHRONIZING TACTICAL CCTV MATRIX..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Toolbar: Grid Switcher, Global Vision Modes, Stream Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl">
        {/* Left: Title & Live indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Tactical Live Surveillance Matrix
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {cameras.filter((c: Camera) => c.status === 'online').length} OF {cameras.length} ONLINE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Low-latency edge AI RTSP multi-stream viewer with thermal fusion and PTZ tracking
            </p>
          </div>
        </div>

        {/* Right: Vision Modes & Grid Layout Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Vision Mode Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setGlobalVisionMode('optical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                globalVisionMode === 'optical' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Optical HD</span>
            </button>
            <button
              onClick={() => setGlobalVisionMode('thermal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                globalVisionMode === 'thermal' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-200" />
              <span>Thermal IR</span>
            </button>
            <button
              onClick={() => setGlobalVisionMode('night_vision')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                globalVisionMode === 'night_vision' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Night Vision</span>
            </button>
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setGridLayout('1x1')}
              title="1x1 Single Focus"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                gridLayout === '1x1' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridLayout('2x2')}
              title="2x2 4-Grid"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                gridLayout === '2x2' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridLayout('3x3')}
              title="3x3 All Cameras"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                gridLayout === '3x3' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Monitoring Workspace: Video Matrix (Left) + PTZ Controls & Camera List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Video Feeds Grid (9 Cols on large screen) */}
        <div className="lg:col-span-9 space-y-3">
          <div className={`grid ${getGridClass()} gap-4`}>
            {displayedCameras.map((camera: Camera) => (
              <TacticalCctvFeed
                key={camera.id}
                camera={camera}
                visionMode={globalVisionMode}
                isFocused={activeCam.id === camera.id}
                onSelectCamera={(cam: Camera) => setSelectedCamera(cam)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar: PTZ Controller & Active Camera Telemetry (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Camera Card */}
          <div className="p-4 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300">Focused Camera</div>
              <span className="font-mono text-xs font-bold text-cyan-400">{activeCam.id}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-white">{activeCam.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{activeCam.sector}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{activeCam.rtspUrl}</div>
            </div>

            {/* Switch Active Camera dropdown */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Select Camera Feed:</label>
              <select
                value={activeCam.id}
                onChange={(e) => {
                  const found = cameras.find((c: Camera) => c.id === e.target.value);
                  if (found) setSelectedCamera(found);
                }}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {cameras.map((c: Camera) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PTZ (Pan-Tilt-Zoom) Controller */}
          <div className="p-4 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>PTZ Turret Controller</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                {activeCam.ptzCapable ? 'ONVIF PTZ' : 'DIGITAL PTZ'}
              </span>
            </div>

            {/* Feedback ticker */}
            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-center text-cyan-300">
              {ptzFeedback}
            </div>

            {/* D-Pad Directional Arrows */}
            <div className="flex justify-center my-2">
              <div className="relative w-36 h-36 rounded-full bg-slate-900 border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {/* Up */}
                <button
                  onClick={() => handlePtzAction('Tilt Up')}
                  className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white flex items-center justify-center text-xs font-bold transition-colors shadow"
                >
                  ▲
                </button>
                {/* Down */}
                <button
                  onClick={() => handlePtzAction('Tilt Down')}
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white flex items-center justify-center text-xs font-bold transition-colors shadow"
                >
                  ▼
                </button>
                {/* Left */}
                <button
                  onClick={() => handlePtzAction('Pan Left')}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white flex items-center justify-center text-xs font-bold transition-colors shadow"
                >
                  ◀
                </button>
                {/* Right */}
                <button
                  onClick={() => handlePtzAction('Pan Right')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white flex items-center justify-center text-xs font-bold transition-colors shadow"
                >
                  ▶
                </button>
                {/* Center Auto-Home */}
                <button
                  onClick={() => handlePtzAction('Auto Center')}
                  className="w-9 h-9 rounded-full bg-cyan-600/30 hover:bg-cyan-500 border border-cyan-400 text-cyan-300 hover:text-black flex items-center justify-center text-[10px] font-mono font-bold transition-colors"
                >
                  CTR
                </button>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePtzAction('Zoom In (Optical 10x)')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zoom In</span>
              </button>
              <button
                onClick={() => handlePtzAction('Zoom Out (Wide Angle)')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zoom Out</span>
              </button>
            </div>

            {/* Preset Guard Patrol Positions */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Patrol Presets
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => handlePtzAction('Preset 1: Gate Sweep')}
                  className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
                >
                  P-01 Gate
                </button>
                <button
                  onClick={() => handlePtzAction('Preset 2: Fence Line')}
                  className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
                >
                  P-02 Fence
                </button>
                <button
                  onClick={() => handlePtzAction('Preset 3: Ravine Gap')}
                  className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
                >
                  P-03 Gap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
