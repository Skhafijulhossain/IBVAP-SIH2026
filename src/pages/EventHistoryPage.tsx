import React, { useState, useEffect } from 'react';
import type { SurveillanceEvent } from '../types';
import { eventsApi } from '../api/eventsApi';
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  FileText,
  X,
  ShieldAlert
} from 'lucide-react';
import { formatConfidence, getSeverityBadgeClass, getDetectionTypeLabel, exportToCsv, exportToJson } from '../utils/helpers';

export const EventHistoryPage: React.FC = () => {
  const [events, setEvents] = useState<SurveillanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.80);
  const [selectedEvent, setSelectedEvent] = useState<SurveillanceEvent | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventsApi.getEvents({
          search: searchQuery,
          eventType: selectedType,
          threatLevel: selectedThreat,
          minConfidence,
        });
        if (isMounted) setEvents(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedType, selectedThreat, minConfidence]);

  const handleExportCsv = () => {
    const rows = events.map((e: SurveillanceEvent) => ({
      Event_ID: e.id,
      Timestamp: e.timestamp,
      Camera_ID: e.cameraId,
      Camera_Name: e.cameraName,
      Sector: e.sector,
      Event_Type: e.eventType,
      Confidence: `${Math.round(e.confidence * 100)}%`,
      Threat_Level: e.threatLevel,
      Duration_Sec: e.durationSec,
      Resolved_By: e.resolvedBy || 'Automated Engine',
      Description: e.description,
    }));
    exportToCsv('IBVAP_Surveillance_Event_Log_SIH2026', rows);
  };

  const handleExportJson = () => {
    exportToJson('IBVAP_Surveillance_Event_Log_SIH2026', events);
  };

  return (
    <div className="space-y-4 pb-12 transition-colors">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-[var(--text)] tracking-tight flex items-center gap-2">
              Border Surveillance Event Forensics & History Log
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                {events.length} ARCHIVED
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Query historical cross-border intrusions, vehicle crossings, loitering and edge detections
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] text-xs">
        {/* Search */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Search Keywords</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Camera, Sector, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Detection Event Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Event Types</option>
            <option value="person">Person Detected</option>
            <option value="vehicle">Vehicle Detected</option>
            <option value="line_crossing">Tripwire / Line Crossing</option>
            <option value="intrusion">Intrusion Detected</option>
            <option value="weapon">Weapon Silhouette</option>
            <option value="loitering">Loitering Alert</option>
            <option value="camera_offline">Camera Offline</option>
          </select>
        </div>

        {/* Threat Level Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Threat Level</label>
          <select
            value={selectedThreat}
            onChange={(e) => setSelectedThreat(e.target.value)}
            className="w-full p-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Threat Levels</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        {/* Confidence Threshold Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)] mb-1">
            <span>Min AI Confidence:</span>
            <span className="font-mono text-sky-600 dark:text-cyan-300 font-bold">{Math.round(minConfidence * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.98"
            step="0.02"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* Main Events Table with Sticky Header & Soft Hover */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm max-h-[600px] relative">
        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-[var(--table-header)] backdrop-blur-md border-b border-[var(--border)]">
            <tr className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              <th className="py-3 px-4">Event ID</th>
              <th className="py-3 px-4">Timestamp (IST)</th>
              <th className="py-3 px-4">Camera & Sector</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">AI Confidence</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Threat Level</th>
              <th className="py-3 px-4">Triage Resolution</th>
              <th className="py-3 px-4 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sky-500 font-mono text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                    <span>QUERYING IMMUTABLE FORENSIC LOGS (CONFIDENCE ≥ {Math.round(minConfidence * 100)}%)...</span>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[var(--muted)] font-sans">
                  No historical surveillance events found matching selected filter criteria.
                </td>
              </tr>
            ) : (
              events.map((evt: SurveillanceEvent) => (
                <tr key={evt.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                    {evt.id}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-sans font-bold text-[var(--text)]">{evt.cameraName}</div>
                    <div className="text-[10px] font-mono text-sky-600 dark:text-cyan-400">{evt.cameraId} • {evt.sector}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-[var(--text)]">
                    {getDetectionTypeLabel(evt.eventType)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatConfidence(evt.confidence)}
                      </span>
                      <div className="w-14 bg-[var(--surface-raised)] border border-[var(--border)] h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${evt.confidence * 100}%` }}
                          className="bg-emerald-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--muted)]">
                    {evt.durationSec > 0 ? `${evt.durationSec}s` : 'Instant'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityBadgeClass(evt.threatLevel)}`}>
                      {evt.threatLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] font-sans">
                    {evt.resolvedBy || 'Automated Engine'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-sky-600 dark:text-sky-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-[var(--border)]"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Forensic Evidence Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-base text-[var(--text)]">
                  Forensic Evidence: {selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="aspect-video w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[var(--border)]">
                {selectedEvent.snapshotUrl ? (
                  <img src={selectedEvent.snapshotUrl} alt="Evidence" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[var(--muted)] font-mono">FORENSIC ARCHIVE FRAME #{selectedEvent.id}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[var(--text)]">
                <div><strong>Camera:</strong> {selectedEvent.cameraName} ({selectedEvent.cameraId})</div>
                <div><strong>Sector:</strong> {selectedEvent.sector}</div>
                <div><strong>Timestamp:</strong> {selectedEvent.timestamp}</div>
                <div><strong>Confidence:</strong> {formatConfidence(selectedEvent.confidence)}</div>
                <div><strong>Threat Level:</strong> {selectedEvent.threatLevel.toUpperCase()}</div>
                <div><strong>Resolved By:</strong> {selectedEvent.resolvedBy || 'Automated AI Engine'}</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)]">
                <strong>Incident Description:</strong> {selectedEvent.description}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] font-semibold text-xs border border-[var(--border)]"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
