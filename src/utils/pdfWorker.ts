import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs-dist
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Set worker source to unpkg CDN matching installed pdfjs-dist version
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export { pdfjsLib };
