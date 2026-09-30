import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors,
  CheckSquare,
  Square,
  RotateCw,
  Download,
  FileArchive,
  ZoomIn,
  RefreshCw,
  FileText,
  Sliders,
  Filter,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProcessingState, ToastMessage, PDFPageInfo } from '../types';
import {
  getPDFInfo,
  renderBatchThumbnails,
  splitAndExtractPDF,
  parsePageRanges,
  downloadFile,
  formatFileSize
} from '../utils/pdfOperations';
import { DropZone } from './DropZone';
import { PagePreviewModal } from './PagePreviewModal';

interface SplitToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ onProcessingChange, addToast }) => {
  const [file, setFile] = useState<{ file: File; arrayBuffer: ArrayBuffer; name: string; size: number } | null>(null);
  const [pages, setPages] = useState<PDFPageInfo[]>([]);
  const [rangeInput, setRangeInput] = useState('');
  const [exportMode, setExportMode] = useState<'single-pdf' | 'zip-individual'>('single-pdf');
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Zoom preview modal
  const [previewPage, setPreviewPage] = useState<{ pageNumber: number; url: string; rotation: number } | null>(null);

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

    // Cancel any previous ongoing thumbnail generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoadingPages(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const info = await getPDFInfo(arrayBuffer);

      setFile({
        file: selectedFile,
        arrayBuffer,
        name: selectedFile.name,
        size: selectedFile.size
      });

      // Initialize pages structure
      const newPages: PDFPageInfo[] = Array.from({ length: info.pageCount }, (_, i) => ({
        pageIndex: i,
        pageNumber: i + 1,
        rotation: 0,
        selected: true,
        aspectRatio: 0.75
      }));

      setPages(newPages);
      setRangeInput(`1-${info.pageCount}`);

      // Batch thumbnail rendering with throttle to prevent UI freezing
      const pageIndices = Array.from({ length: info.pageCount }, (_, i) => i);
      let pendingUpdates: Record<number, { dataUrl: string; aspectRatio: number }> = {};
      let flushTimer: any = null;

      const flush = () => {
        if (Object.keys(pendingUpdates).length === 0) return;
        const updates = { ...pendingUpdates };
        pendingUpdates = {};
        setPages((prev) =>
          prev.map((p) =>
            updates[p.pageIndex]
              ? { ...p, thumbnailUrl: updates[p.pageIndex].dataUrl, aspectRatio: updates[p.pageIndex].aspectRatio }
              : p
          )
        );
      };

