import React, { useState } from 'react';
import {
  Layers,
  Scissors,
  Palette,
  Zap,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Cpu,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { ToolTab, ToastMessage } from '../types';
import { IrisTickSlider } from './IrisTickSlider';

interface DashboardProps {
  setActiveTab: (tab: ToolTab) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'organize' | 'optimize' | 'convert'>('all');

  const tools: Array<{
    id: ToolTab;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: 'organize' | 'optimize' | 'convert';
    badge: string;
    gradient: string;
    stat: string;
  }> = [
    {
      id: 'merge',
      title: 'Merge PDFs',
      description: 'Combine multiple PDF documents into a unified, high-quality document with custom reordering.',
      icon: <Layers className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'organize',
      badge: 'Multi-File',
      gradient: 'from-zinc-800 via-zinc-900 to-black dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-300',
      stat: 'V8 Engine'
    },
    {
      id: 'split',
      title: 'Split & Extract',
      description: 'Extract specific pages, page ranges, or burst all pages into standalone documents.',
      icon: <Scissors className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'organize',
      badge: 'Visual Grid',
      gradient: 'from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-200 dark:via-zinc-300 dark:to-zinc-400',
      stat: 'Instant Previews'
    },
    {
      id: 'compress',
      title: 'Compress Document',
      description: 'Significantly reduce PDF file size while preserving razor-sharp typography and clarity.',
      icon: <Zap className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'optimize',
      badge: 'Up to 75%',
      gradient: 'from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-300',
      stat: 'Smart Sampling'
    },
    {
      id: 'grayscale',
      title: 'Color to Grayscale',
      description: 'Convert color PDFs to crisp, clean black & white for formal legal filing and archive printing.',
      icon: <Palette className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'optimize',
      badge: 'Monochrome',
      gradient: 'from-zinc-600 via-zinc-700 to-zinc-800 dark:from-zinc-300 dark:to-zinc-500',
      stat: 'Luminance Pass'
    },
    {
      id: 'convert-image',
      title: 'PDF to Image',
      description: 'Extract and export PDF pages as high-resolution PNG or JPEG raster image assets.',
      icon: <ImageIcon className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'convert',
      badge: 'Lossless',
      gradient: 'from-zinc-700 via-zinc-800 to-black dark:from-zinc-200 dark:to-zinc-400',
      stat: 'High DPI'
    },
    {
      id: 'img-to-pdf',
      title: 'Image to PDF',
      description: 'Turn photos, scans, and graphic files into structured, standardized PDF documents.',
      icon: <FileImage className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'convert',
      badge: 'Batch Pack',
      gradient: 'from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300',
      stat: 'Auto Scaling'
    },
    {
      id: 'reorder',
      title: 'Reorder & Rotate',
      description: 'Organize page order with intuitive visual drag-and-drop, delete duplicates, and rotate pages.',
      icon: <RefreshCw className="w-5 h-5 text-[#173860] dark:text-[#0b1d33]" />,
      category: 'organize',
      badge: 'Interactive',
      gradient: 'from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-300 dark:to-zinc-500',
      stat: 'Live Reorder'
    }
  ];

  const filteredTools = filterCategory === 'all'
    ? tools
    : tools.filter((t) => t.category === filterCategory);

  const quickPipelines = [
    {
      title: 'Email Attachment Prep',
      desc: 'Compress and optimize file size for instant email delivery.',
      target: 'compress' as ToolTab,
      badge: 'Streamlined'
    },
    {
      title: 'Legal Archive Grayscale',
      desc: 'Strip decorative colors for standard black-and-white archival.',
      target: 'grayscale' as ToolTab,
      badge: 'Compliance'
    },
    {
      title: 'Multi-Document Binder',
      desc: 'Assemble disparate PDF memos and reports into one package.',
      target: 'merge' as ToolTab,
      badge: 'Batch'
    }
  ];

  return (
    <div className="space-y-8 animate-liquid-glass">
      
      {/* Hero Welcome Glass Panel with Layered Depth */}
      <div className="relative iris-glass rounded-[36px] p-6 sm:p-9 shadow-xl overflow-hidden transition-all duration-300">
        {/* Soft Specular Top Highlight */}
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Liquid Glass Studio</span>
              <span aria-hidden="true">·</span>
              <span>Client-Side Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
              On-Device Document Studio
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">
              High-performance client-side PDF utilities executed securely inside your browser's isolated memory. Zero cloud telemetry, zero queues, pure privacy.
            </p>
          </div>

          {/* Quick Actions Stack (Matching the Buttons in the Reference) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('merge')}
              className="w-full sm:w-auto liquid-export-btn cursor-pointer shadow-lg"
            >
              <Layers className="w-4 h-4" />
              <span>Start Merging</span>
            </button>
            <button
              onClick={() => setActiveTab('compress')}
              className="w-full sm:w-auto px-6 py-3 rounded-full ios-btn-secondary text-zinc-800 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Compress PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row: 4 Cards Exactly Like the Uploaded Component */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Subnets / Processed */}
        <div className="iris-glass rounded-[36px] p-6 sm:p-7 shadow-lg hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between space-y-4">
          <div className="ios-glass-sheen" />
          <div className="liquid-sheen-sweep" />

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
              Total Subnets
            </h3>
            <div className="text-4xl sm:text-5xl font-bold text-zinc-950 dark:text-white tracking-tight font-sans">
              77
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-0.5">
              +12 sn / 1m
            </p>
          </div>

          {/* Capsule Bar Slider */}
          <div className="pt-2">
            <IrisTickSlider
              value={77}
              min={0}
              max={100}
              minLabel="0"
              midLabel="50"
              maxLabel="100"
              totalTicks={20}
              readOnly
            />
          </div>
        </div>

        {/* Metric 2: Privacy Health */}
        <div className="iris-glass rounded-[36px] p-6 sm:p-7 shadow-lg hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between space-y-4">
          <div className="ios-glass-sheen" />
          <div className="liquid-sheen-sweep" />

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
              Privacy Health
            </h3>
            <div className="text-4xl sm:text-5xl font-bold text-zinc-950 dark:text-white tracking-tight font-sans">
              100%
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-0.5">
              0 bytes sent to cloud
            </p>
          </div>

          {/* Capsule Bar Slider */}
          <div className="pt-2">
            <IrisTickSlider
              value={100}
              min={0}
              max={100}
              minLabel="0%"
              midLabel="50%"
              maxLabel="100%"
              totalTicks={20}
              readOnly
            />
          </div>
        </div>

        {/* Metric 3: Optimization Ratio */}
        <div className="iris-glass rounded-[36px] p-6 sm:p-7 shadow-lg hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between space-y-4">
          <div className="ios-glass-sheen" />
          <div className="liquid-sheen-sweep" />

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
              Compression Ratio
            </h3>
            <div className="text-4xl sm:text-5xl font-bold text-zinc-950 dark:text-white tracking-tight font-sans">
              68%
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-0.5">
              40% – 75% typical reduction
            </p>
          </div>

          {/* Capsule Bar Slider */}
          <div className="pt-2">
            <IrisTickSlider
              value={68}
              min={0}
              max={100}
              minLabel="0%"
              midLabel="50%"
              maxLabel="100%"
              totalTicks={20}
              readOnly
            />
          </div>
        </div>

        {/* Metric 4: Studio Readiness */}
        <div className="iris-glass rounded-[36px] p-6 sm:p-7 shadow-lg hover:scale-[1.015] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between space-y-4">
          <div className="ios-glass-sheen" />
          <div className="liquid-sheen-sweep" />

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
              Suite Readiness
            </h3>
            <div className="text-4xl sm:text-5xl font-bold text-zinc-950 dark:text-white tracking-tight font-sans">
              7 / 7
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-0.5">
              Offline execution active
            </p>
          </div>

          {/* Capsule Bar Slider */}
          <div className="pt-2">
            <IrisTickSlider
              value={100}
              min={0}
              max={100}
              minLabel="0"
              midLabel="4"
              maxLabel="7"
              totalTicks={20}
              readOnly
            />
          </div>
        </div>

      </div>

      {/* Tools Section Header with Frosted Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Tool Directory
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal">
            Select a dedicated tool to process, convert, or reorganize your PDF documents.
          </p>
        </div>

        {/* Frosted Filter Segmented Pills */}
        <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/10 border border-zinc-200 dark:border-white/20 shadow-sm self-start sm:self-auto overflow-x-auto">
          {(['all', 'organize', 'optimize', 'convert'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 cursor-pointer select-none ${
                filterCategory === cat
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Tool Cards Grid: Iris Frosted Liquid Glass */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className="group iris-glass rounded-[32px] p-6 sm:p-7 shadow-lg hover:scale-[1.018] hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Meniscus Sheen */}
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />

            <div>
              {/* Card Header: Icon + Clean Text Metadata */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-md border border-black/10 dark:border-white group-hover:scale-105 transition-transform duration-200">
                  {tool.icon}
                </div>
                <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/15">
                  {tool.badge}
                </div>
              </div>

              {/* Title & Description with High Contrast */}
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white transition-colors flex items-center space-x-1.5">
                <span>{tool.title}</span>
                <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-900 dark:text-white" />
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed line-clamp-3">
                {tool.description}
              </p>
            </div>

            {/* Bottom Meta & Launch Action */}
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-500 dark:text-zinc-400 font-semibold">
                {tool.stat}
              </span>
              <span className="font-semibold text-zinc-950 dark:text-white flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Workflows & Privacy Guarantee Dual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Recommended Workflows (2 Columns) */}
        <div className="lg:col-span-2 iris-glass rounded-[36px] p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="ios-glass-sheen" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-md border border-black/10 dark:border-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                One-Click Workflow Presets
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal">
                Common processing chains for fast document execution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {quickPipelines.map((pipe) => (
              <div
                key={pipe.title}
                onClick={() => setActiveTab(pipe.target)}
                className="backdrop-blur-2xl bg-white/70 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-[24px] p-4 shadow-sm hover:bg-white/90 dark:hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/15 text-zinc-700 dark:text-zinc-300">
                      {pipe.badge}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-950 dark:text-white mb-1">
                    {pipe.title}
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-normal leading-normal">
                    {pipe.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 text-[11px] font-bold text-zinc-950 dark:text-white flex items-center space-x-1">
                  <span>Launch Preset</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Client-Side Sandbox Guarantee (1 Column) */}
        <div className="iris-glass rounded-[36px] p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="ios-glass-sheen" />
          
          <div>
            <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center mb-4 shadow-md border border-black/10 dark:border-white">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
              Zero Server Uploads
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed">
              Every operation runs strictly inside your local browser tab using WebAssembly and isolated Web Workers. Sensitive financial, legal, and personal files never leave your device.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>GDPR & HIPAA compliant by architecture</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>Works offline without internet connection</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span>Memory wiped when closing browser tab</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-mono">Security Protocol</span>
              <span className="font-semibold text-zinc-950 dark:text-white">Verified Sandbox</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
