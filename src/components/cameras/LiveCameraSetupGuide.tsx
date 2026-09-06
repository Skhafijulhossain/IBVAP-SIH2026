import React, { useState } from 'react';
import { 
  Radio, 
  Play, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Monitor, 
  Layers, 
  Info, 
  Sliders 
} from 'lucide-react';
import { camerasApi } from '../../api/camerasApi';
import { useApp } from '../../context/AppContext';

export const LiveCameraSetupGuide: React.FC = () => {
  const { streamStatus } = useApp();
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    resolution?: string;
    codec?: string;
    message: string;
    fps?: number;
    bitrate?: string;
    status?: string;
    hints?: string[];
  } | null>(null);

  const rtspTargetUrl = 'rtsp://127.0.0.1:8554/cam1';

  // Check if CAM-01 is currently streaming via AppContext real-time polling
  const cam01Stream = streamStatus?.streams?.['CAM-01'];
  const isContextStreaming = cam01Stream?.status === 'streaming';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(rtspTargetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await camerasApi.testRtspStream(rtspTargetUrl);
      
      if (isContextStreaming && res.success) {
        res.fps = cam01Stream.current_fps || res.fps || 20;
        res.bitrate = cam01Stream.bitrate || res.bitrate || '4.5 Mbps';
      }
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'WAITING FOR CAMERA: RTSP endpoint is not publishing video.',
        status: 'offline',
        fps: 0,
        bitrate: '0.0 Mbps',
        hints: [
          'Start MediaMTX by executing ./mediamtx or mediamtx.exe in a terminal.',
          'In OBS Studio, click "Start Streaming" to begin pushing video to rtsp://127.0.0.1:8554/cam1.',
          'Verify your Webcam or Media Source is enabled and visible in the OBS preview window.',
          'Check that local port 8554 is open and unblocked by firewall.'
        ]
      });
    } finally {
      setTesting(false);
    }
  };

  const isLive = testResult ? testResult.success : isContextStreaming;
  const currentFps = testResult?.fps ?? (isContextStreaming ? (cam01Stream?.current_fps || 20) : 0);
  const currentBitrate = testResult?.bitrate ?? (isContextStreaming ? (cam01Stream?.bitrate || '4.2 Mbps') : '0.0 Mbps');

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 shadow-sm relative overflow-hidden transition-colors">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-[var(--text)] tracking-wide">
                Live Camera Setup Guide (CAM-01 • OBS + MediaMTX)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-500/25 font-semibold">
                RTSP Gateway
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Follow the 4 steps below to stream your physical webcam or video source directly into CAM-01 with edge AI analytics.
            </p>
          </div>
        </div>

        {/* Action Button: Test Camera Connection */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {testing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Test Camera Connection</span>
          </button>
        </div>
      </div>

      {/* 4-Step Setup Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {/* Step 1 */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col justify-between hover:border-sky-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                STEP 01
              </span>
              <Sliders className="w-4 h-4 text-sky-500" />
            </div>
            <h3 className="text-xs font-bold text-[var(--text)] mb-1">Start MediaMTX</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Launch the local RTSP streaming server on port <code className="text-sky-600 dark:text-sky-300 font-mono">8554</code>.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--muted)]">
            Command: <span className="text-[var(--text)]">./mediamtx</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col justify-between hover:border-sky-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                STEP 02
              </span>
              <Monitor className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="text-xs font-bold text-[var(--text)] mb-1">Open OBS Studio</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Open OBS Studio on your machine to manage your live video broadcast capture.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--muted)]">
            App: <span className="text-[var(--text)]">OBS Studio v29+</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col justify-between hover:border-sky-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                STEP 03
              </span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-xs font-bold text-[var(--text)] mb-1">Add Webcam / Source</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Under <strong>Sources</strong>, add <em>Video Capture Device</em> (webcam) or <em>Media Source</em> (video).
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--muted)]">
            Source: <span className="text-[var(--text)]">Webcam / MP4</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col justify-between hover:border-sky-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25">
                STEP 04
              </span>
              <Play className="w-4 h-4 text-sky-500" />
            </div>
            <h3 className="text-xs font-bold text-[var(--text)] mb-1">Stream to RTSP Endpoint</h3>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-2">
              Settings &rarr; Stream &rarr; Service: Custom, Server:
            </p>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] font-mono text-[10px] text-sky-600 dark:text-cyan-300">
              <span className="truncate select-all">{rtspTargetUrl}</span>
              <button
                type="button"
                onClick={handleCopyUrl}
                title="Copy RTSP URL"
                className="p-1 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--text)] shrink-0"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--muted)]">
            Action: <span className="text-sky-600 dark:text-cyan-300">Click &quot;Start Streaming&quot;</span>
          </div>
        </div>
      </div>

      {/* Real-Time Live Status Panel */}
      {(testResult !== null || isContextStreaming) && (
        <div
          className={`mt-4 p-4 rounded-xl border transition-all ${
            isLive
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
              : 'bg-amber-500/10 border-amber-500/40 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Indicator Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black font-mono tracking-wider px-2 py-0.5 rounded ${
                      isLive
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isLive ? 'CONNECTED' : 'WAITING FOR CAMERA'}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--muted)]">
                    CAM-01 • {rtspTargetUrl}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {testResult?.message ||
                    (isLive
                      ? 'Live RTSP stream is publishing frames cleanly to CAM-01 edge analytics.'
                      : 'Waiting for MediaMTX/OBS broadcast stream signal...')}
                </p>
              </div>
            </div>

            {/* Live Metrics: FPS & Bitrate */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-right">
                <div className="text-[10px] font-mono text-[var(--muted)]">FRAME RATE</div>
                <div
                  className={`text-xs font-bold font-mono ${
                    isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {currentFps} FPS
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-right">
                <div className="text-[10px] font-mono text-[var(--muted)]">BITRATE</div>
                <div
                  className={`text-xs font-bold font-mono ${
                    isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {currentBitrate}
                </div>
              </div>
              {testResult?.latencyMs ? (
                <div className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-right">
                  <div className="text-[10px] font-mono text-[var(--muted)]">LATENCY</div>
                  <div className="text-xs font-bold font-mono text-sky-600 dark:text-cyan-300">
                    {testResult.latencyMs}ms
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Troubleshooting Hints */}
          {!isLive && testResult?.hints && testResult.hints.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-300 mb-2">
                <Info className="w-3.5 h-3.5" />
                <span>Troubleshooting Hints:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] pl-5 list-disc font-sans">
                {testResult.hints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
