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
    <div className="space-y-4 pb-12 transition-colors">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30">
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-[var(--text)] tracking-tight flex items-center gap-2">
              Border Surveillance Alert Command & Triage
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30">
                {criticalCount} CRITICAL PENDING
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Correlated AI incident queue with real-time audio telemetry, QRF dispatch & forensics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Jury Demo Trigger */}
          <button
            onClick={() => triggerManualAlert('intrusion')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>Simulate Breach</span>
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center ${
              soundEnabled
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by Camera, Sector, or Keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Confidence Filter Slider & Quick Presets */}
        <div className="flex items-center gap-2 bg-[var(--card)] px-3 py-1 rounded-xl border border-[var(--border)] text-xs">
          <div className="flex items-center gap-1 text-[var(--muted)]">
            <span className="font-mono text-[11px]">Min Conf:</span>
            <span className="font-mono text-sky-600 dark:text-cyan-300 font-bold text-[11px]">{Math.round(minConfidence * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.70"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-16 accent-sky-500 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinConfidence(0.80)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                minConfidence === 0.80 ? 'bg-sky-500/20 text-sky-600 dark:text-cyan-300 font-bold border border-sky-500/40' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              0.80
            </button>
            <button
              onClick={() => setMinConfidence(0.90)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                minConfidence === 0.90 ? 'bg-sky-500/20 text-sky-600 dark:text-cyan-300 font-bold border border-sky-500/40' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              0.90+
            </button>
          </div>
        </div>

        {/* Severity & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-sky-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'new' ? 'bg-red-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              New Pending
            </button>
            <button
              onClick={() => setStatusFilter('escalated_to_qrf')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'escalated_to_qrf' ? 'bg-indigo-600 text-white font-semibold' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              QRF Dispatched
            </button>
          </div>

          {/* Severity Selector Tabs */}
          <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === 'all' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'critical' ? 'bg-red-600 text-white shadow-sm' : 'text-red-500 hover:bg-red-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Critical ({criticalCount})</span>
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'warning' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Warning ({warningCount})</span>
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                severityFilter === 'info' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-500 hover:bg-blue-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Info ({infoCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Grid Cards (Simplified, Reduced Glow, Cleaner Spacing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]">
            <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <div className="text-sm font-semibold text-[var(--text-secondary)]">No active alerts matching criteria</div>
            <div className="text-xs text-[var(--muted)] mt-1">All border perimeter sectors reporting nominal telemetry</div>
          </div>
        ) : (
          filteredAlerts.map((alert: Alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isNew = alert.status === 'new';

            const cardBorder = isCritical
              ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/70'
              : isWarning
              ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70'
              : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all duration-150 shadow-sm ${cardBorder} flex flex-col justify-between ${
                  isCritical && isNew ? 'animate-pulse' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Alert ID, Severity, Confidence, Time */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getSeverityDotClass(alert.severity)}`} />
                      <span className="font-mono text-xs font-bold text-[var(--text)]">
                        {alert.id}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${getSeverityBadgeClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-semibold text-sky-600 dark:text-cyan-300">
                        {formatConfidence(alert.confidence)} AI Match
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[var(--muted)]">
                      {alert.timestamp}
                    </span>
                  </div>

                  {/* Camera & Event Category */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--text)]">
                      {getDetectionTypeLabel(alert.eventType)}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      • {alert.cameraName} ({alert.cameraId})
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)]">
                      {alert.sector}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {alert.description}
                  </p>

                  {/* QRF / Unit Dispatch Status */}
                  {alert.qrfDispatched && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-sky-600 dark:text-cyan-300 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                      <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                      <span>Assigned Unit: <strong>{alert.assignedUnit || 'QRF Rapid Unit'}</strong></span>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Smaller Buttons, Improved Spacing */}
                <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-[var(--muted)]">
                    Status: <strong className="text-[var(--text)] capitalize">{alert.status.replace('_', ' ')}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isNew && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] text-xs font-semibold transition-colors flex items-center gap-1 border border-[var(--border)] shadow-sm"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ack</span>
                      </button>
                    )}

                    {!alert.qrfDispatched && isCritical && (
                      <button
                        onClick={() => escalateAlert(alert.id, 'QRF Alpha Fast Team')}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                      >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>Dispatch QRF</span>
                      </button>
                    )}

                    <button
                      onClick={() => setInspectingAlert(alert)}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Incident Evidence Modal */}
      {inspectingAlert && (
        <IncidentModal
          alert={inspectingAlert}
          onClose={() => setInspectingAlert(null)}
        />
      )}
    </div>
  );
};
