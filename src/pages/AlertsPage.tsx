import React, { useState } from 'react';
import type { Alert, AlertSeverity, AlertStatus } from '../types';
import { useApp } from '../context/AppContext';
import { IncidentModal } from '../components/alerts/IncidentModal';
import { 
  Bell, 
  Search, 
  Volume2, 
  VolumeX, 
  Download,
  Zap,
  CheckCheck,
  Radio,
  Eye,
  CheckCircle
} from 'lucide-react';
import { formatConfidence, getSeverityBadgeClass, getSeverityDotClass, getDetectionTypeLabel, exportToCsv } from '../utils/helpers';

export const AlertsPage: React.FC = () => {
  const { 
    alerts, 
    acknowledgeAlert, 
    escalateAlert, 
    soundEnabled, 
    toggleSound,
    triggerManualAlert
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.80);
  const [inspectingAlert, setInspectingAlert] = useState<Alert | null>(null);

  const filteredAlerts = alerts.filter((alert: Alert) => {
    if (alert.confidence < minConfidence) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        alert.id.toLowerCase().includes(q) ||
        alert.cameraName.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.sector.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const criticalCount = alerts.filter((a: Alert) => a.severity === 'critical' && a.status === 'new').length;
  const warningCount = alerts.filter((a: Alert) => a.severity === 'warning' && a.status === 'new').length;
  const infoCount = alerts.filter((a: Alert) => a.severity === 'info').length;

  const handleExportCsv = () => {
    const rows = filteredAlerts.map((a: Alert) => ({
      Alert_ID: a.id,
      Timestamp: a.timestamp,
      Camera_ID: a.cameraId,
      Camera_Name: a.cameraName,
      Sector: a.sector,
      Event_Type: a.eventType,
      Severity: a.severity,
      Confidence: `${Math.round(a.confidence * 100)}%`,
      Status: a.status,
      QRF_Dispatched: a.qrfDispatched ? 'YES' : 'NO',
      Assigned_Unit: a.assignedUnit || 'None',
      Description: a.description,
    }));
    exportToCsv('IBVAP_Triage_Alerts_SIH2026', rows);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Border Surveillance Alert Command & Triage
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                {criticalCount} CRITICAL PENDING
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Correlated AI incident queue with real-time audio telemetry, QRF dispatch & forensics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Jury Demo Trigger */}
          <button
            onClick={() => triggerManualAlert('intrusion')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Simulate Breach</span>
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center ${
              soundEnabled
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: Critical (Red), Warning (Orange), Info (Blue) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by Camera, Sector, or Keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Confidence Filter Slider & Presets */}
        <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400 font-mono text-[11px]">Min Conf:</span>
            <span className="font-mono text-cyan-300 font-bold text-[11px]">{Math.round(minConfidence * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.70"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinConfidence(0.80)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                minConfidence === 0.80 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              0.80
            </button>
            <button
              onClick={() => setMinConfidence(0.90)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                minConfidence === 0.90 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              0.90+
            </button>
          </div>
        </div>

        {/* Severity & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'new' ? 'bg-red-600/80 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Pending
            </button>
            <button
              onClick={() => setStatusFilter('escalated_to_qrf')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'escalated_to_qrf' ? 'bg-cyan-600/80 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              QRF Dispatched
            </button>
          </div>

          {/* Severity Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === 'all' ? 'bg-sky-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Severities
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'critical' ? 'bg-red-600 text-white shadow' : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Critical ({criticalCount})</span>
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'warning' ? 'bg-amber-600 text-black shadow' : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Warning ({warningCount})</span>
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'info' ? 'bg-blue-600 text-white shadow' : 'text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Info ({infoCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-400">No active alerts matching criteria</div>
            <div className="text-xs text-slate-500 mt-1">All border perimeter sectors reporting nominal telemetry</div>
          </div>
        ) : (
          filteredAlerts.map((alert: Alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isNew = alert.status === 'new';

            const cardBorder = isCritical
              ? 'border-red-500/50 bg-red-950/20 hover:border-red-400'
              : isWarning
              ? 'border-amber-500/40 bg-amber-950/15 hover:border-amber-400'
              : 'border-blue-500/30 bg-blue-950/10 hover:border-blue-400';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl ${cardBorder} flex flex-col justify-between ${
                  isCritical && isNew ? 'animate-pulse' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Alert ID, Severity, Confidence, Time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getSeverityDotClass(alert.severity)}`} />
                      <span className="font-mono text-xs font-bold text-white">
                        {alert.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${getSeverityBadgeClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {formatConfidence(alert.confidence)} AI Match
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      {alert.timestamp}
                    </span>
                  </div>

                  {/* Title & Camera Node */}
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{getDetectionTypeLabel(alert.eventType)}</span>
                    <span className="text-xs text-cyan-400 font-mono font-semibold">
                      • {alert.cameraName} ({alert.cameraId})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* GPS & Sector Meta */}
                  <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-3">
                    <span>Sector: <strong className="text-slate-200">{alert.sector}</strong></span>
                    <span>•</span>
                    <span>GPS: {alert.coordinates.lat.toFixed(4)}°N, {alert.coordinates.lng.toFixed(4)}°E</span>
                  </div>

                  {/* QRF / Unit Dispatch Status */}
                  {alert.qrfDispatched && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 p-2 rounded-xl border border-cyan-500/40">
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                      <span>{alert.assignedUnit || 'QRF Rapid Unit En-Route'}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    Status: <strong className="text-slate-200 capitalize">{alert.status.replace('_', ' ')}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {isNew && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {!alert.qrfDispatched && isCritical && (
                      <button
                        onClick={() => escalateAlert(alert.id, 'QRF Tactical Response Team 1')}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>Dispatch QRF</span>
                      </button>
                    )}

                    <button
                      onClick={() => setInspectingAlert(alert)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600/80 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Evidence Investigation Dossier Modal */}
      {inspectingAlert && (
        <IncidentModal
          alert={inspectingAlert}
          onClose={() => setInspectingAlert(null)}
        />
      )}
    </div>
  );
};
