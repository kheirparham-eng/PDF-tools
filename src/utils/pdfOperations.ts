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
 * Get basic info and 1st page thumbnail for an uploaded PDF
 */
export async function getPDFInfo(arrayBuffer: ArrayBuffer): Promise<{ pageCount: number; thumbnailUrl: string }> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    // Render page 1 thumbnail
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
    }

    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
    return { pageCount, thumbnailUrl };
  } catch (error: any) {
    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password protected or encrypted. Please unlock it before processing.');
    }
    throw new Error('Failed to read PDF file. The document may be corrupted or invalid.');
  }
}

/**
 * Render specific page to a canvas data URL
 */
export async function renderPageThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number,
  scale: number = 0.5
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageIndex + 1);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (context) {
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    }).promise;
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const aspectRatio = viewport.width / viewport.height;

  return { dataUrl, width: viewport.width, height: viewport.height, aspectRatio };
}

/**
 * Merge multiple PDF file items into a single PDF Uint8Array
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
      srcPdf = await PDFDocument.load(fileItem.arrayBuffer.slice(0), { ignoreEncryption: false });
    } catch (err: any) {
      throw new Error(`Failed to load "${fileItem.name}". File may be encrypted or corrupted.`);
    }

    const totalSrcPages = srcPdf.getPageCount();
    let pageIndicesToCopy: number[];

    if (fileItem.pageRange && fileItem.pageRange.trim()) {
      pageIndicesToCopy = parsePageRanges(fileItem.pageRange, totalSrcPages);
    } else {
      pageIndicesToCopy = Array.from({ length: totalSrcPages }, (_, i) => i);
    }

    if (pageIndicesToCopy.length === 0) continue;

    const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndicesToCopy);

    for (const page of copiedPages) {
      // Apply rotation if file item specifies it
      if (fileItem.rotation) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + fileItem.rotation) % 360));
      }
      mergedPdf.addPage(page);
    }
  }

  if (onProgress) {
    onProgress(90, 'Generating combined PDF document...');
  }

  const pdfBytes = await mergedPdf.save();

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

  const srcPdf = await PDFDocument.load(arrayBuffer.slice(0));
  const baseName = originalFilename.replace(/\.pdf$/i, '');

  if (mode === 'single-pdf') {
    if (onProgress) onProgress(30, 'Creating extracted PDF document...');

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, selectedPageIndices);

    copiedPages.forEach((page, idx) => {
      const pageIndex = selectedPageIndices[idx];
      const extraRot = rotations.get(pageIndex) || 0;
      if (extraRot !== 0) {
        const curRot = page.getRotation().angle;
        page.setRotation(degrees((curRot + extraRot) % 360));
      }
      newPdf.addPage(page);
    });

    if (onProgress) onProgress(80, 'Finalizing extracted PDF...');
    const pdfBytes = await newPdf.save();
    if (onProgress) onProgress(100, 'Done!');

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
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
      const pdfBytes = await singlePdf.save();
      zip.file(`${baseName}_page_${pageIdx + 1}.pdf`, pdfBytes);
    }

    if (onProgress) onProgress(90, 'Compressing ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    if (onProgress) onProgress(100, 'Done!');

    return {
      blob: zipBlob,
      filename: `${baseName}_split_pages.zip`
    };
  }
}

/**
 * Convert PDF pages to images (PNG or JPEG)
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

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const baseName = originalFilename.replace(/\.pdf$/i, '');
  const total = selectedPageIndices.length;

  const resultImages: Array<{ pageNumber: number; dataUrl: string; blob: Blob; filename: string }> = [];
  const zip = new JSZip();

  for (let i = 0; i < total; i++) {
    const pageIdx = selectedPageIndices[i];
    const pageNumber = pageIdx + 1;

    if (onProgress) {
      onProgress(
        Math.round((i / total) * 85),
        `Rendering page ${pageNumber} as image (${i + 1}/${total})...`
      );
    }

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: qualityScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
    }

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';
    const filename = `${baseName}_page_${pageNumber}.${extension}`;

    const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.92 : 1.0);

    // Convert dataUrl to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    resultImages.push({ pageNumber, dataUrl, blob, filename });
    zip.file(filename, blob);
  }

  let zipBlob: Blob | undefined = undefined;
  if (resultImages.length > 1) {
    if (onProgress) onProgress(92, 'Generating images ZIP archive...');
    zipBlob = await zip.generateAsync({ type: 'blob' });
  }

  if (onProgress) onProgress(100, 'Image conversion completed!');

  return { images: resultImages, zipBlob };
}

/**
 * Convert selected images to a merged PDF file
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
      // JPEG / JPG / WebP fallback
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
      // Standard A4 dimensions in points (595.28 x 841.89)
      pageWidth = 595.28;
      pageHeight = 841.89;

      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      renderWidth = imgWidth * scale;
      renderHeight = imgHeight * scale;

      // Center on page
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
  }

  if (onProgress) onProgress(95, 'Saving final PDF document...');
  const pdfBytes = await pdfDoc.save();
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
  const srcPdf = await PDFDocument.load(arrayBuffer.slice(0));
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
  }

  if (onProgress) onProgress(95, 'Generating reordered PDF...');
  const pdfBytes = await newPdf.save();
  if (onProgress) onProgress(100, 'Reorder complete!');

  return pdfBytes;
}

/**
 * Convert PDF pages to Grayscale / Black & White
 */
