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
        return <Camera className="w-5 h-5 text-sky-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-cyan-500" />;
      case 'BrainCircuit':
        return <BrainCircuit className="w-5 h-5 text-indigo-500" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-amber-500" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-emerald-500" />;
      default:
        return <Zap className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 lg:p-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm lg:text-base font-bold text-[var(--text)] tracking-tight">
              AI Border Surveillance Pipeline Architecture
            </h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Offline-first edge acceleration connecting legacy RTSP/ONVIF infrastructure to autonomous QRF dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Latency: &lt; 150ms
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
                className={`w-full text-left p-3.5 rounded-2xl bg-[var(--surface-raised)] border transition-all duration-200 hover:scale-[1.01] hover:border-sky-500/50 flex flex-col justify-between h-full shadow-sm ${
                  isSelected ? 'ring-2 ring-sky-500 border-sky-500' : 'border-[var(--border)]'
                }`}
              >
                <div>
                  {/* Top Row: Icon + Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                      {getStepIcon(step.icon)}
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] font-semibold">
                      STAGE {step.id}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="font-bold text-xs text-[var(--text)] group-hover:text-sky-500 transition-colors">
                    {step.title}
                  </div>
                  <div className="text-[11px] font-medium text-[var(--muted)] mb-2">
                    {step.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-3">
                    {step.description}
                  </p>
                </div>

                {/* Tech Spec Footer */}
                <div className="pt-2 border-t border-[var(--border)] mt-auto">
                  <div className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-wider">
                    Edge Metric
                  </div>
                  <div className="text-[11px] font-mono font-bold text-[var(--text)] flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="truncate">{step.metrics}</span>
                  </div>
                </div>
              </button>

              {/* Connecting Arrow between cards on desktop */}
              {index < AI_WORKFLOW_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-4 h-4 rounded-full bg-[var(--card)] border border-[var(--border)] items-center justify-center text-[var(--muted)] shadow-sm">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Spec Modal / Details Drawer if clicked */}
      {selectedStep && (
        <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface-raised)] border border-sky-500/30 text-xs text-[var(--text)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="space-y-1">
            <div className="font-bold text-sky-600 dark:text-cyan-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-500" />
              <span>{selectedStep.title} — Deep Integration Specification</span>
            </div>
            <p className="text-[var(--text-secondary)] text-[11px]">
              <strong>Hardware/Software Spec:</strong> {selectedStep.techSpec}
            </p>
          </div>

          <button
            onClick={() => setSelectedStep(null)}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text)] border border-[var(--border)] shrink-0"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};
