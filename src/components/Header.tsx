import React from 'react';
import {
  FileText,
  Layers,
  Scissors,
  Palette,
  Zap,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ToolTab, ThemeMode } from '../types';

interface HeaderProps {
  activeTab: ToolTab;
  setActiveTab: (tab: ToolTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme
}) => {
  const tabs: Array<{ id: ToolTab; label: string; icon: React.ReactNode }> = [
    { id: 'merge', label: 'Merge PDFs', icon: <Layers className="w-4 h-4" /> },
    { id: 'split', label: 'Split & Extract', icon: <Scissors className="w-4 h-4" /> },
    { id: 'grayscale', label: 'Color to B&W', icon: <Palette className="w-4 h-4" /> },
    { id: 'compress', label: 'Compress PDF', icon: <Zap className="w-4 h-4" /> },
    { id: 'convert-image', label: 'PDF to Image', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'img-to-pdf', label: 'Image to PDF', icon: <FileImage className="w-4 h-4" /> },
    { id: 'reorder', label: 'Reorder Pages', icon: <RefreshCw className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-30 glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand with Liquid Glass Glow */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 border border-white/30 backdrop-blur-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent tracking-tight">
                  PDF Suite
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full glass-pill text-indigo-700 dark:text-indigo-300">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Privacy-first browser PDF processing
              </p>
            </div>
          </div>

          {/* Privacy Badge (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% Private — Files never leave browser</span>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              id="theme-toggle-btn"
              className="p-2.5 rounded-xl glass-pill text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* Liquid Glass Navigation Tabs Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'glass-btn-primary text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                    : 'glass-pill text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:scale-[1.01]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

