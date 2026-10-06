import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Trash2,
  Copy,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProcessingState, ToastMessage } from '../types';
import {
  getPDFInfo,
  renderBatchThumbnails,
  reorderPDFPages,
  formatFileSize,
  downloadFile
} from '../utils/pdfOperations';
import { DropZone } from './DropZone';

interface PageItem {
  id: string; // unique item id in builder list
  originalIndex: number;
  pageNumber: number;
  thumbnailUrl?: string;
  rotation: number;
}

interface PageReorderToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const PageReorderTool: React.FC<PageReorderToolProps> = ({
  onProcessingChange,
  addToast
}) => {
  const [file, setFile] = useState<{ file: File; arrayBuffer: ArrayBuffer; name: string; size: number } | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [outputFilename, setOutputFilename] = useState('reordered_document.pdf');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileSelected = async (selectedFiles: FileList | File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      addToast({
        type: 'warning',
        title: 'Invalid File',
        message: 'Please upload a valid PDF document.'
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const info = await getPDFInfo(arrayBuffer);

      setFile({
        file: selectedFile,
        arrayBuffer,
        name: selectedFile.name,
        size: selectedFile.size
      });

      const initialPages: PageItem[] = Array.from({ length: info.pageCount }, (_, i) => ({
        id: `page-${i}-${Date.now()}`,
        originalIndex: i,
        pageNumber: i + 1,
        rotation: 0,
        thumbnailUrl: i === 0 ? info.thumbnailUrl : undefined
      }));

      setPages(initialPages);
      setOutputFilename(`${selectedFile.name.replace(/\.pdf$/i, '')}_reordered.pdf`);

      // Asynchronously render page thumbnails with throttled state updates
      const pageIndices = Array.from({ length: info.pageCount }, (_, i) => i);
      let pendingUpdates: Record<number, string> = {};
      let flushTimer: any = null;

      const flush = () => {
        if (Object.keys(pendingUpdates).length === 0) return;
        const updates = { ...pendingUpdates };
        pendingUpdates = {};
        setPages((prev) =>
          prev.map((p) =>
            updates[p.originalIndex] ? { ...p, thumbnailUrl: updates[p.originalIndex] } : p
          )
        );
      };

      renderBatchThumbnails(
        arrayBuffer,
        pageIndices,
        (pageIdx, thumb) => {
          pendingUpdates[pageIdx] = thumb.dataUrl;
          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              flush();
            }, 80);
          }
        },
        { signal: controller.signal, scale: 0.28 }
      ).then(() => {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flush();
      }).catch((e) => {
        if (e?.name !== 'AbortError') {
          console.warn('Batch thumbnail error in reorder:', e);
        }
      });

      addToast({
        type: 'success',
        title: 'PDF Loaded',
        message: `Loaded "${selectedFile.name}" with ${info.pageCount} pages.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to read PDF',
        message: err.message || 'File may be corrupted or password protected.'
      });
    }
  };


  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const duplicatePage = (index: number) => {
    const target = pages[index];
    const newPage: PageItem = {
      ...target,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };

    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    setPages(updated);

    addToast({
      type: 'info',
      title: 'Page Duplicated',
      message: `Duplicated Page #${target.pageNumber}.`
    });
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Cannot delete page',
        message: 'At least 1 page is required in the document.'
      });
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setPages(updated);
  };

  // Drag to reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...pages];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setPages(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Reordering PDF Pages...',
        progress: 10,
        detail: 'Rebuilding pages according to layout...'
      });

      const pageSpecs = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation
      }));

      const pdfBytes = await reorderPDFPages(file.arrayBuffer, pageSpecs, (progress, detail) => {
        onProcessingChange({
          isProcessing: true,
          title: 'Reordering PDF Pages...',
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
        title: 'PDF Saved!',
        message: `Saved "${filename}" with ${pages.length} pages.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'An error occurred while saving reordered PDF.'
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
            <RefreshCw className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Page Reorder & Organizer
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Drag and drop pages to rearrange their sequence, duplicate pages, rotate orientations, or delete unwanted pages from your document.
            </p>
          </div>
        </div>
      </div>

      {!file ? (
        <DropZone
          onFilesSelected={handleFileSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop a PDF file to reorder or organize pages"
          description="Upload a PDF to open the visual page builder"
          id="reorder-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Overview Bar */}
          <div className="ios-glass rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="ios-glass-sheen" />
            <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
              <div className="w-10 h-10 rounded-xl ios-pill flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  <span className="font-mono tabular-nums">{pages.length}</span> pages · <span className="font-mono tabular-nums">{formatFileSize(file.size)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                setFile(null);
                setPages([]);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-xl ios-btn-secondary text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer relative z-10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Choose Different PDF</span>
            </button>
          </div>

          {/* Export Action Bar - Positioned Above PDF Page Grid */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="w-full sm:w-auto space-y-1.5 relative z-10">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Output Filename
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2 text-xs font-medium rounded-xl ios-input text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              id="save-reordered-pdf-btn"
              className="liquid-export-btn relative z-10"
            >
              <Download className="w-4 h-4" />
              <span>Save Reordered PDF ({pages.length} pages)</span>
            </button>
          </div>

          {/* Page Grid Builder */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p, index) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                  draggedIndex === index
                    ? 'border-zinc-400 dark:border-zinc-600 ring-4 ring-black/10 dark:ring-white/20 shadow-2xl bg-zinc-200/50 dark:bg-white/10 scale-[1.01]'
                    : 'ios-glass hover:scale-[1.008] hover:shadow-xl'
                }`}
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Pos <span className="font-mono tabular-nums">#{index + 1}</span>
                    <span className="text-[11px] text-zinc-400 font-normal ml-1 font-mono tabular-nums">
                      (Pg {p.pageNumber})
                    </span>
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => rotatePage(p.id)}
                      className="p-1.5 rounded-lg ios-btn-secondary text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicatePage(index)}
                      className="p-1.5 rounded-lg ios-btn-secondary text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deletePage(p.id)}
                      className="p-1.5 rounded-lg ios-btn-secondary text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Canvas */}
                <div className="aspect-[3/4] ios-glass-subtle rounded-xl overflow-hidden border border-black/5 dark:border-white/10 flex items-center justify-center shadow-inner">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                  ) : (
                    <div className="animate-pulse flex flex-col items-center justify-center text-zinc-400 text-xs">
                      <FileText className="w-6 h-6 mb-1" />
                      <span>Loading...</span>
                    </div>
                  )}
                </div>

                {/* Footer Movement Arrows */}
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                  <button
                    onClick={() => movePage(index, 'left')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg ios-btn-secondary text-zinc-500 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Left</span>
                  </button>

                  {p.rotation !== 0 && (
                    <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      {p.rotation}°
                    </span>
                  )}

                  <button
                    onClick={() => movePage(index, 'right')}
                    disabled={index === pages.length - 1}
                    className="p-1.5 rounded-lg ios-btn-secondary text-zinc-500 hover:text-zinc-800 dark:hover:text-white disabled:opacity-20 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
