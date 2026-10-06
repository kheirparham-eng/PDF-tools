import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { ProcessingState } from '../types';

interface ProcessingOverlayProps {
  state: ProcessingState;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ state }) => {
  if (!state.isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xl transition-all">
      <div className="ios-glass rounded-3xl p-7 sm:p-8 max-w-sm w-full space-y-5 text-center relative overflow-hidden shadow-2xl border border-white/20 dark:border-white/15 animate-ios-spring">
        
        {/* Top ambient illumination */}
        <div className="ios-glass-sheen" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 dark:bg-white/[0.05] rounded-full blur-2xl pointer-events-none" />
        
        {/* Monochromatic Indicator Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ios-pill text-zinc-900 dark:text-zinc-100 shadow-inner relative z-10 mx-auto">
          {state.progress >= 100 ? (
            <CheckCircle className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-zinc-800 dark:text-zinc-200" />
          )}
        </div>

        <div className="relative z-10 space-y-1">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
            {state.title}
          </h3>
          {state.detail && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {state.detail}
            </p>
          )}
        </div>

        {/* Monochromatic Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <span>Processing</span>
            <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
              {Math.round(state.progress)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-zinc-700 via-zinc-800 to-black dark:from-zinc-300 dark:via-zinc-200 dark:to-white transition-all duration-200 rounded-full shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, state.progress))}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 relative z-10">
          Protected by local browser sandbox
        </p>
      </div>
    </div>
  );
};

