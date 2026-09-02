import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  VisionMode 
} from '../../types';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../api/client';
import { 
  Eye, 
  Flame, 
  Scan, 
  Camera as CameraIcon, 
  Radio, 
  ShieldAlert, 
  Crosshair, 
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import { formatConfidence } from '../../utils/helpers';

interface TacticalCctvFeedProps {
  camera: Camera;
  visionMode?: VisionMode;
  showAiOverlays?: boolean;
  showTripwire?: boolean;
  showControls?: boolean;
  onSelectCamera?: (camera: Camera) => void;
  isFocused?: boolean;
}

export const TacticalCctvFeed: React.FC<TacticalCctvFeedProps> = ({
  camera,
  visionMode: initialVisionMode = 'optical',
  showAiOverlays = true,
  showTripwire = true,
  showControls = true,
  onSelectCamera,
  isFocused = false,
}) => {
  const { blinkingCameraId, streamStatus } = useApp();
  const isBlinking = blinkingCameraId === camera.id;
  const activeStreamInfo = streamStatus ? streamStatus[camera.id] : null;

  const [localVisionMode, setLocalVisionMode] = useState<VisionMode | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(showAiOverlays);
  const [tripwireEnabled, setTripwireEnabled] = useState<boolean>(showTripwire);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [simulatedFps, setSimulatedFps] = useState<number>(camera.fps || 30);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);

  // Distinguish real RTSP managed camera (CAM-01) from fallback cameras (CAM-02, CAM-03, CAM-04)
  const isRtspManaged = camera.id === 'CAM-01' || (Boolean(activeStreamInfo) && activeStreamInfo?.status !== 'stopped');
  const isStreamingLive = isRtspManaged && activeStreamInfo?.status === 'streaming' && !streamError;
  const isWaitingForCamera = isRtspManaged && (!activeStreamInfo || activeStreamInfo.status !== 'streaming' || streamError);

  const visionMode = localVisionMode ?? initialVisionMode;
  const activeDetections = camera.activeDetections || [];

  // Motion animation offset for mock bounding box movement
  const [motionOffset, setMotionOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Live time ticker & subtle realistic bounding box jitter/patrol movement
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const now = new Date();
      setLiveTimestamp(
        now.toISOString().replace('T', ' ').substring(0, 19) + '.' + String(now.getMilliseconds()).padStart(3, '0')
      );

      // Jitter FPS slightly for realism
      if (camera.status === 'online') {
        setSimulatedFps(camera.fps + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0));
        // Sinusoidal patrol movement
        const offsetX = Math.sin(frame * 0.1) * 3;
        const offsetY = Math.cos(frame * 0.08) * 2;
        setMotionOffset({ x: offsetX, y: offsetY });
      }
    }, 150);

    return () => clearInterval(interval);
  }, [camera.status, camera.fps]);

  const handleCaptureSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 800);
  };

  // Determine background style based on scene & vision mode
  const getSceneBackground = () => {
    if (camera.status === 'offline') {
      return 'bg-[#0b0f19]';
    }

    if (visionMode === 'thermal') {
      return 'bg-gradient-to-br from-[#1a0826] via-[#4d0d3d] to-[#120524]';
    }
    if (visionMode === 'night_vision') {
      return 'bg-gradient-to-b from-[#021f12] via-[#053d24] to-[#01140b]';
    }
    if (visionMode === 'edge_ai') {
      return 'bg-[#050b14]';
    }

    // Optical mode backgrounds tailored by scene
    switch (camera.sceneType) {
      case 'fence':
        return 'bg-gradient-to-b from-[#070e1c] via-[#0f1d38] to-[#0a1224]';
      case 'ravine':
        return 'bg-gradient-to-b from-[#111726] via-[#1a233a] to-[#0d1320]';
      case 'checkpoint':
        return 'bg-gradient-to-b from-[#0a192f] via-[#132d4b] to-[#091526]';
      case 'river':
        return 'bg-gradient-to-b from-[#061826] via-[#0e2c45] to-[#05131f]';
      default:
        return 'bg-gradient-to-b from-[#0a1220] via-[#111e33] to-[#080e1a]';
    }
  };

  return (
    <div
      onClick={() => onSelectCamera && onSelectCamera(camera)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col ${
        isBlinking
          ? 'border-red-500 ring-4 ring-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.9)] animate-pulse z-20'
          : isFocused
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-2xl shadow-cyan-500/20'
          : camera.status === 'offline'
          ? 'border-red-900/40 bg-slate-950/80 opacity-75'
          : 'border-sky-900/40 hover:border-sky-500/60 bg-slate-950 shadow-lg hover:shadow-sky-500/10'
      }`}
    >
      {/* Video Viewport Container */}
      <div className={`relative aspect-video w-full overflow-hidden select-none ${getSceneBackground()}`}>

        {/* Tactical HUD Corner brackets */}
        <div className="hud-corner-tl opacity-70" />
        <div className="hud-corner-tr opacity-70" />
        <div className="hud-corner-bl opacity-70" />
        <div className="hud-corner-br opacity-70" />

        {/* Scanline CRT simulation */}
        <div className="absolute inset-0 cctv-scanline pointer-events-none opacity-30" />

        {/* Tactical Grid / Radar Coordinate Crosses */}
        <div className="absolute inset-0 tactical-grid-bg opacity-25 pointer-events-none" />

        {/* Scene Simulated Graphical Graphics / Real Live Stream / Waiting Placeholder */}
        {camera.status === 'offline' ? (
          /* Offline Static Noise Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse mb-2" />
            <div className="text-sm font-bold text-red-400 tracking-wider">RTSP FEED OFFLINE</div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">NO SIGNAL FROM {camera.ipAddress}:{camera.port}</div>
            <div className="mt-3 px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/60 text-[10px] font-mono">
              ERR_RTSP_CONNECTION_TIMED_OUT
            </div>
          </div>
        ) : isWaitingForCamera ? (
          /* Dedicated "Waiting for Camera" Placeholder (Req 7: No fake animation when RTSP unavailable) */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070b14]/95 p-4 text-center select-none z-10">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-sky-500/30 bg-sky-500/5 flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full border border-sky-400/50 bg-sky-400/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-sky-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="text-xs font-mono font-bold tracking-widest text-sky-300 uppercase">
              WAITING FOR CAMERA SIGNAL
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              AUTO-RECONNECTING TO RTSP SOURCE
            </div>

            <div className="mt-2.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-slate-300 flex items-center gap-2 max-w-[90%] truncate">
              <span className="text-amber-400 font-bold">SOURCE:</span>
              <span className="truncate text-cyan-300">{camera.rtspUrl}</span>
            </div>

            <div className="mt-2.5 flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-sky-300">
                <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                <span>Attempt #{activeStreamInfo?.reconnect_count || 1}</span>
              </span>
              <span>•</span>
              <span className="text-amber-300 font-semibold uppercase">STATUS: RECONNECTING</span>
            </div>
          </div>
        ) : (
          /* Live Stream (Case A: CAM-01) or Fallback Scene (Case B: CAM-02, 03, 04) */
          <div className="absolute inset-0 pointer-events-none">
            {isStreamingLive ? (
              /* Real RTSP Live Feed from FastAPI backend */
              <img
                src={`${ApiService.getConfig().baseUrl}/stream/feed/${camera.id}`}
                alt={`Live RTSP Feed ${camera.id}`}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                onLoad={() => setStreamError(false)}
                onError={() => setStreamError(true)}
              />
            ) : (
              /* Fallback Mode (CAM-02, CAM-03, CAM-04) */
              <>
                {camera.sceneType === 'fence' && (
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 225">
                    {/* Hills in distance */}
                    <path d="M0,130 Q100,90 200,120 T400,110 L400,225 L0,225 Z" fill="#040914" />
                    {/* Border Watch Tower Silhouette */}
                    <rect x="70" y="80" width="8" height="60" fill="#030710" />
                    <polygon points="66,80 82,80 74,65" fill="#030710" />
                    {/* Barbed Wire Posts */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <g key={i}>
                        <line x1={i * 55 + 10} y1={135} x2={i * 55 + 10} y2={195} stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
                        <line x1={0} y1={150} x2={400} y2={150} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.3" />
                        <line x1={0} y1={170} x2={400} y2={170} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.3" />
                      </g>
                    ))}
                  </svg>
                )}

                {camera.sceneType === 'ravine' && (
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 225">
                    {/* Steep Canyon Walls */}
                    <polygon points="0,40 140,160 0,225" fill="#050a14" />
                    <polygon points="400,30 260,170 400,225" fill="#050a14" />
                    {/* Winding Ravine Path */}
                    <path d="M140,160 Q200,180 260,170 L280,225 L120,225 Z" fill="#0a1324" />
                  </svg>
                )}

                {camera.sceneType === 'river' && (
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 225">
                    <path d="M0,100 Q150,130 400,105 L400,225 L0,225 Z" fill="#041220" />
                    {/* Water Waves Reflection */}
                    <path d="M40,150 Q120,145 200,152 T360,150" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" fill="none" />
                    <path d="M20,180 Q140,175 260,182 T390,178" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" fill="none" />
                  </svg>
                )}

                {camera.sceneType === 'checkpoint' && (
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 225">
                    {/* Highway lanes */}
                    <polygon points="120,100 280,100 380,225 20,225" fill="#071324" />
                    {/* Center lane dash */}
                    <line x1="200" y1="100" x2="200" y2="225" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10,8" strokeOpacity="0.6" />
                    {/* Boom Barrier */}
                    <rect x="130" y="140" width="140" height="4" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
                  </svg>
                )}
              </>
            )}

            {/* Virtual Tripwire / Border Demarcation Line */}
            {tripwireEnabled && camera.wireCoordinates && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  <line
                    x1={`${camera.wireCoordinates.x1}%`}
                    y1={`${camera.wireCoordinates.y1}%`}
                    x2={`${camera.wireCoordinates.x2}%`}
                    y2={`${camera.wireCoordinates.y2}%`}
                    stroke={activeDetections.some((d) => d.type === 'line_crossing' || d.threatLevel === 'critical') ? '#ef4444' : '#06b6d4'}
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    className="animate-pulse"
                  />
                  {/* Tripwire Label */}
                  <text
                    x={`${(camera.wireCoordinates.x1 + camera.wireCoordinates.x2) / 2}%`}
                    y={`${(camera.wireCoordinates.y1 + camera.wireCoordinates.y2) / 2 - 3}%`}
                    fill={activeDetections.some((d) => d.type === 'line_crossing' || d.threatLevel === 'critical') ? '#ef4444' : '#06b6d4'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ⚡ VIRTUAL TRIPWIRE LINE [ZONE-A]
                  </text>
                </svg>
              </div>
            )}

            {/* AI Bounding Boxes Overlay */}
            {aiEnabled &&
              activeDetections.map((det) => {
                const isCritical = det.threatLevel === 'critical';
                const isWarning = det.threatLevel === 'warning';
                const boxColor = isCritical
                  ? 'border-red-500 bg-red-500/15 text-red-300'
                  : isWarning
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-cyan-400 bg-cyan-400/10 text-cyan-300';

                // Adjusted position with simulated motion
                const posX = Math.max(2, Math.min(85, det.box.x + motionOffset.x));
                const posY = Math.max(5, Math.min(80, det.box.y + motionOffset.y));

                return (
                  <div
                    key={det.id}
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                      width: `${det.box.width}%`,
                      height: `${det.box.height}%`,
                    }}
                    className={`absolute border-2 ${boxColor} rounded-md transition-all duration-200 pointer-events-none ${
                      isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' : ''
                    }`}
                  >
                    {/* Bounding Box Corner Reticles */}
                    <div className="absolute -top-1.5 -left-1.5 w-2 h-2 border-t-2 border-l-2 border-white" />
                    <div className="absolute -top-1.5 -right-1.5 w-2 h-2 border-t-2 border-r-2 border-white" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-2 h-2 border-b-2 border-l-2 border-white" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-2 h-2 border-b-2 border-r-2 border-white" />

                    {/* AI Tag / Label Header */}
                    <div
                      className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap flex items-center gap-1 shadow ${
                        isCritical ? 'bg-red-600 text-white' : isWarning ? 'bg-amber-600 text-black' : 'bg-cyan-600 text-black'
                      }`}
                    >
                      <Crosshair className="w-2.5 h-2.5" />
                      <span>{det.label.toUpperCase()}</span>
                      <span className="opacity-90">[{formatConfidence(det.confidence)}]</span>
                    </div>

                    {/* Target Metadata Subtag */}
                    <div className="absolute -bottom-4 left-0 text-[8px] font-mono bg-black/80 px-1 py-0.2 rounded text-slate-300 whitespace-nowrap border border-slate-700">
                      TRK#{det.trackId} {det.speed ? `• ${det.speed}` : ''}
                    </div>

                    {/* Center Crosshair Dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80" />
                  </div>
                );
              })}

            {/* Vision Mode Color Filters */}
            {visionMode === 'thermal' && (
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-orange-600/20 to-transparent mix-blend-color-dodge pointer-events-none" />
            )}
            {visionMode === 'night_vision' && (
              <div className="absolute inset-0 bg-emerald-500/20 mix-blend-overlay pointer-events-none" />
            )}
            {visionMode === 'edge_ai' && (
              <div className="absolute inset-0 bg-cyan-900/10 backdrop-contrast-125 pointer-events-none" />
            )}
          </div>
        )}

        {/* Snapshot flash animation */}
        {snapshotTaken && (
          <div className="absolute inset-0 bg-white/90 z-20 transition-opacity duration-300 pointer-events-none" />
        )}

        {/* Top HUD Overlay: Camera ID, REC/LIVE indicator, Time, FPS */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono z-20 pointer-events-none">
          <div className="flex items-center gap-2">
            {/* LIVE / RECONNECTING / STANDBY Badge (Req 6) */}
            {isStreamingLive ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/90 backdrop-blur-sm border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300 text-[10px] tracking-wider">LIVE</span>
              </div>
            ) : isWaitingForCamera ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/90 backdrop-blur-sm border border-amber-500/60">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-amber-300 text-[10px] tracking-wider">CONNECTING</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-sky-400' : 'bg-slate-500'}`} />
                <span className="font-bold text-sky-300 text-[10px]">STANDBY</span>
              </div>
            )}

            {/* Camera Tag */}
            <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700 font-bold text-cyan-400">
              {camera.id}
            </div>

            {/* Sector */}
            <div className="hidden sm:block px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-slate-800 text-slate-300 text-[10px]">
              {camera.sector}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* FPS & Resolution (Req 6) */}
            <div className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700 text-[10px] text-slate-300">
              <span className={`font-bold ${isStreamingLive ? 'text-emerald-400' : isWaitingForCamera ? 'text-amber-400' : 'text-cyan-400'}`}>
                {isStreamingLive
                  ? (activeStreamInfo?.current_fps && activeStreamInfo.current_fps > 0 ? activeStreamInfo.current_fps : activeStreamInfo?.target_fps || camera.fps)
                  : isWaitingForCamera
                  ? 0
                  : simulatedFps}
              </span> FPS • {camera.resolution.split(' ')[0]}
            </div>

            {/* Timestamp */}
            <div className="hidden md:block px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700 text-[10px] text-sky-300">
              {liveTimestamp || 'SYNCING...'}
            </div>
          </div>
        </div>

        {/* Bottom Left HUD: Camera Name & Threat Status */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 pointer-events-none">
          <div className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-slate-800 text-slate-200 text-xs font-semibold">
            {camera.name}
          </div>

          {activeDetections.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{activeDetections.length} THREAT{activeDetections.length > 1 ? 'S' : ''} DETECTED</span>
            </div>
          )}
        </div>

        {/* Bottom Right HUD: Quick Action Vision & AI Toggles */}
        {showControls && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 opacity-90 hover:opacity-100 transition-opacity">
            {/* Vision Mode Switcher */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const modes: VisionMode[] = ['optical', 'thermal', 'night_vision', 'edge_ai'];
                const nextIdx = (modes.indexOf(visionMode) + 1) % modes.length;
                setLocalVisionMode(modes[nextIdx]);
              }}
              title={`Switch Vision Mode (Current: ${visionMode.toUpperCase()})`}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                visionMode !== 'optical' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {visionMode === 'thermal' ? <Flame className="w-3.5 h-3.5 text-orange-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* AI Bounding Box Overlay Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiEnabled(!aiEnabled);
              }}
              title={aiEnabled ? 'Hide AI Bounding Boxes' : 'Show AI Bounding Boxes'}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                aiEnabled ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
            </button>

            {/* Virtual Tripwire Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTripwireEnabled(!tripwireEnabled);
              }}
              title={tripwireEnabled ? 'Hide Virtual Tripwire' : 'Show Virtual Tripwire'}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                tripwireEnabled ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            {/* Snapshot Button */}
            <button
              onClick={handleCaptureSnapshot}
              title="Capture High-Res Evidence Snapshot"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Camera Card Footer: Telemetry bar (Req 6) */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <span className="flex items-center gap-1 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreamingLive
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : isWaitingForCamera
                  ? 'bg-amber-500 animate-pulse'
                  : camera.status === 'online'
                  ? 'bg-emerald-500'
                  : camera.status === 'degraded'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
            <span
              className={`text-[11px] font-mono uppercase ${
                isStreamingLive
                  ? 'text-emerald-400 font-bold'
                  : isWaitingForCamera
                  ? 'text-amber-400 font-bold'
                  : camera.status === 'online'
                  ? 'text-emerald-400'
                  : camera.status === 'degraded'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {isStreamingLive
                ? 'CONNECTED (RTSP LIVE)'
                : isWaitingForCamera
                ? `RECONNECTING (#${activeStreamInfo?.reconnect_count || 1})`
                : camera.status === 'online'
                ? 'ONLINE (FALLBACK)'
                : camera.status}
            </span>
          </span>

          <span className="text-slate-600">|</span>

          {/* Signal Strength */}
          <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
            <Radio className="w-3 h-3 text-sky-400" />
            {isWaitingForCamera ? (activeStreamInfo?.reconnect_count ? Math.max(10, 75 - activeStreamInfo.reconnect_count * 5) : 45) : camera.signalStrength}%
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>
            Bitrate: <strong className={isStreamingLive ? 'text-emerald-300' : 'text-slate-300'}>
              {isStreamingLive && activeStreamInfo?.bitrate
                ? activeStreamInfo.bitrate
                : isWaitingForCamera
                ? '0.0 Mbps'
                : camera.bitrate}
            </strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">HB: {isWaitingForCamera ? 'Syncing...' : camera.lastHeartbeat}</span>
        </div>
      </div>
    </div>
  );
};
