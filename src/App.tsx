import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MergeTool } from './components/MergeTool';
import { SplitTool } from './components/SplitTool';
import { GrayscaleTool } from './components/GrayscaleTool';
import { CompressTool } from './components/CompressTool';
import { ImageConvertTool } from './components/ImageConvertTool';
import { ImgToPdfTool } from './components/ImgToPdfTool';
import { PageReorderTool } from './components/PageReorderTool';
import { PrintTool } from './components/PrintTool';
import { ToastContainer } from './components/Toast';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { ToolTab, ThemeMode, ProcessingState, ToastMessage } from './types';
import { ShieldCheck } from 'lucide-react';
import { IrisBackground } from './components/IrisBackground';

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolTab>('dashboard');
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
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-x-hidden transition-colors duration-500 selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 font-sans">
      
      {/* Iris Flower & Ethereal Sky Background (Matching the Reference Image) */}
      <IrisBackground />

      {/* Top Liquid Glass Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Viewport with Liquid Glass Refraction & Spring Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div
          key={activeTab}
          className="liquid-glass-tab-container"
        >
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              addToast={addToast}
            />
          )}

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

          {activeTab === 'print' && (
            <PrintTool
              onProcessingChange={setProcessingState}
              addToast={addToast}
            />
          )}
        </div>
      </main>

      {/* Frosted Translucent Glass Footer */}
      <footer className="water-gloss-nav py-5 relative z-10 transition-colors mt-auto overflow-hidden">
        <div className="water-surface-meniscus" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 relative z-10">
          
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
            <span>Private by Design. All document data is processed directly inside your browser memory.</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>Liquid Glass Edition</span>
            <span>·</span>
            <span>Zero Server Uploads</span>
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
