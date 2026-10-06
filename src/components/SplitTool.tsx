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
        aspectRatio: 0.75,
        thumbnailUrl: i === 0 ? info.thumbnailUrl : undefined
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
      <div className="ios-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-400/10 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-lg border border-white/20 dark:border-white/40 ring-1 ring-black/5">
            <Scissors className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Split & Extract PDF Pages
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
              Extract specific ranges, split pages into individual PDFs, rotate orientation, or export custom page bundles with instant visual previews.
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
          <div className="ios-glass rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="ios-glass-sheen" />
            <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
              <div className="w-10 h-10 rounded-xl ios-pill flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  <span className="font-mono tabular-nums">{pages.length}</span> total pages · <span className="font-mono tabular-nums">{formatFileSize(file.size)}</span>
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

          {/* Selection Toolbar */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            
            {/* Quick Selection Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Filter className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
                <span>Quick Select:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl ios-btn-secondary text-slate-700 dark:text-slate-200"
                >
                  All
                </button>
                <button
                  onClick={selectOdd}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl ios-btn-secondary text-slate-700 dark:text-slate-200"
                >
                  Odd
                </button>
                <button
                  onClick={selectEven}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl ios-btn-secondary text-slate-700 dark:text-slate-200"
                >
                  Even
                </button>
                <button
                  onClick={invertSelection}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl ios-btn-secondary text-slate-700 dark:text-slate-200"
                >
                  Invert
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl ios-btn-secondary text-slate-700 dark:text-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Range Input & Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-black/5 dark:border-white/5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Range Specification
                </label>
                <input
                  type="text"
                  placeholder='e.g. "1-3, 5, 8-10"'
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl ios-input text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Export Packaging
                </label>
                <div className="p-1 rounded-2xl ios-segmented-trough grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setExportMode('single-pdf')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      exportMode === 'single-pdf'
                        ? 'ios-segmented-active'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Combined PDF
                  </button>
                  <button
                    onClick={() => setExportMode('zip-individual')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      exportMode === 'zip-individual'
                        ? 'ios-segmented-active'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Individual (ZIP)
                  </button>
                </div>
              </div>

            </div>

            {/* Redesigned Export Action Bar - Positioned Above PDF Preview */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Ready to export <span className="font-bold text-zinc-950 dark:text-white font-mono">{selectedCount}</span> of {pages.length} selected pages
              </div>

              <button
                onClick={handleExtract}
                disabled={selectedCount === 0}
                id="extract-pdf-btn-top"
                className="liquid-export-btn"
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

          {/* Page Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Page Previews ({selectedCount} of {pages.length} selected)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {pages.map((p) => (
                <div
                  key={p.pageIndex}
                  className={`group relative rounded-2xl p-2.5 transition-all duration-200 flex flex-col justify-between select-none ${
                    p.selected
                      ? 'ios-glass border-zinc-400 dark:border-zinc-500 ring-2 ring-black/10 dark:ring-white/20 shadow-lg'
                      : 'ios-glass-subtle opacity-60 hover:opacity-100'
                  }`}
                >
                  
                  {/* Page Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => togglePageSelection(p.pageIndex)}
                      className="flex items-center space-x-1.5 focus:outline-none cursor-pointer"
                    >
                      {p.selected ? (
                        <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400" />
                      )}
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
                        Page {p.pageNumber}
                      </span>
                    </button>

                    <button
                      onClick={() => rotatePage(p.pageIndex)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Page Thumbnail Image */}
                  <div
                    onClick={() => togglePageSelection(p.pageIndex)}
                    className="relative aspect-[3/4] ios-glass-subtle rounded-xl overflow-hidden cursor-pointer flex items-center justify-center border border-black/5 dark:border-white/10 shadow-inner group-hover:border-zinc-400/40 dark:group-hover:border-white/30 transition-colors"
                  >
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${p.pageNumber}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <div className="animate-pulse flex flex-col items-center justify-center text-zinc-400 text-[11px]">
                        <FileText className="w-5 h-5 mb-1 opacity-50" />
                        <span>Loading</span>
                      </div>
                    )}

                    {/* Hover Zoom Icon */}
                    {p.thumbnailUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPage({ pageNumber: p.pageNumber, url: p.thumbnailUrl!, rotation: p.rotation });
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Zoom Preview"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Rotation Indicator if rotated */}
                  {p.rotation !== 0 && (
                    <div className="mt-1.5 text-center text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      Rotated {p.rotation}°
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-6 z-20 ios-glass rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/30 dark:border-white/15 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium relative z-10">
              Ready to export <span className="font-bold text-zinc-950 dark:text-white font-mono">{selectedCount}</span> pages
            </div>

            <button
              onClick={handleExtract}
              disabled={selectedCount === 0}
              id="extract-pdf-btn"
              className="liquid-export-btn"
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
