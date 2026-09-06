import React, { useState, useEffect } from 'react';
import { Camera, VisionMode, RawDetectionItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../api/client';
import { useEdgeCameraDetector } from '../../hooks/useEdgeCameraDetector';
import {
  Eye,
  Flame,
  Scan,
  Camera as CameraIcon,
  Radio,
  ShieldAlert,
  Crosshair,
  Zap,
  RefreshCw,
  Video,
  AlertTriangle,
} from 'lucide-react';
import { TacticalSkeleton } from '../common/TacticalSkeleton';
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
  const {
    blinkingCameraId,
    streamStatus,
    dispatchConfirmedAlert,
    aiConfig,
    activeWebcamCameraId,
    setActiveWebcamCameraId,
  } = useApp();
  const isBlinking = blinkingCameraId === camera.id;
  const activeStreamInfo = streamStatus ? streamStatus[camera.id] : null;

  const [localVisionMode, setLocalVisionMode] = useState<VisionMode | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(showAiOverlays);
  const [tripwireEnabled, setTripwireEnabled] = useState<boolean>(showTripwire);
  const [simulatedFps, setSimulatedFps] = useState<number>(camera.fps || 30);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);

  // Exclusivity: Only active if this camera is the globally chosen webcam source
  const isWebcamActive = activeWebcamCameraId === camera.id;

  // Distinguish real RTSP managed camera (CAM-01) from fallback cameras
  const isRtspManaged = camera.id === 'CAM-01' || (Boolean(activeStreamInfo) && activeStreamInfo?.status !== 'stopped');
  const isStreamingLive = isRtspManaged && activeStreamInfo?.status === 'streaming' && !streamError;
  const isWaitingForCamera =
    !isWebcamActive && isRtspManaged && (!activeStreamInfo || activeStreamInfo.status !== 'streaming' || streamError);

  const visionMode = localVisionMode ?? initialVisionMode;
  const activeDetections = camera.activeDetections || [];

  // Edge AI Camera Detector Hook (Client-side WebCam + 8-12 FPS Detection Loop)
  const {
    videoRef,
    isStreaming: isWebcamStreaming,
    isLoading: isWebcamLoading,
    permissionDenied,
    errorMessage: webcamError,
    detectionFps,
    activeDetections: edgeDetections,
    isTripwireTripped: edgeTripwireTripped,
    startCamera: startWebcam,
  } = useEdgeCameraDetector({
    cameraId: camera.id,
    cameraName: camera.name,
    sector: camera.sector,
    enabled: isWebcamActive,
    confidenceThreshold: aiConfig?.confidenceThreshold || 0.8,
    wireCoordinates: camera.wireCoordinates,
    onAlertConfirmed: dispatchConfirmedAlert,
  });

  // Effective detections: use live edge detections if webcam is active, else filtered mock detections
  const effectiveDetections = isWebcamStreaming
    ? edgeDetections
    : activeDetections.filter((d) => d.confidence >= (aiConfig?.confidenceThreshold || 0.8));

  const isTripwireActive = isWebcamStreaming
    ? edgeTripwireTripped
    : effectiveDetections.some((d) => d.type === 'line_crossing' || d.threatLevel === 'critical');

  // Motion animation offset for mock bounding box movement
  const [motionOffset, setMotionOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isWebcamActive && isWebcamStreaming) return;

      frame++;
      // Jitter FPS slightly for realism in simulated mode
      if (camera.status === 'online') {
        setSimulatedFps(camera.fps + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0));
        const offsetX = Math.sin(frame * 0.1) * 3;
        const offsetY = Math.cos(frame * 0.08) * 2;
        setMotionOffset({ x: offsetX, y: offsetY });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [camera.status, camera.fps, isWebcamActive, isWebcamStreaming]);

  const handleCaptureSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 600);
  };

  // Determine background style based on scene & vision mode
  const getSceneBackground = () => {
    if (camera.status === 'offline' && !isWebcamStreaming) {
      return 'bg-slate-950';
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

  // Status Badge Values (Essential Badge 1: Online Status)
  let statusLabel = 'STANDBY';
  let statusDotClass = 'bg-sky-400';
  let statusBadgeClass = 'bg-black/70 border-slate-700 text-slate-300';

  const isBackendWebcam = activeStreamInfo?.source_type === 'webcam' || Boolean(activeStreamInfo?.is_webcam);

  if (isWebcamStreaming || (isStreamingLive && isBackendWebcam)) {
    statusLabel = 'LIVE CAMERA';
    statusDotClass = 'bg-emerald-400 animate-pulse';
    statusBadgeClass = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
  } else if (isStreamingLive) {
    statusLabel = 'RTSP LIVE';
    statusDotClass = 'bg-emerald-400 animate-pulse';
    statusBadgeClass = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
  } else if (isWaitingForCamera) {
    statusLabel = 'CONNECTING';
    statusDotClass = 'bg-amber-400 animate-pulse';
    statusBadgeClass = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
  } else if (camera.status === 'offline') {
    statusLabel = 'OFFLINE';
    statusDotClass = 'bg-red-400';
    statusBadgeClass = 'bg-red-950/80 border-red-500/50 text-red-300';
  } else {
    statusLabel = 'SIMULATED';
    statusDotClass = 'bg-sky-400';
    statusBadgeClass = 'bg-black/70 border-slate-700 text-slate-200';
  }

  // FPS Value (Essential Badge 2: FPS)
  const fpsDisplay = isWebcamStreaming
    ? `${detectionFps || 10} FPS`
    : isStreamingLive
    ? `${activeStreamInfo?.current_fps || camera.fps} FPS`
    : isWaitingForCamera
    ? '0 FPS'
    : `${simulatedFps} FPS`;

  // Threat Level (Essential Badge 3: Threat Level)
  const backendDetections = (activeStreamInfo?.last_detections || []) as RawDetectionItem[];
  const hasBackendCritical = backendDetections.some((d: RawDetectionItem) => d.class === 'person' || d.class === 'intrusion');
  const hasBackendWarning = backendDetections.some((d: RawDetectionItem) => d.class === 'vehicle' || d.class === 'animal');

  const hasCritical = isStreamingLive ? hasBackendCritical : effectiveDetections.some((d) => d.threatLevel === 'critical');
  const hasWarning = isStreamingLive ? hasBackendWarning : effectiveDetections.some((d) => d.threatLevel === 'warning');

  let threatLabel = 'THREAT: NOMINAL';
  let threatBadgeClass = 'bg-black/70 border-slate-700 text-emerald-400';

  if (hasCritical) {
    threatLabel = 'THREAT: CRITICAL';
    threatBadgeClass = 'bg-red-950/80 border-red-500/70 text-red-300';
  } else if (hasWarning) {
    threatLabel = 'THREAT: WARNING';
    threatBadgeClass = 'bg-amber-950/80 border-amber-500/70 text-amber-300';
  }

  return (
    <div
      onClick={() => onSelectCamera && onSelectCamera(camera)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 flex flex-col bg-[var(--card)] select-none shadow-sm hover:shadow-md ${
        isBlinking
          ? 'border-red-500 ring-2 ring-red-500/60 shadow-red-500/20 z-20'
          : isFocused
          ? 'border-sky-500 ring-1 ring-sky-500/40'
          : camera.status === 'offline' && !isWebcamStreaming
          ? 'border-red-900/30 opacity-80'
          : 'border-[var(--border)] hover:border-sky-500/40'
      }`}
    >
      {/* Video Viewport Container */}
      <div className={`relative aspect-video w-full overflow-hidden ${getSceneBackground()}`}>
        {/* Subtle HUD Corner reticles */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Soft Scanline CRT simulation */}
        <div className="absolute inset-0 cctv-scanline pointer-events-none opacity-20" />

        {/* Subtle Tactical Grid */}
        <div className="absolute inset-0 tactical-grid-bg opacity-15 pointer-events-none" />

        {/* Camera Feed States */}
        {isWebcamActive && permissionDenied ? (
          /* Permission Denied Notice */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center z-20">
            <AlertTriangle className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
            <div className="text-xs font-mono font-bold text-amber-300 uppercase">CAMERA ACCESS RESTRICTED</div>
            <div className="text-[11px] font-mono text-slate-400 mt-1 max-w-[85%]">{webcamError}</div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startWebcam();
                }}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono transition-colors shadow-sm"
              >
                Retry Camera
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveWebcamCameraId(null);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                Return to Scene
              </button>
            </div>
          </div>
        ) : isWebcamActive && isWebcamLoading ? (
          /* Connecting to Hardware WebCam with tactical radar skeleton */
          <TacticalSkeleton type="feed" label={`CALIBRATING ${camera.id} EDGE SENSOR...`} />
        ) : isWebcamActive && isWebcamStreaming ? (
          /* Live Physical WebCam Video Element */
          <div className="absolute inset-0 pointer-events-none">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        ) : camera.status === 'offline' ? (
          /* Offline Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
            <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse mb-2" />
            <div className="text-xs font-bold text-red-400 tracking-wider">RTSP FEED OFFLINE</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              NO SIGNAL FROM {camera.ipAddress}:{camera.port}
            </div>
          </div>
        ) : isWaitingForCamera ? (
          /* Waiting for Camera Placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center select-none z-10">
            <div className="relative mb-2.5 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-sky-500/30 bg-sky-500/5 flex items-center justify-center">
                <Radio className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            <div className="text-xs font-mono font-bold tracking-wider text-sky-300 uppercase">
              WAITING FOR CAMERA SIGNAL
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">AUTO-RECONNECTING TO RTSP SOURCE</div>

            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
              <span>Attempt #{activeStreamInfo?.reconnect_count || 1}</span>
            </div>
          </div>
        ) : (
          /* Live Stream (RTSP) or Fallback Scene */
          <div className="absolute inset-0 pointer-events-none">
            {isStreamingLive ? (
              <img
                src={`${ApiService.getConfig().baseUrl}/stream/feed/${camera.id}`}
                alt={`Live RTSP Feed ${camera.id}`}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                onLoad={() => setStreamError(false)}
                onError={() => setStreamError(true)}
              />
            ) : (
              <>
                {camera.sceneType === 'fence' && (
                  <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 225">
                    <path d="M0,130 Q100,90 200,120 T400,110 L400,225 L0,225 Z" fill="#040914" />
                    <rect x="70" y="80" width="8" height="60" fill="#030710" />
                    <polygon points="66,80 82,80 74,65" fill="#030710" />
                    {Array.from({ length: 8 }).map((_, i) => (
                      <g key={i}>
                        <line x1={i * 55 + 10} y1={135} x2={i * 55 + 10} y2={195} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.3" />
                        <line x1={0} y1={150} x2={400} y2={150} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.25" />
                        <line x1={0} y1={170} x2={400} y2={170} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.25" />
                      </g>
                    ))}
                  </svg>
                )}

                {camera.sceneType === 'ravine' && (
                  <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 225">
                    <polygon points="0,40 140,160 0,225" fill="#050a14" />
                    <polygon points="400,30 260,170 400,225" fill="#050a14" />
                    <path d="M140,160 Q200,180 260,170 L280,225 L120,225 Z" fill="#0a1324" />
                  </svg>
                )}

                {camera.sceneType === 'river' && (
                  <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 225">
                    <path d="M0,100 Q150,130 400,105 L400,225 L0,225 Z" fill="#041220" />
                    <path d="M40,150 Q120,145 200,152 T360,150" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.25" fill="none" />
                    <path d="M20,180 Q140,175 260,182 T390,178" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.25" fill="none" />
                  </svg>
                )}

                {camera.sceneType === 'checkpoint' && (
                  <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 225">
                    <polygon points="120,100 280,100 380,225 20,225" fill="#071324" />
                    <line x1="200" y1="100" x2="200" y2="225" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,6" strokeOpacity="0.5" />
                    <rect x="130" y="140" width="140" height="4" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
                  </svg>
                )}
              </>
            )}
          </div>
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
                stroke={isTripwireActive ? '#ef4444' : '#06b6d4'}
                strokeWidth={isTripwireActive ? '2.5' : '2'}
                strokeDasharray="5,3"
                className={isTripwireActive ? 'animate-pulse' : ''}
              />
              <text
                x={`${(camera.wireCoordinates.x1 + camera.wireCoordinates.x2) / 2}%`}
                y={`${(camera.wireCoordinates.y1 + camera.wireCoordinates.y2) / 2 - 3}%`}
                fill={isTripwireActive ? '#ef4444' : '#06b6d4'}
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                TRIPWIRE
              </text>
            </svg>
          </div>
        )}

        {/* AI Bounding Boxes Overlay (Refined & Softened) */}
        {aiEnabled &&
          !isStreamingLive &&
          effectiveDetections.map((det) => {
            const isCritical = det.threatLevel === 'critical';
            const isWarning = det.threatLevel === 'warning';
            const boxColor = isCritical
              ? 'border-red-500 bg-red-500/10 text-red-300'
              : isWarning
              ? 'border-amber-500 bg-amber-500/10 text-amber-300'
              : 'border-cyan-400 bg-cyan-400/10 text-cyan-300';

            const posX = isWebcamStreaming ? det.box.x : Math.max(2, Math.min(85, det.box.x + motionOffset.x));
            const posY = isWebcamStreaming ? det.box.y : Math.max(5, Math.min(80, det.box.y + motionOffset.y));

            return (
              <div
                key={det.id}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  width: `${det.box.width}%`,
                  height: `${det.box.height}%`,
                }}
                className={`absolute border-2 ${boxColor} rounded-md transition-all duration-150 pointer-events-none ${
                  isCritical ? 'shadow-sm animate-pulse' : ''
                }`}
              >
                {/* AI Tag / Label Header */}
                <div
                  className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold whitespace-nowrap flex items-center gap-1 shadow-sm ${
                    isCritical ? 'bg-red-600 text-white' : isWarning ? 'bg-amber-600 text-black' : 'bg-cyan-600 text-black'
                  }`}
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span>{det.label.toUpperCase()}</span>
                  <span className="opacity-90">[{formatConfidence(det.confidence)}]</span>
                </div>
              </div>
            );
          })}

        {/* Vision Mode Color Filters */}
        {visionMode === 'thermal' && (
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/35 via-orange-600/15 to-transparent mix-blend-color-dodge pointer-events-none" />
        )}
        {visionMode === 'night_vision' && (
          <div className="absolute inset-0 bg-emerald-500/15 mix-blend-overlay pointer-events-none" />
        )}
        {visionMode === 'edge_ai' && (
          <div className="absolute inset-0 bg-cyan-900/10 backdrop-contrast-125 pointer-events-none" />
        )}

        {/* Snapshot flash animation */}
        {snapshotTaken && (
          <div className="absolute inset-0 bg-white/80 z-20 transition-opacity duration-300 pointer-events-none" />
        )}

        {/* ESSENTIAL HUD BADGES ONLY: Camera ID, Online Status, FPS, Threat Level */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono z-20 pointer-events-none">
          {/* Left Badges: Camera ID & Online Status */}
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-slate-700/80 font-bold text-sky-400 text-[10px]">
              {camera.id}
            </span>
            <span className={`px-2 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-semibold flex items-center gap-1.5 ${statusBadgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
              <span>{statusLabel}</span>
            </span>
          </div>

          {/* Right Badges: FPS & Threat Level */}
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-slate-700/80 text-[10px] font-mono text-slate-300">
              {fpsDisplay}
            </span>
            <span className={`px-2 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-bold ${threatBadgeClass}`}>
              {threatLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Camera Card Footer: Clean name and action controls */}
      <div className="px-3.5 py-2.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between text-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-[var(--text)] truncate text-xs">
            {camera.name}
          </span>
          <span className="text-[10px] font-mono text-[var(--muted)] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] shrink-0">
            {camera.sector}
          </span>
        </div>

        {/* Quick Action Controls */}
        {showControls && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Direct Device WebCam Mode Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isWebcamActive) {
                  setActiveWebcamCameraId(null);
                } else {
                  setActiveWebcamCameraId(camera.id);
                }
              }}
              title={isWebcamActive ? 'Switch Back to RTSP/Simulated Scene' : 'Activate Physical WebCam (Edge AI Live)'}
              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                isWebcamActive
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
            </button>

            {/* Vision Mode Switcher */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const modes: VisionMode[] = ['optical', 'thermal', 'night_vision', 'edge_ai'];
                const nextIdx = (modes.indexOf(visionMode) + 1) % modes.length;
                setLocalVisionMode(modes[nextIdx]);
              }}
              title={`Switch Vision Mode (${visionMode.toUpperCase()})`}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                visionMode !== 'optical'
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)]'
              }`}
            >
              {visionMode === 'thermal' ? (
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>

            {/* AI Bounding Box Overlay Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiEnabled(!aiEnabled);
              }}
              title={aiEnabled ? 'Hide AI Overlays' : 'Show AI Overlays'}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                aiEnabled
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)]'
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
                tripwireEnabled
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            {/* Snapshot Button */}
            <button
              onClick={handleCaptureSnapshot}
              title="Capture Snapshot"
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)] transition-colors"
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
