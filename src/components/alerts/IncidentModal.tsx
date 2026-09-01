import React, { useState } from 'react';
import { Alert } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldAlert, 
  Radio, 
  CheckCircle, 
  Download, 
  Crosshair
} from 'lucide-react';
import { formatConfidence, getSeverityBadgeClass, getDetectionTypeLabel, exportToJson } from '../../utils/helpers';

interface IncidentModalProps {
  alert: Alert | null;
  onClose: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ alert, onClose }) => {
  const { acknowledgeAlert, escalateAlert, dismissAlert } = useApp();
  const [operatorNotes, setOperatorNotes] = useState<string>(alert?.operatorNotes || '');
  const [selectedUnit, setSelectedUnit] = useState<string>(alert?.assignedUnit || 'QRF Tactical Unit Alpha-1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!alert) return null;

  const handleEscalate = async () => {
    setIsProcessing(true);
    await escalateAlert(alert.id, selectedUnit, operatorNotes);
    setIsProcessing(false);
    onClose();
  };

  const handleAck = async () => {
    setIsProcessing(true);
    await acknowledgeAlert(alert.id);
    setIsProcessing(false);
    onClose();
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    await dismissAlert(alert.id, operatorNotes || 'Marked as false positive');
    setIsProcessing(false);
    onClose();
  };

  const handleExportDossier = () => {
    exportToJson(`INCIDENT_DOSSIER_${alert.id}`, {
      ...alert,
      investigationNotes: operatorNotes,
      exportedAt: new Date().toISOString(),
      platform: 'IBVAP - Smart India Hackathon 2026',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl rounded-2xl bg-[#090e1a] border border-sky-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sky-950/80 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-mono">
                  {alert.id}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {formatConfidence(alert.confidence)} AI CONFIDENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {getDetectionTypeLabel(alert.eventType)} • {alert.cameraName} ({alert.cameraId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Simulated Snapshot Feed with Bounding Box Overlay */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 tactical-grid-bg">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-6">
                <Crosshair className="w-12 h-12 text-cyan-400/50 mx-auto mb-2 animate-pulse" />
                <div className="text-xs font-mono text-cyan-300 font-bold">
                  HIGH-RESOLUTION EVIDENCE CAPTURE
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  GPS: {alert.coordinates.lat.toFixed(4)}°N, {alert.coordinates.lng.toFixed(4)}°E • Sector: {alert.sector}
                </div>
              </div>
            </div>

            {/* Simulated Bounding Box highlight */}
            <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-red-500 bg-red-500/10 rounded-lg animate-pulse pointer-events-none">
              <div className="absolute -top-6 left-0 bg-red-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                TARGET: {alert.eventType.toUpperCase()} [{formatConfidence(alert.confidence)}]
              </div>
            </div>

            {/* Corner tags */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-red-400 border border-slate-700">
              FRAME CAPTURE #{alert.id}
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-slate-300 border border-slate-700">
              TIMESTAMP: {alert.timestamp}
            </div>
          </div>

          {/* Incident Description */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-slate-200">Incident Description:</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.description}
            </p>
          </div>

          {/* Quick Reaction Force (QRF) Dispatch Selector */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-sky-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Quick Reaction Force (QRF) Deployment</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                TAC-MESH RADIO CH7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                <input
                  type="radio"
                  name="qrfUnit"
                  value="QRF Tactical Unit Alpha-1"
                  checked={selectedUnit === 'QRF Tactical Unit Alpha-1'}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="accent-cyan-400"
                />
                <div>
                  <div className="font-semibold text-slate-200">QRF Unit Alpha-1</div>
                  <div className="text-[10px] text-slate-400 font-mono">ETA: 3 mins • Armored Vehicle</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                <input
                  type="radio"
                  name="qrfUnit"
                  value="QRF Riverine Patrol Boat Delta"
                  checked={selectedUnit === 'QRF Riverine Patrol Boat Delta'}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="accent-cyan-400"
                />
                <div>
                  <div className="font-semibold text-slate-200">QRF Riverine Boat Delta</div>
                  <div className="text-[10px] text-slate-400 font-mono">ETA: 4 mins • High-Speed Craft</div>
                </div>
              </label>
            </div>
          </div>

          {/* Operator Investigation Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Operator Log Notes & Forensic Remarks:
            </label>
            <textarea
              rows={2}
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Enter operational notes or reason for escalation..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-sky-950/80 bg-slate-950/80">
          <button
            onClick={handleExportDossier}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Dossier (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/50 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-semibold transition-colors"
            >
              False Alarm
            </button>

            <button
              onClick={handleAck}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>

            <button
              onClick={handleEscalate}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Dispatch {selectedUnit.split(' ')[2] || 'QRF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
