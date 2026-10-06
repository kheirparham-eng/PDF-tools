import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col space-y-2.5 max-w-md w-[92vw] sm:w-full pointer-events-none items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-zinc-800 dark:text-zinc-200 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />,
    info: <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
  };

  return (
    <div
      className="pointer-events-auto flex items-center p-3 px-4 rounded-2xl ios-glass shadow-2xl border border-white/30 dark:border-white/15 transition-all duration-300 w-full animate-ios-spring group select-none relative overflow-hidden"
    >
      <div className="ios-glass-sheen" />
      <div className="mr-3 p-1.5 rounded-xl ios-pill shrink-0 relative z-10">
        {icons[toast.type]}
      </div>
      <div className="flex-1 mr-2 min-w-0">
        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

