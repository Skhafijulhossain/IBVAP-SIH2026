import React from 'react';
import { useApp } from '../context/AppContext';
import { QuickStats } from '../components/dashboard/QuickStats';
import { TacticalCctvFeed } from '../components/video/TacticalCctvFeed';
import { AiWorkflow } from '../components/dashboard/AiWorkflow';
import { BorderMap } from '../components/dashboard/BorderMap';
import { AlertPanel } from '../components/dashboard/AlertPanel';
import { CameraHealth } from '../components/dashboard/CameraHealth';
import { EventTimeline } from '../components/dashboard/EventTimeline';
import { Video, Radio, ChevronRight } from 'lucide-react';
import { TacticalSkeleton } from '../components/common/TacticalSkeleton';
import type { ActivePage } from '../components/layout/Sidebar';
import type { Camera } from '../types';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { cameras, setSelectedCamera, isEmergencyLockdown } = useApp();

  // Pick top 4 CCTV cameras for the primary grid (CAM-01, CAM-02, CAM-03, CAM-04)
  const primaryFourCameras = cameras.slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Emergency Lockdown Notice Banner if Triggered */}
      {isEmergencyLockdown && (
        <div className="p-4 rounded-2xl bg-red-600/90 text-white border-2 border-red-400 shadow-2xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 animate-pulse" />
            <div>
              <div className="font-black tracking-wide uppercase text-sm">
                CRITICAL PERIMETER LOCKDOWN IN EFFECT
              </div>
              <div className="text-xs text-red-100">
                Automated barrier closure initiated. All QRF response teams dispatched to Sector 1-4.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-3 py-1.5 rounded-xl bg-white text-red-700 font-bold text-xs shadow hover:bg-red-50 transition-colors shrink-0"
          >
            View Breach Sector
          </button>
        </div>
      )}

      {/* 1. Statistics Cards */}
      <QuickStats />

      {/* 2. Live Monitoring Grid: Four CCTV Cards (CAM-01, CAM-02, CAM-03, CAM-04) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Live Perimeter CCTV Monitoring Grid
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  4-CH ACTIVE HUD
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time AI target tracking, tripwire intrusion detection & multi-vision thermal feeds
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('monitoring')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-cyan-300 border border-slate-700/80 hover:border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <span>Full 8-CH Matrix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4-Grid CCTV Viewports */}
        {primaryFourCameras.length === 0 ? (
          <TacticalSkeleton type="matrix" count={4} label="INITIALIZING PRIMARY 4-CH DEFENSE GRID..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryFourCameras.map((camera: Camera) => (
              <TacticalCctvFeed
                key={camera.id}
                camera={camera}
                onSelectCamera={(cam: Camera) => {
                  setSelectedCamera(cam);
                  onNavigate('monitoring');
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. AI Workflow Section: Existing CCTV -> Edge AI -> AI Analytics -> Event Engine -> Command Center */}
      <section>
        <AiWorkflow />
      </section>

      {/* 4. Dual Section: Interactive Border Map & Real-time Alert Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Border Geo-Sector Radar Map (7 Cols) */}
        <div className="lg:col-span-7 h-full">
          <BorderMap
            onSelectCamera={(cam: Camera) => {
              setSelectedCamera(cam);
              onNavigate('monitoring');
            }}
          />
        </div>

        {/* Real-Time Priority Alert Triage Panel (5 Cols) */}
        <div className="lg:col-span-5 h-full">
          <AlertPanel />
        </div>
      </section>

      {/* 5. Dual Section: Camera Health & Event Timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Camera Health & Telemetry Diagnostics (4 Cols) */}
        <div className="lg:col-span-4 h-full">
          <CameraHealth
            onSelectCamera={(cam: Camera) => {
              setSelectedCamera(cam);
              onNavigate('cameras');
            }}
          />
        </div>

        {/* Event Forensics Timeline (8 Cols) */}
        <div className="lg:col-span-8 h-full">
          <EventTimeline />
        </div>
      </section>
    </div>
  );
};
