import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Download,
  Sliders,
  FileText,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Scissors,
  Check,
  Layers,
  Stamp,
  Target,
  Palette,
  Calendar,
  Grid
} from 'lucide-react';
import {
  PDFFileItem,
  ProcessingState,
  ToastMessage,
  PrintFormattingOptions,
  PaperSize,
  PageOrientation,
  PageScaleMode,
  MarginPreset,
  PageNumberPosition,
  PageNumberFormat,
  PrintColorMode,
  DuplexMode,
  PageSubset
} from '../types';
import {
  getPDFInfo,
  renderPageThumbnail,
  formatPDFForPrinting,
  printPDFBlob,
  downloadFile,
  formatFileSize,
  STANDARD_PAPER_SIZES
} from '../utils/pdfOperations';
import { DropZone } from './DropZone';

interface PrintToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const PrintTool: React.FC<PrintToolProps> = ({
  onProcessingChange,
  addToast
}) => {
  const [file, setFile] = useState<PDFFileItem | null>(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<Record<number, string>>({});
  const [outputFilename, setOutputFilename] = useState<string>('print_ready.pdf');
  const [activeConfigTab, setActiveConfigTab] = useState<'layout' | 'margins' | 'stamp' | 'marks'>('layout');

  // Print Formatting Settings State
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [customWidthMm, setCustomWidthMm] = useState<number>(210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(297);
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [scaleMode, setScaleMode] = useState<PageScaleMode>('fit');
  const [nupBorders, setNupBorders] = useState<boolean>(true);

  // Pages & Duplex
  const [pageRangeStr, setPageRangeStr] = useState<string>('');
  const [pageSubset, setPageSubset] = useState<PageSubset>('all');
  const [reverseOrder, setReverseOrder] = useState<boolean>(false);
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('simplex');
  const [mirrorGutters, setMirrorGutters] = useState<boolean>(false);

  // Margins & Gutter
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [customMarginMm, setCustomMarginMm] = useState<number>(12.7);
  const [bindingGutterMm, setBindingGutterMm] = useState<number>(0);

  // Headers, Footers & Bates
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberPosition>('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState<PageNumberFormat>('page-x-of-y');
  const [startPageNumber, setStartPageNumber] = useState<number>(1);
  const [batesPrefix, setBatesPrefix] = useState<string>('BATES-');
  const [headerLeft, setHeaderLeft] = useState<string>('');
  const [headerCenter, setHeaderCenter] = useState<string>('');
  const [headerRight, setHeaderRight] = useState<string>('');
  const [footerLeft, setFooterLeft] = useState<string>('');
  const [footerRight, setFooterRight] = useState<string>('');

  // Watermark
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [watermarkColor, setWatermarkColor] = useState<'gray' | 'red' | 'blue'>('gray');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.15);

  // Color & Prepress
  const [colorMode, setColorMode] = useState<PrintColorMode>('color');
  const [cropMarks, setCropMarks] = useState<boolean>(false);
  const [registrationMarks, setRegistrationMarks] = useState<boolean>(false);
  const [colorBars, setColorBars] = useState<boolean>(false);

  // Quick Presets
  const applyPreset = (preset: 'standard' | 'booklet' | 'handout4' | 'legal' | 'prepress') => {
    switch (preset) {
      case 'standard':
        setPaperSize('a4');
        setScaleMode('fit');
        setMarginPreset('normal');
        setBindingGutterMm(0);
        setMirrorGutters(false);
        setCropMarks(false);
        setRegistrationMarks(false);
        setColorBars(false);
        setPageNumberPosition('bottom-center');
        setPageNumberFormat('page-x-of-y');
        break;
      case 'booklet':
        setPaperSize('a4');
        setScaleMode('nup2');
        setNupBorders(true);
        setOrientation('landscape');
        setMarginPreset('normal');
        setBindingGutterMm(15);
        setMirrorGutters(true);
        setDuplexMode('duplex-long');
        setPageNumberPosition('bottom-center');
        setPageNumberFormat('page-x-of-y');
        break;
      case 'handout4':
        setPaperSize('a4');
        setScaleMode('nup4');
        setNupBorders(true);
        setOrientation('portrait');
        setMarginPreset('narrow');
        setBindingGutterMm(0);
        setPageNumberPosition('bottom-right');
        setPageNumberFormat('page-x-of-y');
        break;
      case 'legal':
        setPaperSize('legal');
        setScaleMode('shrink');
        setMarginPreset('normal');
        setBindingGutterMm(12);
        setPageNumberPosition('bates');
        setPageNumberFormat('bates');
        setBatesPrefix('CASE-');
        setHeaderLeft(file ? file.name : 'CONTRACT');
        setHeaderRight(new Date().toISOString().split('T')[0]);
        break;
      case 'prepress':
        setPaperSize('a3');
        setScaleMode('fit');
        setMarginPreset('wide');
        setCropMarks(true);
        setRegistrationMarks(true);
        setColorBars(true);
        setHeaderCenter('PRESS PRODUCTION PROOF');
        break;
    }
    addToast({
      type: 'info',
      title: 'Print Preset Applied',
      message: `Configured settings for "${preset.toUpperCase()}" workflow.`
    });
  };

  const mmToPt = (mm: number) => mm * 2.83465;

  const getMarginPoints = () => {
    switch (marginPreset) {
      case 'none':
        return { top: 0, bottom: 0, left: 0, right: 0 };
      case 'narrow':
        return { top: mmToPt(6.35), bottom: mmToPt(6.35), left: mmToPt(6.35), right: mmToPt(6.35) };
      case 'wide':
        return { top: mmToPt(25.4), bottom: mmToPt(25.4), left: mmToPt(25.4), right: mmToPt(25.4) };
      case 'custom':
        return {
          top: mmToPt(customMarginMm),
          bottom: mmToPt(customMarginMm),
          left: mmToPt(customMarginMm),
          right: mmToPt(customMarginMm)
        };
      case 'normal':
      default:
        return { top: mmToPt(12.7), bottom: mmToPt(12.7), left: mmToPt(12.7), right: mmToPt(12.7) };
    }
  };

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    try {
      const buffer = await selectedFile.arrayBuffer();
      const info = await getPDFInfo(buffer);

      const newItem: PDFFileItem = {
        id: Math.random().toString(36).substring(2, 9),
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
        pageCount: info.pageCount,
        arrayBuffer: buffer,
        thumbnailUrl: info.thumbnailUrl
      };

      setFile(newItem);
      setCurrentSheetIndex(0);
      setPageThumbnails({ 1: info.thumbnailUrl });
      setOutputFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_print_ready.pdf');

      addToast({
        type: 'success',
        title: 'PDF Loaded for Print Preparation',
        message: `Loaded "${selectedFile.name}" with ${info.pageCount} pages.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to read PDF',
        message: err.message || 'The PDF file could not be parsed.'
      });
    }
  };

  // Calculate filtered pages list based on range, odd/even, reverse
  const activePageNumbers = useMemo(() => {
    if (!file) return [];
    let list = Array.from({ length: file.pageCount }, (_, i) => i + 1);

    if (pageRangeStr && pageRangeStr.trim()) {
      const parts = pageRangeStr.split(/[,;\s]+/);
      const set = new Set<number>();
      for (const p of parts) {
        if (p.includes('-')) {
          const [s, e] = p.split('-').map(Number);
          if (!isNaN(s) && !isNaN(e)) {
            for (let k = Math.min(s, e); k <= Math.max(s, e); k++) {
              if (k >= 1 && k <= file.pageCount) set.add(k);
            }
          }
        } else {
          const num = Number(p);
          if (!isNaN(num) && num >= 1 && num <= file.pageCount) set.add(num);
        }
      }
      list = Array.from(set).sort((a, b) => a - b);
    }

    if (pageSubset === 'odd') {
      list = list.filter((n) => n % 2 !== 0);
    } else if (pageSubset === 'even') {
      list = list.filter((n) => n % 2 === 0);
    }

    if (reverseOrder) {
      list = [...list].reverse();
    }

    return list;
  }, [file, pageRangeStr, pageSubset, reverseOrder]);

  // Total sheets calculated according to N-Up
  const totalSheets = useMemo(() => {
    if (activePageNumbers.length === 0) return 1;
    if (scaleMode === 'nup4') return Math.ceil(activePageNumbers.length / 4);
    if (scaleMode === 'nup2') return Math.ceil(activePageNumbers.length / 2);
    return activePageNumbers.length;
  }, [activePageNumbers, scaleMode]);

  // Load preview thumbnails for current sheet
  useEffect(() => {
    if (!file || activePageNumbers.length === 0) return;

    let targetPages: number[] = [];
    if (scaleMode === 'nup4') {
      const start = currentSheetIndex * 4;
      targetPages = activePageNumbers.slice(start, start + 4);
    } else if (scaleMode === 'nup2') {
      const start = currentSheetIndex * 2;
      targetPages = activePageNumbers.slice(start, start + 2);
    } else {
      if (activePageNumbers[currentSheetIndex]) {
        targetPages = [activePageNumbers[currentSheetIndex]];
      }
    }

    for (const pageNum of targetPages) {
      if (!pageThumbnails[pageNum]) {
        renderPageThumbnail(file.arrayBuffer, pageNum - 1, 0.4)
          .then((res) => {
            setPageThumbnails((prev) => ({ ...prev, [pageNum]: res.dataUrl }));
          })
          .catch((e) => console.warn(e));
      }
    }
  }, [file, currentSheetIndex, activePageNumbers, scaleMode, pageThumbnails]);

  const compilePrintOptions = (): PrintFormattingOptions => {
    return {
      paperSize,
      customPaperWidthMm: customWidthMm,
      customPaperHeightMm: customHeightMm,
      orientation,
      scaleMode,
      nupBorders,
      pageRangeStr,
      pageSubset,
      reverseOrder,
      duplexMode,
      marginPreset,
      margins: getMarginPoints(),
      bindingGutter: mmToPt(bindingGutterMm),
      mirrorGutters,
      pageNumberPosition,
      pageNumberFormat,
      startPageNumber,
      batesPrefix,
      headerLeft,
      headerCenter,
      headerRight,
      footerLeft,
      footerRight,
      watermarkText,
      watermarkOpacity,
      watermarkColor,
      colorMode,
      cropMarks,
      registrationMarks,
      colorBars
    };
  };

  const handleGeneratePrintPDF = async (): Promise<Uint8Array | null> => {
    if (!file) return null;

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Preparing Print Layout...',
        progress: 10,
        detail: 'Calculating paper dimensions, imposition, and printable safe zones...'
      });

      const options = compilePrintOptions();
      const formattedBytes = await formatPDFForPrinting(file.arrayBuffer, options, (pct, detail) => {
        onProcessingChange({
          isProcessing: true,
          title: 'Formatting PDF for Printing...',
          progress: pct,
          detail
        });
      });

      return formattedBytes;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Print Formatting Error',
        message: err.message || 'An error occurred while formatting the PDF.'
      });
      return null;
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  const handleDownloadPDF = async () => {
    const formattedBytes = await handleGeneratePrintPDF();
    if (formattedBytes) {
      downloadFile(formattedBytes, outputFilename);
      addToast({
        type: 'success',
        title: 'Print-Ready PDF Downloaded',
        message: `Saved formatted document as "${outputFilename}".`
      });
    }
  };

  const handleDirectPrint = async () => {
    const formattedBytes = await handleGeneratePrintPDF();
    if (formattedBytes) {
      addToast({
        type: 'info',
        title: 'Opening Print Dialog',
        message: 'Sending formatted pages directly to your system print dialog...'
      });
      printPDFBlob(formattedBytes);
    }
  };

  // Preview paper aspect ratio
  const getPaperAspect = () => {
    let w = 210;
    let h = 297;
    if (paperSize === 'letter') { w = 215.9; h = 279.4; }
    if (paperSize === 'legal') { w = 215.9; h = 355.6; }
    if (paperSize === 'a3') { w = 297; h = 420; }
    if (paperSize === 'tabloid') { w = 279.4; h = 431.8; }
    if (paperSize === 'a5') { w = 148; h = 210; }
    if (paperSize === 'custom') { w = customWidthMm; h = customHeightMm; }

    if (orientation === 'landscape' || scaleMode === 'nup2') {
      return `${Math.max(w, h)} / ${Math.min(w, h)}`;
    }
    return `${Math.min(w, h)} / ${Math.max(w, h)}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Intro Banner */}
      <div className="ios-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-md border border-black/10 dark:border-white">
              <Printer className="w-6 h-6 text-current" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Professional Print Studio & Page Imposition
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                Pre-press layout engine with N-Up imposition, duplex bookbinding gutters, Bates stamping, watermarks, crop marks, and ink optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Pro Workflow Presets */}
        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center gap-2 relative z-10">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">
            Quick Presets:
          </span>
          {[
            { id: 'standard', label: 'Office Standard' },
            { id: 'booklet', label: 'Booklet / 2-Up Duplex' },
            { id: 'handout4', label: '4-Up Handouts' },
            { id: 'legal', label: 'Legal / Bates Stamp' },
            { id: 'prepress', label: 'Commercial Press Marks' }
          ].map((pre) => (
            <button
              key={pre.id}
              onClick={() => applyPreset(pre.id as any)}
              className="px-3 py-1 rounded-full ios-btn-secondary text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
            >
              {pre.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Drop Zone if no file loaded */}
      {!file && (
        <DropZone
          onFilesSelected={handleFileSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop a PDF to configure professional printing"
          description="Upload document to configure sheets, N-Up imposition, gutters, and press marks"
          id="print-dropzone"
        />
      )}

      {file && (
        <div className="space-y-6">
          
          {/* File Header Bar with Preflight Stats */}
          <div className="ios-glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-current" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                  {file.name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  <span>{file.pageCount} source pages</span>
                  <span>·</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{totalSheets} output sheets</span>
                  <span>·</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPageThumbnails({});
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold ios-btn-secondary text-zinc-900 dark:text-white flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Change Document</span>
            </button>
          </div>

          {/* Export & Print Action Bar (Positioned ABOVE Preview with Liquid Glass Button) */}
          <div className="ios-glass rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />

            <div className="space-y-1.5 w-full sm:w-80 relative z-10">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Target Print File Name
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl ios-input text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto relative z-10">
              <button
                onClick={handleDirectPrint}
                id="direct-print-btn"
                className="liquid-export-btn w-full sm:w-auto cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Directly (System Dialog)</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                id="download-print-pdf-btn"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full ios-btn-secondary text-zinc-950 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Print-Ready PDF</span>
              </button>
            </div>
          </div>

          {/* Two-Column Professional Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Categorized Printing Tool Panels (7 Columns) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Category Segmented Navigation */}
              <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/10 border border-zinc-200 dark:border-white/20 shadow-sm overflow-x-auto">
                {[
                  { id: 'layout', label: 'Paper & Imposition', icon: <Grid className="w-3.5 h-3.5" /> },
                  { id: 'margins', label: 'Margins & Gutters', icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { id: 'stamp', label: 'Bates & Watermarks', icon: <Stamp className="w-3.5 h-3.5" /> },
                  { id: 'marks', label: 'Press Marks & Ink', icon: <Target className="w-3.5 h-3.5" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveConfigTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                      activeConfigTab === tab.id
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md font-bold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Panel 1: Paper & Imposition */}
              {activeConfigTab === 'layout' && (
                <div className="space-y-4">
                  {/* Paper Sizes */}
                  <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
                    <div className="ios-glass-sheen" />
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Target Paper Dimensions
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'a4', label: 'A4', sub: '210 × 297 mm' },
                        { id: 'letter', label: 'Letter', sub: '8.5 × 11 in' },
                        { id: 'legal', label: 'Legal', sub: '8.5 × 14 in' },
                        { id: 'a3', label: 'A3', sub: '297 × 420 mm' },
                        { id: 'tabloid', label: 'Tabloid', sub: '11 × 17 in' },
                        { id: 'a5', label: 'A5', sub: '148 × 210 mm' },
                        { id: 'original', label: 'Original', sub: 'Keep PDF Size' },
                        { id: 'custom', label: 'Custom', sub: 'Manual mm' }
                      ].map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setPaperSize(size.id as PaperSize)}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            paperSize === size.id
                              ? 'ios-glass border-zinc-400 dark:border-zinc-500 ring-2 ring-black/10 dark:ring-white/20 shadow-sm'
                              : 'ios-glass-subtle hover:scale-[1.01]'
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-950 dark:text-white">{size.label}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{size.sub}</p>
                        </button>
                      ))}
                    </div>

                    {paperSize === 'custom' && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Width (mm)</label>
                          <input
                            type="number"
                            value={customWidthMm}
                            onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Height (mm)</label>
                          <input
                            type="number"
                            value={customHeightMm}
                            onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                        Orientation
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'auto', label: 'Auto (Per Page)' },
                          { id: 'portrait', label: 'Portrait' },
                          { id: 'landscape', label: 'Landscape' }
                        ].map((ori) => (
                          <button
                            key={ori.id}
                            onClick={() => setOrientation(ori.id as PageOrientation)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                              orientation === ori.id
                                ? 'ios-segmented-active'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {ori.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Page Imposition (N-Up) & Scale */}
                  <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
                    <div className="ios-glass-sheen" />
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Imposition & Scaling
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'fit', label: '1-Up (Fit Margin)', sub: 'Scale to area' },
                        { id: 'shrink', label: 'Shrink Oversized', sub: 'Only if large' },
                        { id: 'actual', label: '100% Actual Size', sub: 'No scaling' },
                        { id: 'nup2', label: '2-Up Booklet', sub: '2 pages/sheet' },
                        { id: 'nup4', label: '4-Up Handout', sub: '2×2 grid' }
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => setScaleMode(sc.id as PageScaleMode)}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            scaleMode === sc.id
                              ? 'ios-segmented-active'
                              : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-950 dark:text-white">{sc.label}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{sc.sub}</p>
                        </button>
                      ))}
                    </div>

                    {(scaleMode === 'nup2' || scaleMode === 'nup4') && (
                      <div className="pt-2 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="nup-borders-toggle"
                          checked={nupBorders}
                          onChange={(e) => setNupBorders(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                        />
                        <label htmlFor="nup-borders-toggle" className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                          Draw thin separating boundary frames around each page
                        </label>
                      </div>
                    )}

                    {/* Page Range & Subsets */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                            Page Range (e.g. 1-5, 8)
                          </label>
                          <input
                            type="text"
                            placeholder="All pages (e.g. 1-10)"
                            value={pageRangeStr}
                            onChange={(e) => setPageRangeStr(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                            Page Subset (Duplex Prep)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'all', label: 'All' },
                              { id: 'odd', label: 'Odd (Front)' },
                              { id: 'even', label: 'Even (Back)' }
                            ].map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => setPageSubset(sub.id as PageSubset)}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  pageSubset === sub.id
                                    ? 'ios-segmented-active'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id="reverse-order-toggle"
                          checked={reverseOrder}
                          onChange={(e) => setReverseOrder(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                        />
                        <label htmlFor="reverse-order-toggle" className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                          Reverse print sequence (prints back-to-front for face-up output trays)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel 2: Margins & Gutters */}
              {activeConfigTab === 'margins' && (
                <div className="space-y-4">
                  <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
                    <div className="ios-glass-sheen" />
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Printable Safe Margins
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'normal', label: 'Normal (0.5")', sub: '12.7 mm' },
                        { id: 'narrow', label: 'Narrow (0.25")', sub: '6.4 mm' },
                        { id: 'wide', label: 'Wide (1.0")', sub: '25.4 mm' },
                        { id: 'none', label: 'Borderless', sub: '0 mm edge-to-edge' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMarginPreset(m.id as MarginPreset)}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            marginPreset === m.id
                              ? 'ios-segmented-active'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-950 dark:text-white">{m.label}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.sub}</p>
                        </button>
                      ))}
                    </div>

                    {/* Bookbinding Hole-Punch Gutter */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Binding Gutter (Offset for Ring Binders / Coils)</span>
                        </label>
                        <span className="text-xs font-mono font-bold text-zinc-950 dark:text-white">
                          {bindingGutterMm} mm
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 0, label: '0 mm' },
                          { val: 10, label: '10 mm (3-Ring)' },
                          { val: 15, label: '15 mm (Spiral)' },
                          { val: 20, label: '20 mm (Thick)' }
                        ].map((g) => (
                          <button
                            key={g.val}
                            onClick={() => setBindingGutterMm(g.val)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              bindingGutterMm === g.val
                                ? 'ios-segmented-active'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>

                      {bindingGutterMm > 0 && (
                        <div className="pt-2 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="mirror-gutters-toggle"
                            checked={mirrorGutters}
                            onChange={(e) => setMirrorGutters(e.target.checked)}
                            className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                          />
                          <label htmlFor="mirror-gutters-toggle" className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                            Mirror margins on even pages (Alternating inside margin for double-sided booklet binding)
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Panel 3: Bates, Stamps & Watermarks */}
              {activeConfigTab === 'stamp' && (
                <div className="space-y-4">
                  <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
                    <div className="ios-glass-sheen" />
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
                      <Stamp className="w-4 h-4" />
                      <span>Bates Numbering & Headers/Footers</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Numbering Style
                        </label>
                        <select
                          value={pageNumberFormat}
                          onChange={(e) => setPageNumberFormat(e.target.value as PageNumberFormat)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl ios-input"
                        >
                          <option value="page-x-of-y">Page 1 of {file.pageCount}</option>
                          <option value="x-of-y">1 / {file.pageCount}</option>
                          <option value="bates">Legal Bates Stamp (PREFIX-000001)</option>
                          <option value="dash-num">- 1 -</option>
                          <option value="num-only">1</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Position
                        </label>
                        <select
                          value={pageNumberPosition}
                          onChange={(e) => setPageNumberPosition(e.target.value as PageNumberPosition)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl ios-input"
                        >
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="none">Disabled</option>
                        </select>
                      </div>

                      {pageNumberFormat === 'bates' && (
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                            Bates Prefix
                          </label>
                          <input
                            type="text"
                            value={batesPrefix}
                            onChange={(e) => setBatesPrefix(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input font-mono"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          Starting Number
                        </label>
                        <input
                          type="number"
                          value={startPageNumber}
                          onChange={(e) => setStartPageNumber(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs rounded-xl ios-input font-mono"
                        />
                      </div>
                    </div>

                    {/* Header & Footer Custom Text Zones */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Header & Footer Running Text
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Header Left</label>
                          <input
                            type="text"
                            placeholder="e.g. Document Title"
                            value={headerLeft}
                            onChange={(e) => setHeaderLeft(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Header Right / Date</label>
                          <div className="flex space-x-1.5">
                            <input
                              type="text"
                              placeholder="e.g. Date or Department"
                              value={headerRight}
                              onChange={(e) => setHeaderRight(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl ios-input"
                            />
                            <button
                              onClick={() => setHeaderRight(new Date().toLocaleDateString())}
                              className="p-1.5 rounded-lg ios-btn-secondary"
                              title="Insert Today's Date"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diagonal Watermark */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Diagonal Security Watermark
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="e.g. CONFIDENTIAL, DRAFT, COPY, REVIEW"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl ios-input"
                          />
                        </div>
                        <div className="flex space-x-1">
                          {(['gray', 'red', 'blue'] as const).map((col) => (
                            <button
                              key={col}
                              onClick={() => setWatermarkColor(col)}
                              className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                watermarkColor === col ? 'ios-segmented-active' : 'text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel 4: Press Marks & Ink */}
              {activeConfigTab === 'marks' && (
                <div className="space-y-4">
                  <div className="ios-glass rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
                    <div className="ios-glass-sheen" />
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Commercial Press Marks & Toner Optimization</span>
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          id="press-crop-marks"
                          checked={cropMarks}
                          onChange={(e) => setCropMarks(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="press-crop-marks" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer block">
                            Trim / Crop Marks (L-Marks at Sheet Margins)
                          </label>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Guides for precision guillotine paper cutters and edge trimming.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          id="press-registration-marks"
                          checked={registrationMarks}
                          onChange={(e) => setRegistrationMarks(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="press-registration-marks" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer block">
                            Registration Targets
                          </label>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Center alignment crosshairs for double-sided registration and press plates.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          id="press-color-bars"
                          checked={colorBars}
                          onChange={(e) => setColorBars(e.target.checked)}
                          className="w-4 h-4 rounded text-zinc-900 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="press-color-bars" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer block">
                            Calibration Density Bars (CMYK / Grayscale Slugs)
                          </label>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Densitometer step wedges printed in margin margin slug for print quality check.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Color / Toner Optimization */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                      <label className="text-xs font-bold text-zinc-900 dark:text-white block">
                        Toner & Ink Conservation
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'color', label: 'Full Color', sub: 'Original density' },
                          { id: 'grayscale', label: 'Monochrome', sub: 'Black toner only' },
                          { id: 'toner-save', label: 'Draft Eco', sub: 'Save 40% ink' }
                        ].map((cm) => (
                          <button
                            key={cm.id}
                            onClick={() => setColorMode(cm.id as PrintColorMode)}
                            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              colorMode === cm.id ? 'ios-segmented-active' : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <p className="text-xs font-bold text-zinc-950 dark:text-white">{cm.label}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{cm.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Interactive Real-Time Sheet Simulation Preview (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="ios-glass rounded-3xl p-5 sm:p-6 relative overflow-hidden">
                <div className="ios-glass-sheen" />
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Sheet {currentSheetIndex + 1} of {totalSheets}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      {scaleMode === 'nup4' ? '4 pages per sheet' : scaleMode === 'nup2' ? '2 pages per sheet' : '1 page per sheet'}
                      {mirrorGutters && currentSheetIndex % 2 === 1 ? ' · Verso (Back)' : ' · Recto (Front)'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentSheetIndex((p) => Math.max(0, p - 1))}
                      disabled={currentSheetIndex === 0}
                      className="p-1.5 rounded-lg ios-btn-secondary text-zinc-900 dark:text-white disabled:opacity-30 cursor-pointer shadow-sm"
                      title="Previous Sheet"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white px-1">
                      {currentSheetIndex + 1} / {totalSheets}
                    </span>
                    <button
                      onClick={() => setCurrentSheetIndex((p) => Math.min(totalSheets - 1, p + 1))}
                      disabled={currentSheetIndex >= totalSheets - 1}
                      className="p-1.5 rounded-lg ios-btn-secondary text-zinc-900 dark:text-white disabled:opacity-30 cursor-pointer shadow-sm"
                      title="Next Sheet"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Realistic Paper Sheet Canvas Simulation */}
                <div className="flex items-center justify-center p-3 sm:p-4 bg-black/5 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/10 shadow-inner">
                  <div
                    className="relative bg-white text-zinc-950 shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between transition-all duration-300 w-full max-w-[320px]"
                    style={{ aspectRatio: getPaperAspect() }}
                  >
                    
                    {/* Header Left, Center, Right in Preview */}
                    <div className="absolute top-2 inset-x-3 flex items-center justify-between text-[8px] font-medium text-zinc-700 pointer-events-none z-10">
                      <span className="truncate max-w-[30%]">{headerLeft}</span>
                      <span className="font-bold truncate max-w-[40%] text-center">{headerCenter}</span>
                      <span className="truncate max-w-[30%] text-right">{headerRight}</span>
                    </div>

                    {/* Left/Right Binding Gutter Indicator Stripe */}
                    {bindingGutterMm > 0 && (
                      <div
                        className={`absolute inset-y-0 bg-amber-400/25 border-dashed border-amber-500/70 flex items-center justify-center z-10 pointer-events-none ${
                          mirrorGutters && currentSheetIndex % 2 === 1 ? 'right-0 border-l' : 'left-0 border-r'
                        }`}
                        style={{ width: `${Math.min(28, (bindingGutterMm / 210) * 100)}%` }}
                        title="Binding / Punch-Hole Safe Gutter"
                      >
                        <span className="text-[7.5px] font-bold uppercase tracking-widest text-amber-800 rotate-90 select-none opacity-80 whitespace-nowrap">
                          Gutter
                        </span>
                      </div>
                    )}

                    {/* Printable Safe Margins (Dashed border inside paper) */}
                    {(() => {
                      const baseMarginPx = marginPreset === 'none' ? 0 : marginPreset === 'narrow' ? 8 : marginPreset === 'wide' ? 22 : 13;
                      const gutterOffsetPx = Math.min(28, (bindingGutterMm / 210) * 100);
                      const isEven = currentSheetIndex % 2 === 1;
                      const leftPx = baseMarginPx + (bindingGutterMm > 0 && (!mirrorGutters || !isEven) ? gutterOffsetPx : 0);
                      const rightPx = baseMarginPx + (bindingGutterMm > 0 && mirrorGutters && isEven ? gutterOffsetPx : 0);

                      return (
                        <div
                          className="absolute inset-0 border border-dashed border-zinc-400/40 pointer-events-none z-10"
                          style={{
                            marginTop: `${baseMarginPx}px`,
                            marginBottom: `${baseMarginPx}px`,
                            marginLeft: `${leftPx}px`,
                            marginRight: `${rightPx}px`
                          }}
                        />
                      );
                    })()}

                    {/* Diagonal Watermark Preview */}
                    {watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none overflow-hidden">
                        <span
                          className={`text-xl font-black uppercase rotate-45 tracking-widest ${
                            watermarkColor === 'red' ? 'text-red-500/20' : watermarkColor === 'blue' ? 'text-blue-500/20' : 'text-zinc-600/20'
                          }`}
                        >
                          {watermarkText}
                        </span>
                      </div>
                    )}

                    {/* Embedded Pages Grid Content */}
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden relative">
                      {scaleMode === 'nup4' ? (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full p-2">
                          {[0, 1, 2, 3].map((slot) => {
                            const pNum = activePageNumbers[currentSheetIndex * 4 + slot];
                            return (
                              <div
                                key={slot}
                                className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                                  nupBorders ? 'border border-zinc-300' : ''
                                }`}
                              >
                                {pNum && pageThumbnails[pNum] ? (
                                  <img
                                    src={pageThumbnails[pNum]}
                                    alt={`Page ${pNum}`}
                                    className={`max-w-full max-h-full object-contain ${
                                      colorMode === 'grayscale' || colorMode === 'toner-save' ? 'grayscale contrast-110' : ''
                                    }`}
                                  />
                                ) : (
                                  <span className="text-[9px] text-zinc-400">{pNum ? `P.${pNum}` : ''}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : scaleMode === 'nup2' ? (
                        <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                          {[0, 1].map((slot) => {
                            const pNum = activePageNumbers[currentSheetIndex * 2 + slot];
                            return (
                              <div
                                key={slot}
                                className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                                  nupBorders ? 'border border-zinc-300' : ''
                                }`}
                              >
                                {pNum && pageThumbnails[pNum] ? (
                                  <img
                                    src={pageThumbnails[pNum]}
                                    alt={`Page ${pNum}`}
                                    className={`max-w-full max-h-full object-contain ${
                                      colorMode === 'grayscale' || colorMode === 'toner-save' ? 'grayscale contrast-110' : ''
                                    }`}
                                  />
                                ) : (
                                  <span className="text-[9px] text-zinc-400">{pNum ? `P.${pNum}` : ''}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {activePageNumbers[currentSheetIndex] && pageThumbnails[activePageNumbers[currentSheetIndex]] ? (
                            <img
                              src={pageThumbnails[activePageNumbers[currentSheetIndex]]}
                              alt={`Page ${activePageNumbers[currentSheetIndex]}`}
                              className={`max-w-full max-h-full object-contain shadow-sm ${
                                colorMode === 'grayscale' || colorMode === 'toner-save' ? 'grayscale contrast-110' : ''
                              }`}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-zinc-400 text-xs">
                              <FileText className="w-8 h-8 mb-2 opacity-50 animate-pulse" />
                              <span>Loading Page...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Stamps & Page Numbering in Preview */}
                    <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[8px] font-mono font-bold text-zinc-700 pointer-events-none z-10">
                      <span>{footerLeft}</span>
                      <span className="text-center">
                        {pageNumberPosition !== 'none' && (
                          pageNumberFormat === 'bates'
                            ? `${batesPrefix}${String(currentSheetIndex + startPageNumber).padStart(6, '0')}`
                            : pageNumberFormat === 'page-x-of-y'
                            ? `Page ${currentSheetIndex + startPageNumber} of ${totalSheets + startPageNumber - 1}`
                            : `${currentSheetIndex + startPageNumber}`
                        )}
                      </span>
                      <span>{footerRight}</span>
                    </div>

                    {/* Corner Crop Marks Visualization */}
                    {cropMarks && (
                      <>
                        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-zinc-500 pointer-events-none" />
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-zinc-500 pointer-events-none" />
                        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-zinc-500 pointer-events-none" />
                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-zinc-500 pointer-events-none" />
                      </>
                    )}

                    {/* Registration Target Crosshairs */}
                    {registrationMarks && (
                      <>
                        <div className="absolute top-0.5 inset-x-0 flex justify-center pointer-events-none">
                          <div className="w-2.5 h-2.5 rounded-full border border-zinc-600 flex items-center justify-center">
                            <div className="w-1.5 h-0.5 bg-zinc-600" />
                          </div>
                        </div>
                        <div className="absolute bottom-0.5 inset-x-0 flex justify-center pointer-events-none">
                          <div className="w-2.5 h-2.5 rounded-full border border-zinc-600 flex items-center justify-center">
                            <div className="w-1.5 h-0.5 bg-zinc-600" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Calibration Density Color Bar */}
                    {colorBars && (
                      <div className="absolute bottom-0.5 inset-x-6 flex items-center justify-center space-x-0.5 pointer-events-none z-20">
                        <div className="w-2 h-1 bg-black" />
                        <div className="w-2 h-1 bg-zinc-600" />
                        <div className="w-2 h-1 bg-zinc-400" />
                        <div className="w-2 h-1 bg-cyan-400" />
                        <div className="w-2 h-1 bg-fuchsia-400" />
                        <div className="w-2 h-1 bg-yellow-400" />
                      </div>
                    )}

                  </div>
                </div>

                {/* Preflight Summary Info */}
                <div className="mt-3 p-3 rounded-2xl ios-glass-subtle space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Paper Format</span>
                    <span className="font-mono font-bold text-zinc-950 dark:text-white uppercase">{paperSize} ({orientation})</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Imposition Setup</span>
                    <span className="font-mono text-zinc-950 dark:text-white">{scaleMode} · {nupBorders ? 'Framed' : 'Borderless'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Print Duplex Margin</span>
                    <span className="font-mono text-zinc-950 dark:text-white">
                      {bindingGutterMm > 0 ? `${bindingGutterMm}mm ${mirrorGutters ? '(Mirrored)' : ''}` : 'Standard'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
