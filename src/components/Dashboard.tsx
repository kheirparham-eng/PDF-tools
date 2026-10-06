import React from 'react';
import {
  Layers,
  Scissors,
  Zap,
  Palette,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
  Printer,
  ArrowRight
} from 'lucide-react';
import { ToolTab, ToastMessage } from '../types';

interface DashboardProps {
  setActiveTab: (tab: ToolTab) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const tools: Array<{
    id: ToolTab;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'print',
      title: 'Print & Page Layout',
      description: 'Configure paper sizes, printable margins, binding gutters, page numbers, and print.',
      icon: <Printer className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'merge',
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into a single unified document.',
      icon: <Layers className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'split',
      title: 'Split & Extract',
      description: 'Extract specific pages, page ranges, or separate pages.',
      icon: <Scissors className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      description: 'Reduce file size while preserving high visual quality.',
      icon: <Zap className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'convert-image',
      title: 'PDF to Image',
      description: 'Export pages as high-resolution PNG or JPG images.',
      icon: <ImageIcon className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'img-to-pdf',
      title: 'Image to PDF',
      description: 'Convert PNG, JPG, or WebP images into a PDF document.',
      icon: <FileImage className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'reorder',
      title: 'Reorder & Rotate',
      description: 'Rearrange page order and rotate pages with visual preview.',
      icon: <RefreshCw className="w-5 h-5 text-white dark:text-zinc-950" />
    },
    {
      id: 'grayscale',
      title: 'Grayscale PDF',
      description: 'Convert color documents to clean black & white for printing.',
      icon: <Palette className="w-5 h-5 text-white dark:text-zinc-950" />
    }
  ];

  return (
    <div className="space-y-6 animate-liquid-glass max-w-6xl mx-auto">
      
      {/* Simple, Brief Hero Banner */}
      <div className="relative iris-glass rounded-[28px] p-6 sm:p-8 shadow-md overflow-hidden">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              PDF Studio
            </h1>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 font-normal">
              Fast, client-side PDF tools. All processing happens securely in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('print')}
              className="liquid-export-btn cursor-pointer text-xs sm:text-sm py-2 px-4 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Options</span>
            </button>
            <button
              onClick={() => setActiveTab('compress')}
              className="px-4 py-2 rounded-full ios-btn-secondary text-zinc-950 dark:text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
              <span className="text-zinc-950 dark:text-white">Compress</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className="group iris-glass rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />

            <div>
              {/* High-Contrast Icon Badge: Pure Black in Light Mode with White Icon, Pure White in Dark Mode with Black Icon */}
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
                {tool.icon}
              </div>

              <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center justify-between">
                <span>{tool.title}</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </h2>

              <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed">
                {tool.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
