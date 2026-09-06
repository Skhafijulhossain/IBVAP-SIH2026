import React, { useState } from 'react';
import { Alert, AlertSeverity } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  CheckCircle, 
  Radio, 
  Eye, 
  CheckCheck
} from 'lucide-react';
import { formatConfidence, getSeverityBadgeClass, getSeverityDotClass, getDetectionTypeLabel } from '../../utils/helpers';

interface AlertPanelProps {
  onInspectAlert?: (alert: Alert) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ onInspectAlert }) => {
  const { alerts, acknowledgeAlert, escalateAlert, setSelectedAlert } = useApp();
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'new').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && a.status === 'new').length;
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

  const handleInspect = (alert: Alert) => {
    setSelectedAlert(alert);
    if (onInspectAlert) onInspectAlert(alert);
  };

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-sm flex flex-col h-full transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative p-1.5 rounded-lg bg-red-500/15 text-red-500 border border-red-500/30">
            <Bell className="w-4 h-4" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              Real-Time Alert Triage
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Correlated Multi-Sensor Threat Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[11px] font-mono text-[var(--muted)]">
            {filteredAlerts.length} Events
          </span>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] mb-3 text-xs">
        <button
          onClick={() => setSeverityFilter('all')}
          className={`py-1 rounded-lg text-[11px] font-medium transition-colors ${
            severityFilter === 'all'
              ? 'bg-sky-600 text-white font-semibold shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setSeverityFilter('critical')}
          className={`py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
            severityFilter === 'critical'
              ? 'bg-red-600 text-white font-bold shadow-sm'
              : 'text-red-500 hover:bg-red-500/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => setSeverityFilter('warning')}
          className={`py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
            severityFilter === 'warning'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'text-amber-500 hover:bg-amber-500/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Warning ({warningCount})
        </button>
        <button
          onClick={() => setSeverityFilter('info')}
          className={`py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
            severityFilter === 'info'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-blue-500 hover:bg-blue-500/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Info ({infoCount})
        </button>
      </div>

      {/* Alerts List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[280px] max-h-[460px]">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--muted)]">
            <CheckCircle className="w-8 h-8 text-emerald-500/50 mb-2" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">No alerts in this category</p>
            <p className="text-[11px] text-[var(--muted)]">Border perimeter nominal</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isNew = alert.status === 'new';

            // Clean card border without excessive glowing
            const cardBorder = isCritical
              ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/70'
              : isWarning
              ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70'
              : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60';

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all duration-150 ${cardBorder} ${
                  isCritical && isNew ? 'animate-pulse' : ''
                }`}
              >
                {/* Alert Top Row: Severity Badge, ID, Time */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${getSeverityDotClass(alert.severity)}`} />
                    <span className="font-mono text-[11px] font-bold text-[var(--text)]">
                      {alert.id}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 font-semibold">
                      {formatConfidence(alert.confidence)}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {alert.timestamp}
                  </span>
                </div>

                {/* Event Type & Description */}
                <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <span>{getDetectionTypeLabel(alert.eventType)}</span>
                  <span className="text-[10px] font-normal text-[var(--muted)] font-mono">
                    • {alert.cameraId}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>

                {/* QRF / Unit Dispatch Status */}
                {alert.qrfDispatched && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-sky-600 dark:text-cyan-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                    <span>{alert.assignedUnit || 'QRF Rapid Unit En-Route'}</span>
                  </div>
                )}

                {/* Compact Action Buttons with Cleaner Spacing */}
                <div className="mt-2 pt-1.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    Status: <strong className="text-[var(--text)] capitalize">{alert.status.replace('_', ' ')}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    {isNew && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2 py-0.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] text-[10px] font-semibold transition-colors flex items-center gap-1 border border-[var(--border)]"
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-500" />
                        <span>Ack</span>
                      </button>
                    )}

                    {!alert.qrfDispatched && isCritical && (
                      <button
                        onClick={() => escalateAlert(alert.id, 'QRF Alpha Fast Team')}
                        className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors shadow-sm flex items-center gap-1"
                      >
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Dispatch QRF</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleInspect(alert)}
                      className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
