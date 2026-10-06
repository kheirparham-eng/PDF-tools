export type ToolTab = 'dashboard' | 'merge' | 'split' | 'grayscale' | 'compress' | 'convert-image' | 'img-to-pdf' | 'reorder' | 'print';

export type ThemeMode = 'dark' | 'light';

export type PaperSize = 'a4' | 'letter' | 'legal' | 'a3' | 'tabloid' | 'a5' | 'custom' | 'original';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type PageScaleMode = 'fit' | 'shrink' | 'actual' | 'nup2' | 'nup4';
export type MarginPreset = 'normal' | 'narrow' | 'wide' | 'none' | 'custom';
export type PageNumberPosition = 'none' | 'bottom-center' | 'bottom-right' | 'top-center' | 'top-right' | 'bates';
export type PageNumberFormat = 'page-x-of-y' | 'x-of-y' | 'num-only' | 'dash-num' | 'bates';
export type PrintColorMode = 'color' | 'grayscale' | 'toner-save';
export type DuplexMode = 'simplex' | 'duplex-long' | 'duplex-short';
export type PageSubset = 'all' | 'odd' | 'even';

export interface PrintFormattingOptions {
  paperSize: PaperSize;
  customPaperWidthMm?: number;
  customPaperHeightMm?: number;
  orientation: PageOrientation;
  scaleMode: PageScaleMode;
  nupBorders: boolean;
  pageRangeStr?: string;
  pageSubset: PageSubset;
  reverseOrder: boolean;
  duplexMode: DuplexMode;
  marginPreset: MarginPreset;
  margins: {
    top: number; // in points (1 in = 72 pt, 1 mm = ~2.83 pt)
    bottom: number;
    left: number;
    right: number;
  };
  bindingGutter: number; // in points
  mirrorGutters: boolean; // Alternates left/right gutter for duplex bookbinding
  pageNumberPosition: PageNumberPosition;
  pageNumberFormat: PageNumberFormat;
  startPageNumber: number;
  batesPrefix: string;
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerRight: string;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkColor: 'gray' | 'red' | 'blue';
  colorMode: PrintColorMode;
  cropMarks: boolean;
  registrationMarks: boolean;
  colorBars: boolean;
}

export interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  arrayBuffer: ArrayBuffer;
  thumbnailUrl?: string;
  error?: string;
  pageRange?: string; // Optional page range e.g. "1-5" when merging specific parts
  rotation?: number; // 0, 90, 180, 270
}

export interface PDFPageInfo {
  pageIndex: number; // 0-based
  pageNumber: number; // 1-based
  thumbnailUrl?: string;
  rotation: number; // original + added rotation
  selected: boolean;
  aspectRatio: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  title: string;
  progress: number; // 0 to 100
  detail?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface ImageToPdfItem {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  width: number;
  height: number;
  rotation: number;
}
