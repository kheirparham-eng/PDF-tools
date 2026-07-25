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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shrink-0 shadow-lg shadow-amber-500/20 border border-white/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Compress PDF File Size
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Shrink large PDF documents while preserving crisp text and layout quality. Ideal for email attachments, upload portals, and mobile bandwidth saving.
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
          description="Upload a PDF file to optimize images and eliminate size bloat"
          id="compress-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="w-16 h-20 rounded-xl bg-slate-900/10 dark:bg-slate-900/60 border border-white/30 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                {pdfFile.thumbnailUrl ? (
                  <img
                    src={pdfFile.thumbnailUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-8 h-8 text-slate-500" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm">
                    {pdfFile.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {pdfFile.pageCount} Pages
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Original Size: <strong className="text-slate-800 dark:text-slate-200">{formatFileSize(pdfFile.size)}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPdfFile(null);
                setLastResult(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center space-x-1.5 self-end md:self-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Change PDF</span>
            </button>
          </div>

          {/* Compression Level Selector */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Compression Level
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setCompressionLevel('recommended')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  compressionLevel === 'recommended'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Recommended
                  </span>
                  {compressionLevel === 'recommended' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Best balance of size reduction (40-65%) and high visual clarity.
                </p>
              </button>

              <button
                onClick={() => setCompressionLevel('maximum')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  compressionLevel === 'maximum'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Extreme Compression
                  </span>
                  {compressionLevel === 'maximum' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Maximum file size reduction (65-85%). Slight drop in photo detail.
                </p>
              </button>

              <button
                onClick={() => setCompressionLevel('light')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  compressionLevel === 'light'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Less Compression
                  </span>
                  {compressionLevel === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Light size optimization (20-40%) while keeping ultra-sharp images.
                </p>
              </button>
            </div>

            {/* Savings Result Banner if generated */}
            {lastResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Compression Summary
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {formatFileSize(lastResult.originalSize)} <ArrowRight className="inline w-3 h-3 mx-1" /> {formatFileSize(lastResult.compressedSize)}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                  Saved {Math.max(0, Math.round(((lastResult.originalSize - lastResult.compressedSize) / lastResult.originalSize) * 100))}%
                </span>
              </div>
            )}

            {/* Filename & Compress Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="space-y-1 w-full sm:w-80">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Output Filename
                </label>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleCompress}
                id="compress-pdf-btn"
                className="glass-btn-primary px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Compress PDF Now</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
