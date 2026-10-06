import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

// Ensure globalThis.pdfjsWorker and window.pdfjsWorker are set immediately
// so PDF.js can execute the worker message handler directly on the main thread
// with zero network requests, zero iframe sandbox restrictions, and zero dynamic import errors.
if (typeof window !== 'undefined') {
  (window as any).pdfjsWorker = pdfjsWorker;
  (globalThis as any).pdfjsWorker = pdfjsWorker;

  if (pdfjsLib.GlobalWorkerOptions) {
    try {
      // Point to static worker in public directory on current origin
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', window.location.href).href;
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }
}

export { pdfjsLib };


