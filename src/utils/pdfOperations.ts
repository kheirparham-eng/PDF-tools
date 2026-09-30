import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import { pdfjsLib } from './pdfWorker';
import { PDFFileItem, ImageToPdfItem } from '../types';

/**
 * Format bytes to readable size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Cooperative yield to browser event loop to prevent UI freezing,
 * allow garbage collection, and keep rendering responsive.
 */
export function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Convert canvas to Blob using standard Promise wrapper (avoids base64 strings)
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob from canvas'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Parse string like "1-3, 5, 8-10" into 0-based page indices array
 */
export function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);

      if (isNaN(start)) start = 1;
      if (isNaN(end)) end = totalPages;

      // Clamp values
      start = Math.max(1, Math.min(start, totalPages));
      end = Math.max(1, Math.min(end, totalPages));

      if (start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      } else {
        for (let i = start; i >= end; i--) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Safe document loader helper for pdfjs-dist.
 * Always clones the buffer slice so pdfjs Web Worker postMessage
 * never detaches the original ArrayBuffer in the caller thread.
 * Configures CMaps and standard font directories for international character support.
 */
export function getPdfjsDocument(
  source: ArrayBuffer | Uint8Array,
  extraOptions?: Record<string, any>
) {
  const bufferSlice =
    source instanceof ArrayBuffer
      ? source.slice(0)
      : source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);

  return pdfjsLib.getDocument({
    data: new Uint8Array(bufferSlice),
    stopAtErrors: false,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/standard_fonts/`,
    ...extraOptions
  });
}

/**
 * Get basic info and 1st page thumbnail for an uploaded PDF without detaching ArrayBuffer
 */
export async function getPDFInfo(arrayBuffer: ArrayBuffer): Promise<{ pageCount: number; thumbnailUrl: string }> {
  let pdfDoc: any = null;
  let page: any = null;
  const canvas = document.createElement('canvas');

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    // Render page 1 thumbnail at small scale for fast preview
    page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.25 });

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    const context = canvas.getContext('2d', { willReadFrequently: false });
    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    }

    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.75);
    return { pageCount, thumbnailUrl };
  } catch (error: any) {
    console.error('Failed to get PDF info:', error);
    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password protected or encrypted. Please unlock it before processing.');
    }
    throw new Error(error?.message || 'Failed to read PDF file. The document may be corrupted or invalid.');
  } finally {
    // Explicitly release memory
    if (page) {
      try { page.cleanup(); } catch { /* ignore */ }
    }
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Render single page thumbnail
 */
export async function renderPageThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number,
  scale: number = 0.35
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  let pdfDoc: any = null;
  let page: any = null;
  const canvas = document.createElement('canvas');

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;
    page = await pdfDoc.getPage(pageIndex + 1);

    const viewport = page.getViewport({ scale });
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    const context = canvas.getContext('2d', { willReadFrequently: false });
    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    const aspectRatio = viewport.width / viewport.height;

    return { dataUrl, width: viewport.width, height: viewport.height, aspectRatio };
  } finally {
    if (page) {
      try { page.cleanup(); } catch { /* ignore */ }
    }
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Highly optimized batch thumbnail renderer for large PDFs.
 * Loads the document ONCE and reuses canvas, yielding back to the event loop.
 */
export async function renderBatchThumbnails(
  arrayBuffer: ArrayBuffer,
  pageIndices: number[],
  onThumbnail: (pageIndex: number, thumb: { dataUrl: string; aspectRatio: number }) => void,
  options?: {
    scale?: number;
    signal?: AbortSignal;
    quality?: number;
  }
): Promise<void> {
  let pdfDoc: any = null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: false });
  const scale = options?.scale ?? 0.28;
  const quality = options?.quality ?? 0.72;

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;

    for (let i = 0; i < pageIndices.length; i++) {
      if (options?.signal?.aborted) {
        break;
      }

      const pageIdx = pageIndices[i];
      let page: any = null;

      try {
        page = await pdfDoc.getPage(pageIdx + 1);
        const viewport = page.getViewport({ scale });

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const aspectRatio = viewport.width / viewport.height;
          onThumbnail(pageIdx, { dataUrl, aspectRatio });
        }
      } catch (pageErr) {
        console.warn(`Could not render thumbnail for page ${pageIdx + 1}`, pageErr);
      } finally {
        if (page) {
          try { page.cleanup(); } catch { /* ignore */ }
        }
      }

      // Yield every page so UI stays completely responsive and GC can reclaim memory
      await yieldToMainThread();
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Merge multiple PDF file items into a single PDF Uint8Array.
 * Optimized with useObjectStreams: false and sequential processing to avoid OOM.
 */
export async function mergePDFs(
  files: PDFFileItem[],
  onProgress?: (progress: number, detail: string) => void
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('No PDF files selected for merging.');
  }

  const mergedPdf = await PDFDocument.create();
  const totalFiles = files.length;

  for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
    const fileItem = files[fileIdx];
    if (onProgress) {
      onProgress(
        Math.round((fileIdx / totalFiles) * 80),
        `Processing "${fileItem.name}" (${fileIdx + 1}/${totalFiles})...`
      );
    }

    let srcPdf: PDFDocument;
    try {
      srcPdf = await PDFDocument.load(new Uint8Array(fileItem.arrayBuffer), { ignoreEncryption: false });
    } catch {
      throw new Error(`Failed to load "${fileItem.name}". File may be encrypted or corrupted.`);
    }

    const totalSrcPages = srcPdf.getPageCount();
    let pageIndicesToCopy: number[];

    if (fileItem.pageRange && fileItem.pageRange.trim()) {
      pageIndicesToCopy = parsePageRanges(fileItem.pageRange, totalSrcPages);
    } else {
      pageIndicesToCopy = Array.from({ length: totalSrcPages }, (_, i) => i);
    }

    if (pageIndicesToCopy.length > 0) {
      // Copy pages in chunks to keep memory footprint bounded
      const CHUNK_SIZE = 50;
      for (let c = 0; c < pageIndicesToCopy.length; c += CHUNK_SIZE) {
        const slice = pageIndicesToCopy.slice(c, c + CHUNK_SIZE);
        const copiedPages = await mergedPdf.copyPages(srcPdf, slice);

        for (const page of copiedPages) {
          if (fileItem.rotation) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + fileItem.rotation) % 360));
          }
          mergedPdf.addPage(page);
        }

        await yieldToMainThread();
      }
    }

    await yieldToMainThread();
  }

  if (onProgress) {
    onProgress(90, 'Generating combined PDF document...');
  }

  // useObjectStreams: false minimizes memory allocation overhead on large documents
  const pdfBytes = await mergedPdf.save({ useObjectStreams: false });

  if (onProgress) {
    onProgress(100, 'Merge completed successfully!');
  }

  return pdfBytes;
}

/**
 * Extract selected pages from PDF into a new PDF or individual PDFs in ZIP
 */
export async function splitAndExtractPDF(
  arrayBuffer: ArrayBuffer,
  selectedPageIndices: number[],
  mode: 'single-pdf' | 'zip-individual',
  rotations: Map<number, number>,
  originalFilename: string,
  onProgress?: (progress: number, detail: string) => void
): Promise<{ blob: Blob; filename: string }> {
  if (selectedPageIndices.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  const srcPdf = await PDFDocument.load(new Uint8Array(arrayBuffer), { ignoreEncryption: false });
  const baseName = originalFilename.replace(/\.pdf$/i, '');

  if (mode === 'single-pdf') {
    if (onProgress) onProgress(30, 'Creating extracted PDF document...');

    const newPdf = await PDFDocument.create();
    
    // Copy in chunks for memory safety
    const CHUNK_SIZE = 50;
    for (let c = 0; c < selectedPageIndices.length; c += CHUNK_SIZE) {
      const chunk = selectedPageIndices.slice(c, c + CHUNK_SIZE);
      const copiedPages = await newPdf.copyPages(srcPdf, chunk);

      copiedPages.forEach((page, idx) => {
        const pageIndex = chunk[idx];
        const extraRot = rotations.get(pageIndex) || 0;
        if (extraRot !== 0) {
          const curRot = page.getRotation().angle;
          page.setRotation(degrees((curRot + extraRot) % 360));
        }
        newPdf.addPage(page);
      });

      await yieldToMainThread();
    }

    if (onProgress) onProgress(80, 'Finalizing extracted PDF...');
    const pdfBytes = await newPdf.save({ useObjectStreams: false });
    if (onProgress) onProgress(100, 'Done!');

    return {
      blob: new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
      filename: `${baseName}_extracted.pdf`
    };
  } else {
    // Export each page as individual PDF packed into ZIP
    const zip = new JSZip();
    const total = selectedPageIndices.length;

    for (let i = 0; i < total; i++) {
      const pageIdx = selectedPageIndices[i];
      if (onProgress) {
        onProgress(
          Math.round((i / total) * 80),
          `Extracting page ${pageIdx + 1} (${i + 1}/${total})...`
        );
      }

      const singlePdf = await PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(srcPdf, [pageIdx]);

      const extraRot = rotations.get(pageIdx) || 0;
      if (extraRot !== 0) {
        const curRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((curRot + extraRot) % 360));
      }

      singlePdf.addPage(copiedPage);
      const pdfBytes = await singlePdf.save({ useObjectStreams: false });
      zip.file(`${baseName}_page_${pageIdx + 1}.pdf`, pdfBytes);

      // Yield after each single PDF so memory is freed
      await yieldToMainThread();
    }

    if (onProgress) onProgress(90, 'Compressing ZIP archive...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 4 }
    });
    if (onProgress) onProgress(100, 'Done!');

    return {
      blob: zipBlob,
      filename: `${baseName}_split_pages.zip`
    };
  }
}

/**
 * Convert PDF pages to images (PNG or JPEG) using direct Blob generation to prevent OOM
 */
export async function convertPDFToImages(
  arrayBuffer: ArrayBuffer,
  selectedPageIndices: number[],
  format: 'png' | 'jpeg',
  qualityScale: number, // e.g., 1.5 or 2.0
  originalFilename: string,
  onProgress?: (progress: number, detail: string) => void
): Promise<{ images: Array<{ pageNumber: number; dataUrl: string; blob: Blob; filename: string }>; zipBlob?: Blob }> {
  if (selectedPageIndices.length === 0) {
    throw new Error('No pages selected for image conversion.');
  }

  let pdfDoc: any = null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: false });

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;
    const baseName = originalFilename.replace(/\.pdf$/i, '');
    const total = selectedPageIndices.length;

    const resultImages: Array<{ pageNumber: number; dataUrl: string; blob: Blob; filename: string }> = [];
    const zip = new JSZip();

    // Clamp qualityScale to avoid canvas memory explosions
    const safeScale = Math.min(qualityScale, 2.0);

    for (let i = 0; i < total; i++) {
      const pageIdx = selectedPageIndices[i];
      const pageNumber = pageIdx + 1;

      if (onProgress) {
        onProgress(
          Math.round((i / total) * 85),
          `Rendering page ${pageNumber} as image (${i + 1}/${total})...`
        );
      }

      let page: any = null;
      try {
        page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: safeScale });

        // Clamp maximum pixel dimension to 3200px
        let renderWidth = viewport.width;
        let renderHeight = viewport.height;
        let renderScale = safeScale;
        const maxDim = Math.max(renderWidth, renderHeight);

        if (maxDim > 3200) {
          const ratio = 3200 / maxDim;
          renderScale = safeScale * ratio;
          const adjustedViewport = page.getViewport({ scale: renderScale });
          renderWidth = adjustedViewport.width;
          renderHeight = adjustedViewport.height;
        }

        canvas.width = Math.floor(renderWidth);
        canvas.height = Math.floor(renderHeight);

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: page.getViewport({ scale: renderScale }),
            canvas: canvas
          }).promise;
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';
        const filename = `${baseName}_page_${pageNumber}.${extension}`;

        // Direct toBlob conversion - does NOT allocate giant base64 strings
        const blob = await canvasToBlob(canvas, mimeType, format === 'jpeg' ? 0.88 : undefined);
        const objectUrl = URL.createObjectURL(blob);

        resultImages.push({ pageNumber, dataUrl: objectUrl, blob, filename });
        zip.file(filename, blob);
      } finally {
        if (page) {
          try { page.cleanup(); } catch { /* ignore */ }
        }
      }

      await yieldToMainThread();
    }

    let zipBlob: Blob | undefined = undefined;
    if (resultImages.length > 1) {
      if (onProgress) onProgress(92, 'Generating images ZIP archive...');
      zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 4 }
      });
    }

    if (onProgress) onProgress(100, 'Image conversion completed!');

    return { images: resultImages, zipBlob };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Convert selected images to a merged PDF file with memory optimization
 */
export async function convertImagesToPDF(
  images: ImageToPdfItem[],
  pageSizeOption: 'fit' | 'a4',
  margin: number,
  onProgress?: (progress: number, detail: string) => void
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('No images uploaded for PDF conversion.');
  }

  const pdfDoc = await PDFDocument.create();
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const imgItem = images[i];
    if (onProgress) {
      onProgress(
        Math.round((i / total) * 85),
        `Adding image ${i + 1}/${total} ("${imgItem.name}")...`
      );
    }

    const arrayBuffer = await imgItem.file.arrayBuffer();
    const fileType = imgItem.file.type.toLowerCase();

    let embeddedImg;
    if (fileType.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let pageWidth = imgWidth + margin * 2;
    let pageHeight = imgHeight + margin * 2;
    let renderWidth = imgWidth;
    let renderHeight = imgHeight;
    let xPos = margin;
    let yPos = margin;

    if (pageSizeOption === 'a4') {
      pageWidth = 595.28;
      pageHeight = 841.89;

      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      renderWidth = imgWidth * scale;
      renderHeight = imgHeight * scale;

      xPos = (pageWidth - renderWidth) / 2;
      yPos = (pageHeight - renderHeight) / 2;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImg, {
      x: xPos,
      y: yPos,
      width: renderWidth,
      height: renderHeight
    });

    await yieldToMainThread();
  }

  if (onProgress) onProgress(95, 'Saving final PDF document...');
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  if (onProgress) onProgress(100, 'Images converted to PDF!');

  return pdfBytes;
}

/**
 * Reorder, rotate, delete, or duplicate pages within a PDF
 */
export async function reorderPDFPages(
  arrayBuffer: ArrayBuffer,
  pageOrderWithRotation: Array<{ originalIndex: number; rotation: number }>,
  onProgress?: (progress: number, detail: string) => void
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(new Uint8Array(arrayBuffer), { ignoreEncryption: false });
  const newPdf = await PDFDocument.create();

  const total = pageOrderWithRotation.length;
  for (let i = 0; i < total; i++) {
    const item = pageOrderWithRotation[i];
    if (onProgress) {
      onProgress(
        Math.round((i / total) * 85),
        `Processing page ${i + 1} of ${total}...`
      );
    }

    const [copiedPage] = await newPdf.copyPages(srcPdf, [item.originalIndex]);

    if (item.rotation) {
      const curRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((curRot + item.rotation) % 360));
    }

    newPdf.addPage(copiedPage);

    if (i % 10 === 0) {
      await yieldToMainThread();
    }
  }

  if (onProgress) onProgress(95, 'Generating reordered PDF...');
  const pdfBytes = await newPdf.save({ useObjectStreams: false });
  if (onProgress) onProgress(100, 'Reorder complete!');

  return pdfBytes;
}

/**
 * Convert PDF pages to Grayscale / Black & White safely without memory bloat
 */
export async function convertToGrayscalePDF(
  arrayBuffer: ArrayBuffer,
  mode: 'grayscale' | 'contrast' | 'sepia' = 'grayscale',
  onProgress?: (progress: number, detail: string) => void
): Promise<Uint8Array> {
  let pdfDoc: any = null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const newPdf = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(
          Math.round(((pageNum - 1) / numPages) * 85),
          `Converting page ${pageNum} of ${numPages} to B&W...`
        );
      }

      let page: any = null;
      try {
        page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate clamped scale so canvas never exceeds 2048px dimension
        const maxDimension = Math.max(unscaledViewport.width, unscaledViewport.height);
        const targetScale = Math.min(1.5, 2048 / Math.max(1, maxDimension));
        const viewport = page.getViewport({ scale: targetScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise;

          // In-place pixel manipulation
          const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (mode === 'grayscale') {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            } else if (mode === 'contrast') {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const bw = gray > 140 ? 255 : 0;
              data[i] = bw;
              data[i + 1] = bw;
              data[i + 2] = bw;
            } else if (mode === 'sepia') {
              const sr = 0.393 * r + 0.769 * g + 0.189 * b;
              const sg = 0.349 * r + 0.686 * g + 0.168 * b;
              const sb = 0.272 * r + 0.534 * g + 0.131 * b;
              data[i] = Math.min(255, sr);
              data[i + 1] = Math.min(255, sg);
              data[i + 2] = Math.min(255, sb);
            }
          }

          context.putImageData(imgData, 0, 0);
        }

        // Direct blob -> arrayBuffer without base64 string allocations
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
        const jpegBytes = await blob.arrayBuffer();

        const embeddedImage = await newPdf.embedJpg(jpegBytes);
        const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: unscaledViewport.width,
          height: unscaledViewport.height
        });
      } finally {
        if (page) {
          try { page.cleanup(); } catch { /* ignore */ }
        }
      }

      await yieldToMainThread();
    }

    if (onProgress) onProgress(92, 'Generating B&W PDF file...');
    const pdfBytes = await newPdf.save({ useObjectStreams: false });
    if (onProgress) onProgress(100, 'Grayscale conversion complete!');

    return pdfBytes;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Compress PDF document size by optimizing images and encoding with bounded resolution
 */
export async function compressPDF(
  arrayBuffer: ArrayBuffer,
  level: 'recommended' | 'maximum' | 'light' = 'recommended',
  onProgress?: (progress: number, detail: string) => void
): Promise<{ pdfBytes: Uint8Array; originalSize: number; compressedSize: number }> {
  const originalSize = arrayBuffer.byteLength;
  let pdfDoc: any = null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: false });

  try {
    const loadingTask = getPdfjsDocument(arrayBuffer);
    pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const newPdf = await PDFDocument.create();

    let targetMaxDim = 1800;
    let baseScale = 1.25;
    let jpegQuality = 0.68;

    if (level === 'maximum') {
      targetMaxDim = 1400;
      baseScale = 1.0;
      jpegQuality = 0.50;
    } else if (level === 'light') {
      targetMaxDim = 2200;
      baseScale = 1.5;
      jpegQuality = 0.80;
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(
          Math.round(((pageNum - 1) / numPages) * 85),
          `Optimizing page ${pageNum} of ${numPages}...`
        );
      }

      let page: any = null;
      try {
        page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate clamped scale so giant posters or CAD drawings don't exhaust RAM
        const maxDimension = Math.max(unscaledViewport.width, unscaledViewport.height);
        const scale = Math.min(baseScale, targetMaxDim / Math.max(1, maxDimension));
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise;
        }

        // Direct toBlob -> arrayBuffer avoids gigabytes of base64 string allocations
        const blob = await canvasToBlob(canvas, 'image/jpeg', jpegQuality);
        const jpegBytes = await blob.arrayBuffer();

        const embeddedImage = await newPdf.embedJpg(jpegBytes);
        const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: unscaledViewport.width,
          height: unscaledViewport.height
        });
      } finally {
        if (page) {
          try { page.cleanup(); } catch { /* ignore */ }
        }
      }

      await yieldToMainThread();
    }

    if (onProgress) onProgress(92, 'Finalizing compressed PDF...');
    const pdfBytes = await newPdf.save({ useObjectStreams: false });
    const compressedSize = pdfBytes.byteLength;

    if (onProgress) onProgress(100, 'PDF compression completed!');

    return { pdfBytes, originalSize, compressedSize };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
  }
}

/**
 * Helper to trigger browser download of blob/file with safe URL revoking
 */
export function downloadFile(blob: Blob | Uint8Array, filename: string) {
  const fileBlob = blob instanceof Blob ? blob : new Blob([blob as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const url = URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
