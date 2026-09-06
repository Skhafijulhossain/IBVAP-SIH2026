import React, { useState } from 'react';
import { SurveillanceEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  History, 
  Download, 
  Search
} from 'lucide-react';
import { formatConfidence, getSeverityBadgeClass, getDetectionTypeLabel, exportToCsv } from '../../utils/helpers';

interface EventTimelineProps {
  onSelectEvent?: (event: SurveillanceEvent) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = () => {
  const { events } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.7);

  const filteredEvents = events.filter((evt) => {
    if (minConfidence && evt.confidence < minConfidence) return false;
    if (selectedType && selectedType !== 'all' && evt.eventType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.description.toLowerCase().includes(q) ||
        evt.cameraName.toLowerCase().includes(q) ||
        evt.id.toLowerCase().includes(q) ||
        evt.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const rows = events.map((e) => ({
      Event_ID: e.id,
      Timestamp: e.timestamp,
      Camera_ID: e.cameraId,
      Camera_Name: e.cameraName,
      Sector: e.sector,
      Event_Type: e.eventType,
      Confidence: `${Math.round(e.confidence * 100)}%`,
      Threat_Level: e.threatLevel,
      Resolved_By: e.resolvedBy || 'Pending',
      Description: e.description,
    }));
    exportToCsv('IBVAP_Border_Surveillance_Events_SIH2026', rows);
  };

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-sm flex flex-col transition-colors">
      {/* Header & Export Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              Border Surveillance Event Timeline & Forensics
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Chronological log with AI verification confidence and spatial tags
            </p>
          </div>
        </div>

        {/* Quick CSV Export */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--card-hover)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Camera, Event, or Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Event Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-xs focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Event Types</option>
          <option value="person">Person Detected</option>
          <option value="vehicle">Vehicle Movement</option>
          <option value="line_crossing">Tripwire / Line Crossing</option>
          <option value="intrusion">Intrusion</option>
          <option value="weapon">Weapon Silhouette</option>
          <option value="loitering">Loitering</option>
          <option value="camera_offline">Camera Offline</option>
        </select>

        {/* Confidence Threshold */}
        <div className="flex items-center gap-1.5 text-[var(--muted)] text-[11px] font-mono">
          <span>Min Conf:</span>
          <span className="font-bold text-sky-600 dark:text-sky-300">{Math.round(minConfidence * 100)}%</span>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-16 accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Table Container with Sticky Header & Soft Hover */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] max-h-[360px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[var(--table-header)] border-b border-[var(--border)] backdrop-blur-md">
            <tr className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2.5 px-3">Event ID</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Camera Node</th>
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">AI Confidence</th>
              <th className="py-2.5 px-3">Threat Level</th>
              <th className="py-2.5 px-3">Triage Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[var(--muted)] font-sans">
                  No matching events found. Adjust search filters.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">
                    {evt.id}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[var(--text)] whitespace-nowrap">
                    {evt.cameraId}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--muted)] font-sans whitespace-nowrap">
                    {evt.sector}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text)]">
                    {getDetectionTypeLabel(evt.eventType)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatConfidence(evt.confidence)}
                      </span>
                      <div className="w-12 bg-[var(--surface-raised)] border border-[var(--border)] h-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${evt.confidence * 100}%` }}
                          className="bg-emerald-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getSeverityBadgeClass(evt.threatLevel)}`}>
                      {evt.threatLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[var(--text-secondary)]">
                    {evt.resolvedBy || 'Automated Pipeline'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
