export type ToolTab = 'merge' | 'split' | 'grayscale' | 'compress' | 'convert-image' | 'img-to-pdf' | 'reorder';

export type ThemeMode = 'dark' | 'light';

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
