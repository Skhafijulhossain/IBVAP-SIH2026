import React, { useState } from 'react';
import { 
  Camera, 
  Cpu, 
  BrainCircuit, 
  Layers, 
  ShieldAlert, 
  ArrowRight, 
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { AI_WORKFLOW_STEPS } from '../../data/mockData';
import { AiWorkflowStep } from '../../types';

export const AiWorkflow: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<AiWorkflowStep | null>(null);

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Camera':
        return <Camera className="w-5 h-5 text-sky-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'BrainCircuit':
        return <BrainCircuit className="w-5 h-5 text-indigo-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-amber-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-emerald-400" />;
      default:
        return <Zap className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-[#090e1a]/90 border border-sky-950/70 p-4 lg:p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm lg:text-base font-bold text-white tracking-tight">
              AI Border Surveillance Pipeline Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Offline-first edge acceleration connecting legacy RTSP/ONVIF infrastructure to autonomous QRF dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            End-to-End Latency: &lt; 150ms
          </span>
        </div>
      </div>

      {/* Connected 5-Stage Workflow Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 relative">
        {AI_WORKFLOW_STEPS.map((step, index) => {
          const isSelected = selectedStep?.id === step.id;

          return (
            <div key={step.id} className="relative flex flex-col group">
              {/* Card */}
              <button
                onClick={() => setSelectedStep(isSelected ? null : step)}
                className={`w-full text-left p-3.5 rounded-2xl bg-gradient-to-b ${step.color} border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col justify-between h-full ${
                  isSelected ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-cyan-500/20 shadow-lg' : ''
                }`}
              >
                <div>
                  {/* Top Row: Icon + Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                      {getStepIcon(step.icon)}
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-slate-300 border border-slate-700/60 font-semibold">
                      STAGE {step.id}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                    {step.title}
                  </div>
                  <div className="text-[11px] font-medium text-slate-300 mb-2">
                    {step.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed mb-3">
                    {step.description}
                  </p>
                </div>

                {/* Tech Spec Footer */}
                <div className="pt-2 border-t border-white/10 mt-auto">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    Edge Metric
                  </div>
                  <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{step.metrics}</span>
                  </div>
                </div>
              </button>

              {/* Connecting Arrow between cards on desktop */}
              {index < AI_WORKFLOW_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-4 h-4 rounded-full bg-slate-900 border border-cyan-500/40 items-center justify-center text-cyan-400">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Spec Modal / Details Drawer if clicked */}
      {selectedStep && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>{selectedStep.title} — Deep Integration Specification</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              <strong>Hardware/Software Spec:</strong> {selectedStep.techSpec}
            </p>
          </div>

          <button
            onClick={() => setSelectedStep(null)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};
