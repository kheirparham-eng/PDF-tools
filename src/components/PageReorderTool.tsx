import React, { useState } from 'react';
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
  renderPageThumbnail,
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
        rotation: 0
      }));

      setPages(initialPages);
      setOutputFilename(`${selectedFile.name.replace(/\.pdf$/i, '')}_reordered.pdf`);

      // Asynchronously render page thumbnails
      renderThumbnails(arrayBuffer, initialPages);

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

  const renderThumbnails = async (arrayBuffer: ArrayBuffer, pageList: PageItem[]) => {
    for (let i = 0; i < pageList.length; i++) {
      try {
        const thumb = await renderPageThumbnail(arrayBuffer, pageList[i].originalIndex, 0.4);
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageList[i].id ? { ...p, thumbnailUrl: thumb.dataUrl } : p
          )
        );
      } catch (e) {
        console.error(`Error rendering page ${i + 1}`, e);
      }
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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-orange-600 text-white rounded-xl shrink-0 shadow-lg shadow-amber-500/30 border border-white/30">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Page Reorder & Organizer
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current page count: {pages.length} pages • {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPages([]);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 text-slate-600 dark:text-slate-300 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Choose Different PDF</span>
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
                className={`group p-3 rounded-2xl border bg-white dark:bg-slate-800 transition-all flex flex-col justify-between ${
                  draggedIndex === index
                    ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pos #{index + 1}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (Pg {p.pageNumber})
                    </span>
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => rotatePage(p.id)}
                      className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicatePage(index)}
                      className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deletePage(p.id)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Canvas */}
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                  ) : (
                    <div className="animate-pulse flex flex-col items-center justify-center text-slate-400 text-xs">
                      <FileText className="w-6 h-6 mb-1" />
                      <span>Loading...</span>
                    </div>
                  )}
                </div>

                {/* Footer Movement Arrows */}
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => movePage(index, 'left')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Left</span>
                  </button>

                  {p.rotation !== 0 && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {p.rotation}°
                    </span>
                  )}

                  <button
                    onClick={() => movePage(index, 'right')}
                    disabled={index === pages.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 flex items-center space-x-1"
                  >
                    <span>Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Bottom Controls Bar */}
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Output Filename
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs font-semibold rounded-xl glass-input text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              id="save-reordered-pdf-btn"
              className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save Reordered PDF ({pages.length} pages)</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
