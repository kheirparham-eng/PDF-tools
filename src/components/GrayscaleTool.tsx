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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-slate-800 to-slate-900 text-white rounded-xl shrink-0 shadow-lg shadow-slate-900/20 border border-white/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Grayscale / B&W Converter
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Convert full-color PDF documents into crisp black & white or grayscale. Reduces toner costs for printing, improves readability, and gives documents a sleek monochrome finish.
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
          title="Drop PDF to Convert to Grayscale / B&W"
          description="Select a PDF file to strip color data and apply monochrome filters"
          id="grayscale-dropzone"
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
                    className="w-full h-full object-cover filter grayscale"
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
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {pdfFile.pageCount} pages • {formatFileSize(pdfFile.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setPdfFile(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center space-x-1.5 self-end md:self-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Change PDF</span>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monochrome Mode Options
              </h3>
            </div>

            {/* Mode Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setFilterMode('grayscale')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  filterMode === 'grayscale'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Standard Grayscale
                  </span>
                  {filterMode === 'grayscale' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preserves smooth tonal shades and original document balance.
                </p>
              </button>

              <button
                onClick={() => setFilterMode('contrast')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  filterMode === 'contrast'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    High Contrast B&W
                  </span>
                  {filterMode === 'contrast' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pure black and white threshold. Ideal for scanned text and invoices.
                </p>
              </button>

              <button
                onClick={() => setFilterMode('sepia')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  filterMode === 'sepia'
                    ? 'bg-indigo-600/15 border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Vintage Sepia
                  </span>
                  {filterMode === 'sepia' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Warm antique monochrome tone for artistic documents.
                </p>
              </button>
            </div>

            {/* Filename & Submit */}
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
                onClick={handleConvert}
                id="convert-grayscale-btn"
                className="glass-btn-primary px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Convert to B&W & Download</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
