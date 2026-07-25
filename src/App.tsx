import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MergeTool } from './components/MergeTool';
import { SplitTool } from './components/SplitTool';
import { GrayscaleTool } from './components/GrayscaleTool';
import { CompressTool } from './components/CompressTool';
import { ImageConvertTool } from './components/ImageConvertTool';
import { ImgToPdfTool } from './components/ImgToPdfTool';
import { PageReorderTool } from './components/PageReorderTool';
import { ToastContainer } from './components/Toast';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ToolTab, ThemeMode, ProcessingState, ToastMessage } from './types';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolTab>('merge');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('pdf_suite_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    title: '',
    progress: 0
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pdf_suite_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Liquid Ambient Glowing Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Blob 1 - Indigo / Violet */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-pink-500/30 blur-[120px] animate-liquid-1" />
        {/* Blob 2 - Cyan / Sky / Blue */}
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-indigo-600/30 blur-[140px] animate-liquid-2" />
        {/* Blob 3 - Emerald / Fuchsia accent */}
        <div className="absolute bottom-[-10%] left-[25%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-fuchsia-500/20 via-purple-600/25 to-indigo-500/20 blur-[130px] animate-liquid-3" />
      </div>

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'merge' && (
          <MergeTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'split' && (
          <SplitTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'grayscale' && (
          <GrayscaleTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'compress' && (
          <CompressTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'convert-image' && (
          <ImageConvertTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'img-to-pdf' && (
          <ImgToPdfTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}

        {activeTab === 'reorder' && (
          <PageReorderTool
            onProcessingChange={setProcessingState}
            addToast={addToast}
          />
        )}
      </main>

      {/* Glass Footer */}
      <footer className="glass-nav py-6 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% Client-Side Processing. No files or personal data are ever transmitted to any server.</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span>Liquid Glass PDF Suite</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 inline ml-1" />
            </span>
          </div>

        </div>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Fullscreen Processing Progress Overlay */}
      <ProcessingOverlay state={processingState} />

    </div>
  );
}
