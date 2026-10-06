import React, { useState } from 'react';
import {
  Palette,
  Trash2,
  Download,
  FileText,
  Sliders,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFFileItem, ProcessingState, ToastMessage } from '../types';
import { getPDFInfo, convertToGrayscalePDF, formatFileSize, downloadFile } from '../utils/pdfOperations';
import { DropZone } from './DropZone';
import { IrisTickSlider } from './IrisTickSlider';

interface GrayscaleToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const GrayscaleTool: React.FC<GrayscaleToolProps> = ({ onProcessingChange, addToast }) => {
  const [pdfFile, setPdfFile] = useState<PDFFileItem | null>(null);
  const [filterMode, setFilterMode] = useState<'grayscale' | 'contrast' | 'sepia'>('grayscale');
  const [outputFilename, setOutputFilename] = useState('bw_document.pdf');

  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    if (selectedFiles.length === 0) return;
    const file = selectedFiles[0];

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      addToast({
        type: 'warning',
        title: 'Invalid file',
        message: 'Please upload a valid PDF document.'
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const info = await getPDFInfo(arrayBuffer);

      setPdfFile({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        pageCount: info.pageCount,
        arrayBuffer,
        thumbnailUrl: info.thumbnailUrl,
        rotation: 0
      });

      const baseName = file.name.replace(/\.pdf$/i, '');
      setOutputFilename(`${baseName}_bw.pdf`);

      addToast({
        type: 'success',
        title: 'PDF Loaded',
        message: `"${file.name}" loaded (${info.pageCount} pages).`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error reading PDF',
        message: err.message || 'Failed to parse PDF document.'
      });
    }
  };

  const handleConvert = async () => {
    if (!pdfFile) return;

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Converting Color to Grayscale...',
        progress: 10,
        detail: 'Rendering pages onto canvas & stripping color layers...'
      });

      const pdfBytes = await convertToGrayscalePDF(
        pdfFile.arrayBuffer,
        filterMode,
        (progress, detail) => {
          onProcessingChange({
            isProcessing: true,
            title: 'Converting Color to Grayscale...',
            progress,
            detail
          });
        }
      );

      const filename = outputFilename.trim().endsWith('.pdf')
        ? outputFilename.trim()
        : `${outputFilename.trim()}.pdf`;

      downloadFile(pdfBytes, filename);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast({
        type: 'success',
        title: 'Conversion Complete!',
        message: `Saved "${filename}". Download started.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.message || 'Failed to convert PDF to grayscale.'
      });
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Glass Banner */}
      <div className="ios-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-400/10 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-lg border border-white/20 dark:border-white/40 ring-1 ring-black/5">
            <Palette className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Color to Grayscale & B&W
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Convert full-color PDF documents into black & white or neutral grayscale. Reduces printing toner, sharpens high-contrast text, and creates a sleek monochrome presentation.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone or File Details */}
      {!pdfFile ? (
        <DropZone
          onFilesSelected={handleFilesSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop PDF to Convert to Monochrome"
          description="Select a document to strip color data and apply optical grayscale filters"
          id="grayscale-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Card */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="ios-glass-sheen" />
            <div className="flex items-center space-x-4 w-full md:w-auto relative z-10">
              <div className="w-14 h-18 rounded-2xl ios-glass-subtle overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                {pdfFile.thumbnailUrl ? (
                  <img
                    src={pdfFile.thumbnailUrl}
                    alt="Preview"
                    className="w-full h-full object-cover filter grayscale"
                  />
                ) : (
                  <FileText className="w-7 h-7 text-slate-400" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate max-w-sm">
                    {pdfFile.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium ios-pill text-zinc-800 dark:text-zinc-200">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  <span className="font-mono tabular-nums">{pdfFile.pageCount}</span> pages · <span className="font-mono tabular-nums">{formatFileSize(pdfFile.size)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setPdfFile(null)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium ios-btn-secondary text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center space-x-1.5 self-end md:self-center cursor-pointer relative z-10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Change PDF</span>
            </button>
          </div>

          {/* Export Action Bar - Positioned Above PDF Settings */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="space-y-1.5 w-full sm:w-80 relative z-10">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Target Filename
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl ios-input text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <button
              onClick={handleConvert}
              id="convert-grayscale-btn"
              className="liquid-export-btn relative z-10"
            >
              <Download className="w-4 h-4" />
              <span>Convert to B&W & Download</span>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="ios-glass rounded-3xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="flex items-center space-x-2 border-b border-black/5 dark:border-white/5 pb-4 relative z-10">
              <Sliders className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Monochrome Mode Style
              </h3>
            </div>

            {/* Mode Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                onClick={() => setFilterMode('grayscale')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  filterMode === 'grayscale'
                    ? 'ios-glass border-zinc-400 dark:border-zinc-500 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Standard Grayscale
                  </span>
                  {filterMode === 'grayscale' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Preserves smooth tonal midtones and original photographic luminance.
                </p>
              </button>

              <button
                onClick={() => setFilterMode('contrast')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  filterMode === 'contrast'
                    ? 'ios-glass border-zinc-400 dark:border-zinc-500 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    High-Contrast B&W
                  </span>
                  {filterMode === 'contrast' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  High contrast thresholding. Optimal for text scans, forms, and receipts.
                </p>
              </button>

              <button
                onClick={() => setFilterMode('sepia')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  filterMode === 'sepia'
                    ? 'ios-glass border-zinc-400 dark:border-zinc-500 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Warm Sepia Tone
                  </span>
                  {filterMode === 'sepia' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Warm antique monochrome tone for portfolio and literary documents.
                </p>
              </button>
            </div>

            {/* Contrast Depth Tick Slider */}
            <div className="p-4 rounded-2xl ios-glass-subtle space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>Luminance & Contrast Scale</span>
                <span className="font-mono text-[11px] text-white/80">
                  {filterMode === 'contrast' ? 'High Contrast (90%)' : filterMode === 'sepia' ? 'Warm Antique (45%)' : 'Balanced (60%)'}
                </span>
              </div>
              <IrisTickSlider
                value={filterMode === 'contrast' ? 90 : filterMode === 'sepia' ? 45 : 60}
                onChange={(val) => {
                  if (val > 75) setFilterMode('contrast');
                  else if (val < 50) setFilterMode('sepia');
                  else setFilterMode('grayscale');
                }}
                min={0}
                max={100}
                minLabel="Warm"
                midLabel="Neutral"
                maxLabel="High Contrast"
                totalTicks={22}
              />
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