      renderBatchThumbnails(
        arrayBuffer,
        pageIndices,
        (pageIdx, thumb) => {
          pendingUpdates[pageIdx] = thumb;
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
          console.warn('Batch thumbnail rendering finished with warning:', e);
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
        title: 'Failed to load PDF',
        message: err.message || 'The file may be password protected or corrupted.'
      });
    } finally {
      setIsLoadingPages(false);
    }
  };


  const togglePageSelection = (index: number) => {
    setPages((prev) => {
      const updated = prev.map((p) =>
        p.pageIndex === index ? { ...p, selected: !p.selected } : p
      );
      // Update range input representation
      const selectedIndices = updated.filter((p) => p.selected).map((p) => p.pageNumber);
      setRangeInput(formatRangeString(selectedIndices));
      return updated;
    });
  };

  const formatRangeString = (numbers: number[]): string => {
    if (numbers.length === 0) return '';
    numbers.sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = numbers[0];
    let prev = start;

    for (let i = 1; i <= numbers.length; i++) {
      if (i < numbers.length && numbers[i] === prev + 1) {
        prev = numbers[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < numbers.length) {
          start = numbers[i];
          prev = start;
        }
      }
    }
    return ranges.join(', ');
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);

    if (!file) return;
    const selectedIndices = parsePageRanges(val, pages.length);
    const indexSet = new Set(selectedIndices);

    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        selected: indexSet.has(p.pageIndex)
      }))
    );
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageIndex === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  // Quick select helpers
  const selectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
    setRangeInput(`1-${pages.length}`);
  };

  const deselectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
    setRangeInput('');
  };

  const selectEven = () => {
    setPages((prev) => {
      const updated = prev.map((p) => ({ ...p, selected: p.pageNumber % 2 === 0 }));
      setRangeInput(formatRangeString(updated.filter((p) => p.selected).map((p) => p.pageNumber)));
      return updated;
    });
  };

  const selectOdd = () => {
    setPages((prev) => {
      const updated = prev.map((p) => ({ ...p, selected: p.pageNumber % 2 !== 0 }));
      setRangeInput(formatRangeString(updated.filter((p) => p.selected).map((p) => p.pageNumber)));
      return updated;
    });
  };

  const invertSelection = () => {
    setPages((prev) => {
      const updated = prev.map((p) => ({ ...p, selected: !p.selected }));
      setRangeInput(formatRangeString(updated.filter((p) => p.selected).map((p) => p.pageNumber)));
      return updated;
    });
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  const handleExtract = async () => {
    if (!file) return;
    const selectedIndices = pages.filter((p) => p.selected).map((p) => p.pageIndex);

    if (selectedIndices.length === 0) {
      addToast({
        type: 'warning',
        title: 'No pages selected',
        message: 'Please select at least one page to extract.'
      });
      return;
    }

    const rotations = new Map<number, number>();
    pages.forEach((p) => {
      if (p.rotation !== 0) {
        rotations.set(p.pageIndex, p.rotation);
      }
    });

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Extracting PDF Pages...',
        progress: 10,
        detail: 'Processing selected pages and rotations...'
      });

      const { blob, filename } = await splitAndExtractPDF(
        file.arrayBuffer,
        selectedIndices,
        exportMode,
        rotations,
        file.name,
        (progress, detail) => {
          onProcessingChange({
            isProcessing: true,
            title: 'Extracting PDF Pages...',
            progress,
            detail
          });
        }
      );

      downloadFile(blob, filename);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast({
        type: 'success',
        title: 'Extraction Complete!',
        message: `Saved "${filename}" with ${selectedIndices.length} pages.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Extraction Failed',
        message: err.message || 'An error occurred during extraction.'
      });
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-xl shrink-0 shadow-lg shadow-emerald-500/30 border border-white/30">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Page Splitter & Extractor
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Select specific pages or enter a custom page range (e.g., "1-3, 5, 8-10") to extract as a new PDF or download each page as an individual file.
            </p>
          </div>
        </div>
      </div>

      {!file ? (
        <DropZone
          onFilesSelected={handleFileSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop a PDF file to split or extract pages"
          description="Upload a single PDF to view page previews and extract content"
          id="split-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Overview Bar */}
          <div className="glass-card rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pages.length} total pages • {formatFileSize(file.size)}
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
              className="text-xs font-semibold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Choose Different PDF</span>
            </button>
          </div>

          {/* Selection Toolbar */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            
            {/* Quick Selection Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span>Quick Select:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Select All
                </button>
                <button
                  onClick={selectOdd}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Odd Pages
                </button>
                <button
                  onClick={selectEven}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Even Pages
                </button>
                <button
                  onClick={invertSelection}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Invert
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Range Input & Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Range Input
                </label>
                <input
                  type="text"
                  placeholder='e.g. "1-3, 5, 8-10"'
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Export Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportMode('single-pdf')}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      exportMode === 'single-pdf'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    1 Combined PDF
                  </button>
                  <button
                    onClick={() => setExportMode('zip-individual')}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      exportMode === 'zip-individual'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Separate PDFs (ZIP)
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Page Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Page Previews ({selectedCount} of {pages.length} selected)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p) => (
                <div
                  key={p.pageIndex}
                  className={`group relative rounded-2xl border bg-white dark:bg-slate-800 p-2.5 transition-all flex flex-col justify-between ${
                    p.selected
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  
                  {/* Page Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => togglePageSelection(p.pageIndex)}
                      className="flex items-center space-x-1.5 focus:outline-none"
                    >
                      {p.selected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Page {p.pageNumber}
                      </span>
                    </button>

                    <button
                      onClick={() => rotatePage(p.pageIndex)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Page Thumbnail Image */}
                  <div
                    onClick={() => togglePageSelection(p.pageIndex)}
                    className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300"
                  >
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${p.pageNumber}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <div className="animate-pulse flex flex-col items-center justify-center text-slate-400 text-xs">
                        <FileText className="w-6 h-6 mb-1" />
                        <span>Loading...</span>
                      </div>
                    )}

                    {/* Hover Zoom Icon */}
                    {p.thumbnailUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPage({ pageNumber: p.pageNumber, url: p.thumbnailUrl!, rotation: p.rotation });
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Zoom Preview"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Rotation Indicator if rotated */}
                  {p.rotation !== 0 && (
                    <div className="mt-2 text-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Rotated {p.rotation}°
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-6 z-20 glass-card rounded-2xl p-4 shadow-2xl flex items-center justify-between">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Ready to export <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{selectedCount}</span> pages
            </div>

            <button
              onClick={handleExtract}
              disabled={selectedCount === 0}
              id="extract-pdf-btn"
              className="px-6 py-3 rounded-xl glass-btn-primary disabled:opacity-40 text-white font-bold text-sm flex items-center space-x-2 cursor-pointer"
            >
              {exportMode === 'single-pdf' ? (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Extracted PDF ({selectedCount} pages)</span>
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4" />
                  <span>Download Individual PDFs (ZIP)</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* High-res preview modal */}
      {previewPage && (
        <PagePreviewModal
          isOpen={!!previewPage}
          onClose={() => setPreviewPage(null)}
          title={file?.name || 'PDF Preview'}
          thumbnailUrl={previewPage.url}
          pageNumber={previewPage.pageNumber}
          rotation={previewPage.rotation}
          onRotate={() => {
            rotatePage(previewPage.pageNumber - 1);
            setPreviewPage((prev) => prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null);
          }}
        />
      )}

    </div>
  );
};
