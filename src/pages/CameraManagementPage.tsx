import React, { useState } from 'react';
import type { Camera, CameraStatus } from '../types';
import { useApp } from '../context/AppContext';
import { camerasApi } from '../api/camerasApi';
import { LiveCameraSetupGuide } from '../components/cameras/LiveCameraSetupGuide';
import { 
  Camera as CameraIcon, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Check, 
  AlertCircle, 
  Radio, 
  X, 
  Zap
} from 'lucide-react';

export const CameraManagementPage: React.FC = () => {
  const { cameras, refreshCameras } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | CameraStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [testingRtsp, setTestingRtsp] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  // New Camera Form state
  const [newCam, setNewCam] = useState({
    name: '',
    sector: 'Sector-1 (North Perimeter)',
    rtspUrl: 'rtsp://admin:password@10.240.12.110:554/stream1',
    ipAddress: '10.240.12.110',
    port: 554,
    resolution: '4K UltraHD (3840x2160)',
    fps: 30,
    bitrate: '5.0 Mbps',
    sceneType: 'fence' as Camera['sceneType'],
    ptzCapable: true,
    thermalCapable: false,
    onvifProfile: 'Profile S / T',
    fovAngle: 75,
    location: { lat: 34.085, lng: 74.802, elevation: '1,820m', heading: 0 },
  });

  const filteredCameras = cameras.filter((c: Camera) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.ipAddress.includes(searchQuery) &&
      !c.sector.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleTestStream = async () => {
    setTestingRtsp(true);
    setTestResult(null);
    const res = await camerasApi.testRtspStream(newCam.rtspUrl);
    setTestResult(res);
    setTestingRtsp(false);
  };

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    await camerasApi.addCamera({
      ...newCam,
      status: 'online',
      signalStrength: 95,
      lastHeartbeat: 'Just now',
    });
    await refreshCameras();
    setIsAddModalOpen(false);
    setTestResult(null);
  };

  const handleDeleteCamera = async (id: string) => {
    if (window.confirm(`Are you sure you want to decommission camera ${id}?`)) {
      await camerasApi.deleteCamera(id);
      await refreshCameras();
    }
  };

  const handleReboot = async (id: string) => {
    await camerasApi.rebootCamera(id);
    await refreshCameras();
  };

  return (
    <div className="space-y-4 pb-12 transition-colors">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <CameraIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-[var(--text)] tracking-tight flex items-center gap-2">
              Border CCTV Node Registry & Stream Management
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                {cameras.length} NODES
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Configure existing CCTV RTSP streams, ONVIF profiles, IP endpoints and AI edge detection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Camera</span>
          </button>
          <button
            onClick={() => refreshCameras()}
            className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] border border-[var(--border)] text-xs transition-colors shadow-sm"
            title="Refresh Camera Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live RTSP Camera Setup Guide Banner */}
      <LiveCameraSetupGuide />

      {/* Filter and Search Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Name, IP, Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)] self-stretch sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-sky-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            All ({cameras.length})
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'online' ? 'bg-emerald-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Online ({cameras.filter((c: Camera) => c.status === 'online').length})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'offline' ? 'bg-red-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Offline ({cameras.filter((c: Camera) => c.status === 'offline').length})
          </button>
        </div>
      </div>

      {/* Cameras Table with Sticky Header & Soft Hover */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm max-h-[600px] relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[var(--table-header)] border-b border-[var(--border)] backdrop-blur-md">
            <tr className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              <th className="py-3 px-4">Node ID</th>
              <th className="py-3 px-4">Camera Name & Sector</th>
              <th className="py-3 px-4">IP / RTSP URI</th>
              <th className="py-3 px-4">Resolution & FPS</th>
              <th className="py-3 px-4">Signal & Bitrate</th>
              <th className="py-3 px-4">Capabilities</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
            {filteredCameras.map((cam: Camera) => {
              const isOnline = cam.status === 'online';
              const isOffline = cam.status === 'offline';

              return (
                <tr key={cam.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                    {cam.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-[var(--text)]">{cam.name}</div>
                    <div className="text-[10px] text-[var(--muted)] font-sans">{cam.sector}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate text-[var(--text-secondary)]">
                    <div className="font-bold text-sky-600 dark:text-cyan-300">{cam.ipAddress}:{cam.port}</div>
                    <div className="text-[10px] text-[var(--muted)] truncate">{cam.rtspUrl}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                    <div>{cam.resolution.split(' ')[0]}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{cam.fps} FPS</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-[var(--text)]">
                      <Radio className="w-3 h-3 text-sky-500" />
                      <span>{cam.signalStrength}%</span>
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">{cam.bitrate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {cam.ptzCapable && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-500/25 text-[9px] font-semibold">
                          PTZ
                        </span>
                      )}
                      {cam.thermalCapable && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/25 text-[9px] font-semibold">
                          THERMAL
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--muted)] border border-[var(--border)] text-[9px]">
                        {cam.onvifProfile.split('/')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isOnline
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isOffline
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {cam.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleReboot(cam.id)}
                        title="Reboot Edge Stream Node"
                        className="p-1.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCamera(cam.id)}
                        title="Decommission Camera"
                        className="p-1.5 rounded-lg bg-[var(--surface-raised)] hover:bg-red-500/15 text-[var(--muted)] hover:text-red-500 border border-[var(--border)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add RTSP Camera Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <div className="flex items-center gap-2">
                <CameraIcon className="w-5 h-5 text-sky-500" />
                <h3 className="text-sm font-bold text-[var(--text)]">Onboard New IP CCTV Stream (RTSP/ONVIF)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCamera} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Camera Display Name</label>
                  <input
                    type="text"
                    required
                    value={newCam.name}
                    onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                    placeholder="e.g. North Post Watchtower 09"
                    className="w-full p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Border Sector</label>
                  <select
                    value={newCam.sector}
                    onChange={(e) => setNewCam({ ...newCam, sector: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-sky-500"
                  >
                    <option value="Sector-1 (North Perimeter)">Sector-1 (North Perimeter)</option>
                    <option value="Sector-2 (West Gorge)">Sector-2 (West Gorge)</option>
                    <option value="Sector-3 (Transit Outpost)">Sector-3 (Transit Outpost)</option>
                    <option value="Sector-4 (Riverine Boundary)">Sector-4 (Riverine Boundary)</option>
                    <option value="Sector-5 (Alpine Forest)">Sector-5 (Alpine Forest)</option>
                    <option value="Sector-6 (High Altitude Ridgeline)">Sector-6 (High Altitude Ridgeline)</option>
                    <option value="Sector-7 (Eastern Dunes)">Sector-7 (Eastern Dunes)</option>
                    <option value="Sector-8 (Command Perimeter)">Sector-8 (Command Perimeter)</option>
                  </select>
                </div>
              </div>

              {/* RTSP Stream URI & Test Handshake Button */}
              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">
                  RTSP Stream URI (H.264/H.265 RTSP or HTTP ONVIF)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCam.rtspUrl}
                    onChange={(e) => setNewCam({ ...newCam, rtspUrl: e.target.value })}
                    placeholder="rtsp://user:pass@192.168.1.100:554/stream1"
                    className="flex-1 p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestStream}
                    disabled={testingRtsp}
                    className="px-3 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-sky-600 dark:text-cyan-300 border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {testingRtsp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Test Ping</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      testResult.success
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.success && (
                      <span className="font-mono text-[10px]">{testResult.latencyMs}ms latency</span>
                    )}
                  </div>
                )}
              </div>

              {/* IP, Port, Scene */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">IP Address</label>
                  <input
                    type="text"
                    value={newCam.ipAddress}
                    onChange={(e) => setNewCam({ ...newCam, ipAddress: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">RTSP Port</label>
                  <input
                    type="number"
                    value={newCam.port}
                    onChange={(e) => setNewCam({ ...newCam, port: parseInt(e.target.value) || 554 })}
                    className="w-full p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Terrain Scene Type</label>
                  <select
                    value={newCam.sceneType}
                    onChange={(e) => setNewCam({ ...newCam, sceneType: e.target.value as Camera['sceneType'] })}
                    className="w-full p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-xs"
                  >
                    <option value="fence">Fence / Perimeter</option>
                    <option value="ravine">Ravine / Gorge</option>
                    <option value="checkpoint">Checkpoint / Road</option>
                    <option value="river">Riverine Boundary</option>
                    <option value="dense_forest">Dense Forest</option>
                    <option value="desert_outpost">Desert Outpost</option>
                  </select>
                </div>
              </div>

              {/* Feature checkboxes */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={newCam.ptzCapable}
                    onChange={(e) => setNewCam({ ...newCam, ptzCapable: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span>PTZ Turret Equipped</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={newCam.thermalCapable}
                    onChange={(e) => setNewCam({ ...newCam, thermalCapable: e.target.checked })}
                    className="accent-sky-500"
                  />
                  <span>Thermal Infrared Sensor</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] text-xs font-semibold border border-[var(--border)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
