import React, { useState } from 'react';
import {
  Zap,
  Trash2,
  Download,
  FileText,
  Sliders,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFFileItem, ProcessingState, ToastMessage } from '../types';
import { getPDFInfo, compressPDF, formatFileSize, downloadFile } from '../utils/pdfOperations';
import { DropZone } from './DropZone';
import { IrisTickSlider } from './IrisTickSlider';

interface CompressToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const CompressTool: React.FC<CompressToolProps> = ({ onProcessingChange, addToast }) => {
  const [pdfFile, setPdfFile] = useState<PDFFileItem | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'recommended' | 'maximum' | 'light'>('recommended');
  const [outputFilename, setOutputFilename] = useState('compressed_document.pdf');
  const [lastResult, setLastResult] = useState<{ originalSize: number; compressedSize: number } | null>(null);

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
      setOutputFilename(`${baseName}_compressed.pdf`);
      setLastResult(null);

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

  const handleCompress = async () => {
    if (!pdfFile) return;

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Compressing PDF...',
        progress: 10,
        detail: 'Optimizing graphics, stream buffers, and encoding...'
      });

      const { pdfBytes, originalSize, compressedSize } = await compressPDF(
        pdfFile.arrayBuffer,
        compressionLevel,
        (progress, detail) => {
          onProcessingChange({
            isProcessing: true,
            title: 'Compressing PDF...',
            progress,
            detail
          });
        }
      );

      const filename = outputFilename.trim().endsWith('.pdf')
        ? outputFilename.trim()
        : `${outputFilename.trim()}.pdf`;

      setLastResult({ originalSize, compressedSize });
      downloadFile(pdfBytes, filename);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      const savedPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      addToast({
        type: 'success',
        title: 'Compression Complete!',
        message: `Reduced size by ${savedPercent}% (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}).`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Compression Failed',
        message: err.message || 'An error occurred during compression.'
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
            <Zap className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Compress PDF Documents
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Shrink large PDF documents while preserving crisp typography and diagram quality. Optimized for email delivery and fast mobile viewing.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone or Selected File */}
      {!pdfFile ? (
        <DropZone
          onFilesSelected={handleFilesSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop PDF to Compress"
          description="Upload a document to optimize embedded images and eliminate stream bloat"
          id="compress-dropzone"
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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-7 h-7 text-zinc-400" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate max-w-sm">
                    {pdfFile.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ios-pill text-zinc-800 dark:text-zinc-200">
                    {pdfFile.pageCount} Pages
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  Original Size: <strong className="text-zinc-700 dark:text-zinc-200 font-mono tabular-nums">{formatFileSize(pdfFile.size)}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPdfFile(null);
                setLastResult(null);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium ios-btn-secondary text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white flex items-center space-x-1.5 self-end md:self-center cursor-pointer relative z-10"
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
              onClick={handleCompress}
              id="compress-pdf-btn"
              className="liquid-export-btn relative z-10"
            >
              <Zap className="w-4 h-4" />
              <span>Compress PDF Now</span>
            </button>
          </div>

          {/* Compression Level Selector */}
          <div className="ios-glass rounded-3xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="flex items-center space-x-2 border-b border-black/5 dark:border-white/5 pb-4 relative z-10">
              <Sliders className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Compression Strength
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                onClick={() => setCompressionLevel('recommended')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  compressionLevel === 'recommended'
                    ? 'ios-glass border-zinc-500 dark:border-zinc-400 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Balanced (Recommended)
                  </span>
                  {compressionLevel === 'recommended' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Best balance of size reduction (40–65%) and high visual clarity.
                </p>
              </button>

              <button
                onClick={() => setCompressionLevel('maximum')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  compressionLevel === 'maximum'
                    ? 'ios-glass border-zinc-500 dark:border-zinc-400 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Maximum Compact
                  </span>
                  {compressionLevel === 'maximum' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Highest reduction (65–85%). Downsamples images for smallest file size.
                </p>
              </button>

              <button
                onClick={() => setCompressionLevel('light')}
                className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  compressionLevel === 'light'
                    ? 'ios-glass border-zinc-500 dark:border-zinc-400 ring-2 ring-black/10 dark:ring-white/20 shadow-xl scale-[1.01]'
                    : 'ios-glass-subtle hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Light Optimization
                  </span>
                  {compressionLevel === 'light' && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                  Light compression (20–40%) while keeping near-lossless high DPI detail.
                </p>
              </button>
            </div>

            {/* Interactive Tick Slider (Matching User Reference Image) */}
            <div className="p-4 rounded-2xl ios-glass-subtle space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-white/90">
                <span>Compression Intensity Scale</span>
                <span className="font-mono text-[11px] text-white/80">
                  {compressionLevel === 'light' ? 'Light (25%)' : compressionLevel === 'recommended' ? 'Balanced (55%)' : 'Maximum (85%)'}
                </span>
              </div>
              <IrisTickSlider
                value={compressionLevel === 'light' ? 25 : compressionLevel === 'recommended' ? 55 : 85}
                onChange={(val) => {
                  if (val < 40) setCompressionLevel('light');
                  else if (val < 70) setCompressionLevel('recommended');
                  else setCompressionLevel('maximum');
                }}
                min={0}
                max={100}
                minLabel="Light"
                midLabel="Balanced"
                maxLabel="Max"
                totalTicks={22}
              />
            </div>

            {/* Savings Result Banner if generated */}
            {lastResult && (
              <div className="p-4 rounded-2xl ios-glass-subtle border border-black/10 dark:border-white/15 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-950 dark:text-white">
                      Compression Summary
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 font-mono tabular-nums">
                      {formatFileSize(lastResult.originalSize)} <ArrowRight className="inline w-3 h-3 mx-1 text-zinc-400" /> {formatFileSize(lastResult.compressedSize)}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm font-mono">
                  Saved {Math.max(0, Math.round(((lastResult.originalSize - lastResult.compressedSize) / lastResult.originalSize) * 100))}%
                </span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
