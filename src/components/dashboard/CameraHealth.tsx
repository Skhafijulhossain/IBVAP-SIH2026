import React, { useState } from 'react';
import { Camera } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Activity, 
  Radio, 
  RefreshCw
} from 'lucide-react';
import { camerasApi } from '../../api/camerasApi';

interface CameraHealthProps {
  onSelectCamera?: (camera: Camera) => void;
}

export const CameraHealth: React.FC<CameraHealthProps> = ({ onSelectCamera }) => {
  const { cameras, refreshCameras, setSelectedCamera, blinkingCameraId, streamStatus } = useApp();
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  const handleReboot = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRebootingId(id);
    await camerasApi.rebootCamera(id);
    await refreshCameras();
    setRebootingId(null);
  };

  const onlineCount = cameras.filter((c) => c.status === 'online').length;
  const offlineCount = cameras.filter((c) => c.status === 'offline').length;
  const degradedCount = cameras.filter((c) => c.status === 'degraded').length;

  return (
    <div className="rounded-2xl bg-[#090e1a]/95 border border-sky-950/70 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Camera Network Health & Telemetry
            </h3>
            <p className="text-[11px] text-slate-400">
              RTSP Stream Heartbeat, Signal Strength & Edge Node Diagnostics
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            {onlineCount} Online
          </span>
          {degradedCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {degradedCount} Degraded
            </span>
          )}
          {offlineCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
              {offlineCount} Offline
            </span>
          )}
        </div>
      </div>

      {/* Camera Health Grid / List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-1">
        {cameras.map((cam) => {
          const isOnline = cam.status === 'online';
          const isDegraded = cam.status === 'degraded';
          const isOffline = cam.status === 'offline';
          const isBlinking = blinkingCameraId === cam.id;
          const streamInfo = streamStatus ? streamStatus[cam.id] : null;

          return (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedCamera(cam);
                if (onSelectCamera) onSelectCamera(cam);
              }}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group border ${
                isBlinking
                  ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-sky-500/40'
              }`}
            >
              {/* Left Column: Status Dot, ID, Name, IP */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isOnline
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : isDegraded
                      ? 'bg-amber-500'
                      : 'bg-red-500 animate-pulse'
                  }`}
                />

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 group-hover:text-cyan-300">
                      {cam.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {cam.name}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{cam.ipAddress}:{cam.port}</span>
                    <span>•</span>
                    <span>{cam.sector}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Signal Strength Bar, Heartbeat, Action */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Signal Strength */}
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 justify-end">
                    <Radio className="w-3 h-3 text-sky-400" />
                    <span className="font-bold text-slate-200">{cam.signalStrength}%</span>
                  </div>
                  <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      style={{ width: `${cam.signalStrength}%` }}
                      className={`h-full rounded-full ${
                        cam.signalStrength > 70
                          ? 'bg-emerald-500'
                          : cam.signalStrength > 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Heartbeat / Stream Status */}
                <div className="text-right text-[10px] font-mono">
                  <div className="text-slate-400">
                    {streamInfo?.status === 'streaming' ? 'RTSP Stream' : 'Heartbeat'}
                  </div>
                  <div className={`font-semibold ${isOffline ? 'text-red-400' : streamInfo?.status === 'streaming' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {streamInfo?.status === 'streaming' ? `${streamInfo.target_fps} FPS (Live)` : cam.lastHeartbeat}
                  </div>
                </div>

                {/* Reboot / Diagnostic Action */}
                <button
                  onClick={(e) => handleReboot(e, cam.id)}
                  disabled={rebootingId === cam.id}
                  title="Reboot Edge Stream Node"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${rebootingId === cam.id ? 'animate-spin text-cyan-400' : ''}`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
