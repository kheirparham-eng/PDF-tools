import React, { useRef, useState, useEffect } from 'react';
import {
  LayoutDashboard,
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
  ShieldCheck
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
  const navRef = useRef<HTMLElement>(null);
  const [pillRect, setPillRect] = useState<{ left: number; width: number } | null>(null);

  const tabs: Array<{ id: ToolTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'merge', label: 'Merge', icon: <Layers className="w-4 h-4" /> },
    { id: 'split', label: 'Split & Extract', icon: <Scissors className="w-4 h-4" /> },
    { id: 'grayscale', label: 'Color to B&W', icon: <Palette className="w-4 h-4" /> },
    { id: 'compress', label: 'Compress', icon: <Zap className="w-4 h-4" /> },
    { id: 'convert-image', label: 'PDF to Image', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'img-to-pdf', label: 'Image to PDF', icon: <FileImage className="w-4 h-4" /> },
    { id: 'reorder', label: 'Reorder', icon: <RefreshCw className="w-4 h-4" /> }
  ];

  useEffect(() => {
    const updatePill = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector<HTMLElement>(`#tab-${activeTab}`);
      if (activeEl) {
        setPillRect({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth
        });
      }
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeTab]);

  return (
    <header className="sticky top-0 z-30 water-gloss-nav transition-colors duration-300 relative">
      {/* Specular Meniscus Top Highlight */}
      <div className="water-surface-meniscus" />
      
      {/* Specular Optical Glaze */}
      <div className="water-specular-glaze" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Bar: Brand, Privacy, Theme Switcher */}
        <div className="flex items-center justify-between h-16 border-b border-black/5 dark:border-white/5">
          
          {/* Logo & Brand with Monochromatic Liquid Glass Icon */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 select-none cursor-pointer group"
            title="Go to Dashboard"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 flex items-center justify-center text-white dark:text-zinc-950 shadow-md shadow-black/15 border border-white/20 dark:border-white/50 ring-1 ring-black/5 overflow-hidden transition-transform duration-200 group-hover:scale-105 active:scale-95 relative">
                {/* Specular liquid lens dome */}
                <div className="absolute top-0.5 inset-x-1.5 h-1/2 rounded-t-xl bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                <FileText className="w-5 h-5 relative z-10 drop-shadow-sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                  PDF Studio
                </span>
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 font-medium">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal hidden sm:block">
                On-device privacy · Zero cloud uploads
              </p>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 select-none">
            <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
            <span>100% Client-Side Sandbox</span>
          </div>

          {/* iOS Theme Switcher */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={toggleTheme}
              id="theme-toggle-btn"
              className="relative p-2.5 rounded-2xl water-droplet-btn text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white active:scale-90 transition-transform duration-150 cursor-pointer overflow-hidden shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Appearance' : 'Switch to Dark Appearance'}
              aria-label="Toggle theme appearance"
            >
              <div className="flex items-center justify-center">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-zinc-200 transition-transform duration-300 drop-shadow-sm" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-300" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Liquid Water Segmented Dock Bar */}
        <div className="py-2.5 flex items-center justify-start sm:justify-center overflow-x-auto scrollbar-none">
          <nav
            ref={navRef}
            className="relative inline-flex p-1.5 rounded-2xl water-dock-trough max-w-full space-x-1 shrink-0"
          >
            {/* Smooth Sliding Water Droplet Indicator Pill */}
            {pillRect && (
              <div
                className="absolute top-1.5 bottom-1.5 rounded-xl water-droplet-pill pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform: `translate3d(${pillRect.left}px, 0, 0)`,
                  width: `${pillRect.width}px`
                }}
              />
            )}

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer select-none active:scale-[0.96] ${
                    isActive
                      ? 'text-[#0f2d52] dark:text-white font-bold'
                      : 'text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`transition-colors duration-150 ${
                      isActive ? 'text-[#0f2d52] dark:text-white' : 'opacity-80'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
};
