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
    <div className="rounded-2xl bg-[#090e1a]/95 border border-sky-950/70 p-4 shadow-xl flex flex-col">
      {/* Header & Export Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Border Surveillance Event Timeline & Forensics
            </h3>
            <p className="text-[11px] text-slate-400">
              Chronological log with AI verification confidence and spatial tags
            </p>
          </div>
        </div>

        {/* Quick CSV Export */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon: Search, Event Type, Min Confidence */}
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Camera, Event, or Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Event Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
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
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
          <span>Min Conf:</span>
          <span className="font-bold text-sky-300">{Math.round(minConfidence * 100)}%</span>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-mono uppercase tracking-wider text-slate-400">
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
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  No matching events found. Adjust search filters.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-bold text-sky-400">
                    {evt.id}
                  </td>
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-200 whitespace-nowrap">
                    {evt.cameraId}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-sans whitespace-nowrap">
                    {evt.sector}
                  </td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-200">
                    {getDetectionTypeLabel(evt.eventType)}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-400">
                        {formatConfidence(evt.confidence)}
                      </span>
                      <div className="w-12 bg-slate-800 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${evt.confidence * 100}%` }}
                          className="bg-emerald-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getSeverityBadgeClass(evt.threatLevel)}`}>
                      {evt.threatLevel}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-400">
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
