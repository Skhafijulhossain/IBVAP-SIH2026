import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApiService } from '../api/client';
import { 
  Settings, 
  BrainCircuit, 
  Server, 
  Check, 
  RefreshCw, 
  Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { aiConfig, updateAiConfig } = useApp();

  const [formConfig, setFormConfig] = useState(aiConfig);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingBackend, setTestingBackend] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAiConfig(formConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestFastApi = async () => {
    setTestingBackend(true);
    setBackendStatus(null);
    try {
      // Test ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(`${formConfig.backendApiUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      setBackendStatus('Connected to FastAPI live edge backend (200 OK)');
      ApiService.setLiveMode(true, formConfig.backendApiUrl);
    } catch {
      setBackendStatus('FastAPI endpoint unreachable. Operating in Offline-First Mock Mode.');
      ApiService.setLiveMode(false);
    } finally {
      setTestingBackend(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2">
              System Configuration & AI Model Weights
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.4 DEFENSE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              YOLO model weights, inference thresholds, FastAPI endpoints & mesh radio parameters
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Saved Changes!' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Edge AI Model Parameters */}
        <div className="p-5 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Edge AI Vision Model & NPU Acceleration</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Active AI Model Weights</label>
              <select
                value={formConfig.modelName}
                onChange={(e) => setFormConfig({ ...formConfig, modelName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="YOLOv11-BorderSurveillance-v2.4">YOLOv11-BorderSurveillance-v2.4 (High Precision / Defense)</option>
                <option value="YOLOv10x-Custom-Thermal">YOLOv10x-Custom-Thermal (Night & Low-Light Optimized)</option>
                <option value="YOLOv8x-MultiTarget-Tracker">YOLOv8x-MultiTarget-Tracker (Vehicle & Convoy)</option>
                <option value="EdgeTPU-Lite-FP16">EdgeTPU-Lite-FP16 (Ultra Low-Power 120 FPS)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Confidence Threshold:</span>
                  <span className="font-mono text-cyan-300 font-bold">{Math.round(formConfig.confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={formConfig.confidenceThreshold}
                  onChange={(e) => setFormConfig({ ...formConfig, confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>NMS IoU Threshold:</span>
                  <span className="font-mono text-cyan-300 font-bold">{Math.round(formConfig.iouThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.05"
                  value={formConfig.iouThreshold}
                  onChange={(e) => setFormConfig({ ...formConfig, iouThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Input Resolution</label>
                <input
                  type="text"
                  value={formConfig.inputResolution}
                  onChange={(e) => setFormConfig({ ...formConfig, inputResolution: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Inference FPS</label>
                <input
                  type="number"
                  value={formConfig.targetFps}
                  onChange={(e) => setFormConfig({ ...formConfig, targetFps: parseInt(e.target.value) || 30 })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* AI Feature Toggles */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.enableThermalFusion}
                  onChange={(e) => setFormConfig({ ...formConfig, enableThermalFusion: e.target.checked })}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300">Enable Optical-Thermal Sensor Fusion</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.enableTripwire}
                  onChange={(e) => setFormConfig({ ...formConfig, enableTripwire: e.target.checked })}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300">Enable Virtual Fence Tripwire Intrusion Rules</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formConfig.enableWeaponDetection}
                  onChange={(e) => setFormConfig({ ...formConfig, enableWeaponDetection: e.target.checked })}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300">Enable Threat Object & Weapon Silhouette Detection</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. FastAPI Backend & Live WebSocket Integration Architecture */}
        <div className="p-5 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Server className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">FastAPI Backend & WebSocket Integration</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                FastAPI REST API Base URL (GET /cameras, GET /alerts, GET /events)
              </label>
              <input
                type="text"
                value={formConfig.backendApiUrl}
                onChange={(e) => setFormConfig({ ...formConfig, backendApiUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Live Alert WebSocket Gateway (ws://)
              </label>
              <input
                type="text"
                value={formConfig.websocketUrl}
                onChange={(e) => setFormConfig({ ...formConfig, websocketUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
              />
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestFastApi}
                disabled={testingBackend}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBackend ? 'animate-spin' : ''}`} />
                <span>Test FastAPI Connection</span>
              </button>

              {backendStatus && (
                <div className="mt-2 text-[11px] font-mono p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  {backendStatus}
                </div>
              )}
            </div>

            {/* QRF Radio Dispatch Mesh Channel */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold mb-1">
                Encrypted QRF Tactical Radio Mesh Channel
              </label>
              <input
                type="text"
                value={formConfig.qrfDispatchChannel}
                onChange={(e) => setFormConfig({ ...formConfig, qrfDispatchChannel: e.target.value })}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