export async function convertToGrayscalePDF(
  arrayBuffer: ArrayBuffer,
  mode: 'grayscale' | 'contrast' | 'sepia' = 'grayscale',
  onProgress?: (progress: number, detail: string) => void
): Promise<Uint8Array> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(
        Math.round(((pageNum - 1) / numPages) * 85),
        `Converting page ${pageNum} of ${numPages} to B&W...`
      );
    }

    const page = await pdfDoc.getPage(pageNum);
    const scale = 2.0; // High resolution rendering for crisp text
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

      // Pixel filter manipulation
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

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const jpegBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());

    const embeddedImage = await newPdf.embedJpg(jpegBytes);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height
    });
  }

  if (onProgress) onProgress(92, 'Generating B&W PDF file...');
  const pdfBytes = await newPdf.save();
  if (onProgress) onProgress(100, 'Grayscale conversion complete!');

  return pdfBytes;
}

/**
 * Compress PDF document size by optimizing images and encoding
 */
export async function compressPDF(
  arrayBuffer: ArrayBuffer,
  level: 'recommended' | 'maximum' | 'light' = 'recommended',
  onProgress?: (progress: number, detail: string) => void
): Promise<{ pdfBytes: Uint8Array; originalSize: number; compressedSize: number }> {
  const originalSize = arrayBuffer.byteLength;
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newPdf = await PDFDocument.create();

  let renderScale = 1.5;
  let jpegQuality = 0.72;

  if (level === 'maximum') {
    renderScale = 1.2;
    jpegQuality = 0.55;
  } else if (level === 'light') {
    renderScale = 1.8;
    jpegQuality = 0.85;
  }

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(
        Math.round(((pageNum - 1) / numPages) * 85),
        `Optimizing page ${pageNum} of ${numPages}...`
      );
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
    }

    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const jpegBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());

    const embeddedImage = await newPdf.embedJpg(jpegBytes);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height
    });
  }

  if (onProgress) onProgress(92, 'Finalizing compressed PDF...');
  const pdfBytes = await newPdf.save();
  const compressedSize = pdfBytes.byteLength;

  if (onProgress) onProgress(100, 'PDF compression completed!');

  return { pdfBytes, originalSize, compressedSize };
}

/**
 * Helper to trigger browser download of blob/file
 */
export function downloadFile(blob: Blob | Uint8Array, filename: string) {
  const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
