import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    // Log defense diagnostics
    console.error('[IBVAP Tactical Defense Core] Uncaught Runtime Exception:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-2xl bg-[#090e1a] border-2 border-red-500/70 p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-500" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-500" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-red-500" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-red-500" />

            <div className="flex items-center gap-3 pb-4 border-b border-red-500/30">
              <div className="p-3 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-wider text-white font-mono uppercase">
                    TACTICAL SUBSYSTEM RECOVERY
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500 text-black font-bold">
                    FAIL-SAFE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  IBVAP Command Center isolated an unexpected runtime anomaly
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-black/60 border border-red-950 text-xs font-mono text-red-300 flex items-start gap-2">
                <Terminal className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="overflow-x-auto">
                  <span className="font-bold">FAULT:</span> {this.state.error?.message || 'Unknown execution fault'}
                </div>
              </div>

              <div className="text-xs text-slate-300">
                All perimeter surveillance telemetry and emergency lockdown protocols remain active on edge nodes. Click below to re-arm the command interface.
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs transition-colors shadow flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Arm Subsystem</span>
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-semibold text-xs transition-colors border border-slate-700"
                >
                  Reload Command Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
