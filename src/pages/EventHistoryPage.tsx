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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.75);
  const [selectedEvent, setSelectedEvent] = useState<SurveillanceEvent | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      const data = await eventsApi.getEvents({
        search: searchQuery,
        eventType: selectedType,
        threatLevel: selectedThreat,
        minConfidence,
      });
      setEvents(data);
    };
    loadEvents();
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
    <div className="space-y-5 pb-12">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#090e1a]/95 border border-sky-950/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Border Surveillance Event Forensics & History Log
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {events.length} ARCHIVED
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Query historical cross-border intrusions, vehicle crossings, loitering and edge detections
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
        {/* Search */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Keywords</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Camera, Sector, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Detection Event Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
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
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Threat Level</label>
          <select
            value={selectedThreat}
            onChange={(e) => setSelectedThreat(e.target.value)}
            className="w-full p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Threat Levels</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        {/* Confidence Threshold Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Min AI Confidence:</span>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(minConfidence * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.98"
            step="0.02"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* Main Events Table */}
      <div className="overflow-x-auto rounded-2xl border border-sky-950/70 bg-[#090e1a]/95 shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-mono uppercase tracking-wider text-slate-400">
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
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {events.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                  No historical surveillance events found matching selected filter criteria.
                </td>
              </tr>
            ) : (
              events.map((evt: SurveillanceEvent) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-sky-400 whitespace-nowrap">
                    {evt.id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-slate-100">{evt.cameraName}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{evt.cameraId} • {evt.sector}</div>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                    {getDetectionTypeLabel(evt.eventType)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">
                        {formatConfidence(evt.confidence)}
                      </span>
                      <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${evt.confidence * 100}%` }}
                          className="bg-emerald-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {evt.durationSec > 0 ? `${evt.durationSec}s` : 'Instant'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getSeverityBadgeClass(evt.threatLevel)}`}>
                      {evt.threatLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300">
                    {evt.resolvedBy || 'Automated Rule'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[11px] font-semibold flex items-center gap-1 inline-flex transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Snapshot Evidence Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#090e1a] border border-sky-500/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">{selectedEvent.id} Event Forensics</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Bounding Box Snapshot Viewer */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center tactical-grid-bg">
              <div className="text-center p-4">
                <ShieldAlert className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                <div className="text-xs font-mono text-cyan-300 font-bold">
                  EVIDENCE SNAPSHOT #{selectedEvent.id}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  AI Target: {selectedEvent.eventType.toUpperCase()} • Conf: {formatConfidence(selectedEvent.confidence)}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div><strong>Description:</strong> {selectedEvent.description}</div>
              <div><strong>Camera Node:</strong> {selectedEvent.cameraName} ({selectedEvent.cameraId})</div>
              <div><strong>Sector:</strong> {selectedEvent.sector}</div>
              <div><strong>Timestamp:</strong> {selectedEvent.timestamp}</div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
