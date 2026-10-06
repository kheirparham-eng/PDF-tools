import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Download,
  FileText,
  Plus,
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFFileItem, ProcessingState, ToastMessage } from '../types';
import { getPDFInfo, mergePDFs, formatFileSize, downloadFile } from '../utils/pdfOperations';
import { DropZone } from './DropZone';

interface MergeToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const MergeTool: React.FC<MergeToolProps> = ({ onProcessingChange, addToast }) => {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [outputFilename, setOutputFilename] = useState('merged_document.pdf');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const newItems: PDFFileItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        addToast({
          type: 'warning',
          title: 'Skipped invalid file',
          message: `"${file.name}" is not a PDF document.`
        });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const info = await getPDFInfo(arrayBuffer);

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount: info.pageCount,
          arrayBuffer,
          thumbnailUrl: info.thumbnailUrl,
          rotation: 0
        });
      } catch (err: any) {
        addToast({
          type: 'error',
          title: `Error reading "${file.name}"`,
          message: err.message || 'File may be corrupted or password protected.'
        });
      }
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      addToast({
        type: 'success',
        title: `Added ${newItems.length} PDF ${newItems.length === 1 ? 'file' : 'files'}`
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFiles(updated);
  };

  const rotateFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextRot = ((f.rotation || 0) + 90) % 360;
          return { ...f, rotation: nextRot };
        }
        return f;
      })
    );
  };

  const updatePageRange = (id: string, range: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, pageRange: range } : f))
    );
  };

  // Drag to reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...files];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setFiles(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleMerge = async () => {
    if (files.length === 0) {
      addToast({ type: 'warning', title: 'No PDFs added', message: 'Please upload at least 1 PDF file to merge.' });
      return;
    }

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Merging PDFs...',
        progress: 10,
        detail: 'Combining documents and pages...'
      });

      const pdfBytes = await mergePDFs(files, (progress, detail) => {
        onProcessingChange({
          isProcessing: true,
          title: 'Merging PDFs...',
          progress,
          detail
        });
      });

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
        title: 'Merge Complete!',
        message: `Successfully created "${filename}". Download started.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Merge Failed',
        message: err.message || 'An error occurred while merging PDFs.'
      });
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="ios-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-400/10 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-lg border border-white/20 dark:border-white/40 ring-1 ring-black/5">
            <Layers className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Merge PDF Documents
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Combine multiple PDF documents into a single unified file. Drag files to reorder, configure specific page ranges, or rotate orientation before merging.
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={handleFilesSelected}
        acceptTypes=".pdf"
        multiple={true}
        title="Drop PDF files to merge"
        description="Select multiple documents from your device or drag them here"
        id="merge-dropzone"
      />

      {/* PDF List Section */}
      {files.length > 0 && (
        <div className="space-y-4">

          {/* Export Settings & Merge Action - Positioned Above PDF Queue/Preview */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              
              <div className="space-y-1.5 max-w-xs w-full">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Filename
                </label>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl ios-input text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <button
                  onClick={handleMerge}
                  id="merge-pdf-btn"
                  className="liquid-export-btn shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Merge {files.length} PDFs ({totalPages} pages)</span>
                </button>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Queue ({files.length} {files.length === 1 ? 'file' : 'files'})
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ios-pill text-zinc-800 dark:text-zinc-200">
                {totalPages} pages · {formatFileSize(totalSize)}
              </span>
            </div>

            <button
              onClick={() => setFiles([])}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* List of Files */}
          <div className="space-y-2.5">
            {files.map((fileItem, index) => (
              <div
                key={fileItem.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                  draggedIndex === index
                    ? 'border-zinc-400 dark:border-zinc-600 ring-4 ring-black/10 dark:ring-white/20 shadow-2xl bg-zinc-200/50 dark:bg-white/10 scale-[1.01]'
                    : 'ios-glass hover:scale-[1.004] hover:shadow-xl'
                }`}
              >
                
                {/* File Thumbnail & Name */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500 w-5 text-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="w-12 h-16 rounded-xl ios-glass-subtle overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                    {fileItem.thumbnailUrl ? (
                      <img
                        src={fileItem.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover transition-transform duration-200"
                        style={{ transform: `rotate(${fileItem.rotation || 0}deg)` }}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                      {fileItem.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      <span className="font-mono tabular-nums">{fileItem.pageCount} pages</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{formatFileSize(fileItem.size)}</span>
                      {fileItem.rotation ? (
                        <>
                          <span>·</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold font-mono">
                            {fileItem.rotation}°
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Optional Page Range & Controls */}
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                  
                  {/* Page Range Input */}
                  <div className="flex items-center space-x-1.5" title="Extract specific pages from this file e.g. 1-3, 5">
                    <span className="text-xs text-slate-400 font-normal hidden md:inline">Pages:</span>
                    <input
                      type="text"
                      placeholder={`1-${fileItem.pageCount}`}
                      value={fileItem.pageRange || ''}
                      onChange={(e) => updatePageRange(fileItem.id, e.target.value)}
                      className="w-24 px-2.5 py-1 text-xs rounded-xl ios-input font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Rotate Button */}
                  <button
                    onClick={() => rotateFile(fileItem.id)}
                    className="p-2 rounded-xl ios-btn-secondary text-slate-600 dark:text-slate-300"
                    title="Rotate all pages in this file"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Reorder Buttons */}
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-xl ios-btn-secondary text-slate-600 dark:text-slate-300 disabled:opacity-25 disabled:pointer-events-none"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-2 rounded-xl ios-btn-secondary text-slate-600 dark:text-slate-300 disabled:opacity-25 disabled:pointer-events-none"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="p-2 rounded-xl ios-btn-secondary text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
