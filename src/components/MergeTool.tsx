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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shrink-0 shadow-lg shadow-indigo-500/30 border border-white/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF Merger
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Combine multiple PDF documents into a single organized file. Drag to reorder, select specific page ranges, or rotate orientation before merging.
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={handleFilesSelected}
        acceptTypes=".pdf"
        multiple={true}
        title="Drop your PDF files here to merge"
        description="Select multiple PDF files from your device or drag them in"
        id="merge-dropzone"
      />

      {/* PDF List Section */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Merge Order ({files.length} {files.length === 1 ? 'file' : 'files'})
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Total: {totalPages} pages ({formatFileSize(totalSize)})
              </span>
            </div>

            <button
              onClick={() => setFiles([])}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* List of Files */}
          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <div
                key={fileItem.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl transition-all ${
                  draggedIndex === index
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl bg-indigo-500/10'
                    : 'glass-card hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                
                {/* File Thumbnail & Name */}
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                    #{index + 1}
                  </span>

                  <div className="w-12 h-16 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {fileItem.thumbnailUrl ? (
                      <img
                        src={fileItem.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
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
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{fileItem.pageCount} pages</span>
                      <span>•</span>
                      <span>{formatFileSize(fileItem.size)}</span>
                      {fileItem.rotation ? (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            Rotated {fileItem.rotation}°
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Optional Page Range & Controls */}
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                  
                  {/* Page Range Input */}
                  <div className="flex items-center space-x-1.5" title="Extract specific pages from this file e.g. 1-3, 5">
                    <span className="text-xs text-slate-400 font-medium hidden md:inline">Pages:</span>
                    <input
                      type="text"
                      placeholder={`1-${fileItem.pageCount}`}
                      value={fileItem.pageRange || ''}
                      onChange={(e) => updatePageRange(fileItem.id, e.target.value)}
                      className="w-24 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Rotate Button */}
                  <button
                    onClick={() => rotateFile(fileItem.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Rotate all pages in this file"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Reorder Buttons */}
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Export Settings & Merge Action */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="space-y-1 max-w-xs">
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

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleMerge}
                  id="merge-pdf-btn"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Merge {files.length} PDFs ({totalPages} pages)</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
