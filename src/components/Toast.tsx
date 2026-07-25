import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full px-4 pointer-events-none">
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
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800',
    error: 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800',
    warning: 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800',
    info: 'bg-white dark:bg-slate-800 border-sky-200 dark:border-sky-800'
  };

  return (
    <div
      className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-lg transition-all transform translate-y-0 opacity-100 ${
        bgStyles[toast.type]
      }`}
    >
      <div className="mr-3 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
