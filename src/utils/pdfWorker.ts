import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(pdfWorkerUrl, window.location.href).href;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
}

export { pdfjsLib };


