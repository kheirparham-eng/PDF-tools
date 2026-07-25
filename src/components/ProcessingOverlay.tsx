import React from 'react';
import { Loader2, CheckCircle, FileText } from 'lucide-react';
import { ProcessingState } from '../types';

interface ProcessingOverlayProps {
  state: ProcessingState;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ state }) => {
  if (!state.isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 text-center relative overflow-hidden shadow-2xl border border-white/30">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="inline-flex items-center justify-center p-4.5 rounded-2xl glass-pill text-indigo-600 dark:text-indigo-400 shadow-lg relative z-10">
          {state.progress >= 100 ? (
            <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
          ) : (
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          )}
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {state.title}
          </h3>
          {state.detail && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
              {state.detail}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Processing</span>
            <span>{Math.round(state.progress)}%</span>
          </div>
          <div className="w-full h-3 bg-white/40 dark:bg-slate-900/60 border border-white/20 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full shadow-md"
              style={{ width: `${Math.min(100, Math.max(0, state.progress))}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 relative z-10">
          🔒 Processing locally in your browser. Files never uploaded.
        </p>
      </div>
    </div>
  );
};
