import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Download,
  FileArchive,
  CheckCircle2,
  Sliders,
  FileText,
  Trash2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProcessingState, ToastMessage } from '../types';
import {
  getPDFInfo,
  convertPDFToImages,
  parsePageRanges,
  downloadFile,
  formatFileSize
} from '../utils/pdfOperations';
import { DropZone } from './DropZone';

interface ImageConvertToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ImageConvertTool: React.FC<ImageConvertToolProps> = ({
  onProcessingChange,
  addToast
}) => {
  const [file, setFile] = useState<{ file: File; arrayBuffer: ArrayBuffer; name: string; pageCount: number; size: number } | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(1.5); // 1.5x scale default for clear images
  const [pageRange, setPageRange] = useState('');
  const [convertedImages, setConvertedImages] = useState<Array<{ pageNumber: number; dataUrl: string; blob: Blob; filename: string }> | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  // Keep track of active object URLs to revoke them when no longer needed
  const activeUrlsRef = useRef<string[]>([]);

  const revokeActiveUrls = () => {
    activeUrlsRef.current.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    });
    activeUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      revokeActiveUrls();
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

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const info = await getPDFInfo(arrayBuffer);

      revokeActiveUrls();
      setFile({
        file: selectedFile,
        arrayBuffer,
        name: selectedFile.name,
        pageCount: info.pageCount,
        size: selectedFile.size
      });

      setPageRange(`1-${info.pageCount}`);
      setConvertedImages(null);
      setZipBlob(null);

      addToast({
        type: 'success',
        title: 'PDF Loaded',
        message: `Loaded "${selectedFile.name}" with ${info.pageCount} pages.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to read PDF',
        message: err.message || 'The file may be password protected or corrupted.'
      });
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    const pageIndices = parsePageRanges(pageRange, file.pageCount);
    if (pageIndices.length === 0) {
      addToast({
        type: 'warning',
        title: 'Invalid Page Range',
        message: 'Please specify valid page numbers or ranges to convert.'
      });
      return;
    }

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Converting PDF to Images...',
        progress: 10,
        detail: `Rendering ${pageIndices.length} pages as high-resolution ${format.toUpperCase()} images...`
      });

      revokeActiveUrls();

      const { images, zipBlob: generatedZip } = await convertPDFToImages(
        file.arrayBuffer,
        pageIndices,
        format,
        scale,
        file.name,
        (progress, detail) => {
          onProcessingChange({
            isProcessing: true,
            title: 'Converting PDF to Images...',
            progress,
            detail
          });
        }
      );

      activeUrlsRef.current = images.map((img) => img.dataUrl);
      setConvertedImages(images);
      setZipBlob(generatedZip || null);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast({
        type: 'success',
        title: 'Conversion Complete!',
        message: `Converted ${images.length} pages to ${format.toUpperCase()} images.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.message || 'An error occurred during image conversion.'
      });
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  const downloadSingleImage = (img: { blob: Blob; filename: string }) => {
    downloadFile(img.blob, img.filename);
  };

  const downloadAllZip = () => {
    if (!zipBlob || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(zipBlob, `${baseName}_images_${format.toLowerCase()}.zip`);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="ios-glass rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
        <div className="ios-glass-sheen" />
        <div className="liquid-sheen-sweep" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#BF5AF2]/10 dark:bg-[#BF5AF2]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#BF5AF2] to-[#8E44AD] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#BF5AF2]/25 border border-white/40 ring-1 ring-black/5">
            <ImageIcon className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              PDF to Image Converter
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Convert PDF pages into high-resolution PNG or JPEG raster images. Download individual pages or export all pages together as an archived ZIP bundle.
            </p>
          </div>
        </div>
      </div>

      {!file ? (
        <DropZone
          onFilesSelected={handleFileSelected}
          acceptTypes=".pdf"
          multiple={false}
          title="Drop a PDF file to convert to images"
          description="Select a PDF document from your device to render pages into image format"
          id="convert-image-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Overview Bar */}
          <div className="ios-glass rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="ios-glass-sheen" />
            <div className="flex items-center space-x-3.5 min-w-0 relative z-10">
              <div className="w-10 h-10 rounded-xl ios-pill flex items-center justify-center text-[#BF5AF2] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  <span className="font-mono tabular-nums">{file.pageCount}</span> pages · <span className="font-mono tabular-nums">{formatFileSize(file.size)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                revokeActiveUrls();
                setFile(null);
                setConvertedImages(null);
                setZipBlob(null);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-xl ios-btn-secondary text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer relative z-10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Choose Different PDF</span>
            </button>
          </div>

          {/* Options Toolbar */}
          <div className="ios-glass rounded-3xl p-6 sm:p-7 space-y-5 relative overflow-hidden">
            <div className="ios-glass-sheen" />
            <div className="liquid-sheen-sweep" />
            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white flex items-center space-x-2 relative z-10">
              <Sliders className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
              <span>Image Options</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Output Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <div className="p-1 rounded-2xl ios-segmented-trough grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setFormat('png')}
                    className={`py-1.5 px-3 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      format === 'png'
                        ? 'ios-segmented-active'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    onClick={() => setFormat('jpeg')}
                    className={`py-1.5 px-3 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      format === 'jpeg'
                        ? 'ios-segmented-active'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    JPEG (Photo)
                  </button>
                </div>
              </div>

              {/* Quality Resolution Scale */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Raster Resolution
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl ios-input text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value={1.0}>Standard (150 DPI)</option>
                  <option value={1.5}>Medium High (225 DPI - Recommended)</option>
                  <option value={2.0}>Ultra Clear (300 DPI)</option>
                </select>
              </div>

              {/* Page Range Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pages to Convert
                </label>
                <input
                  type="text"
                  placeholder={`1-${file.pageCount}`}
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl ios-input text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleConvert}
                id="convert-image-btn"
                className="liquid-export-btn w-full sm:w-auto"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Convert Pages to {format.toUpperCase()}</span>
              </button>
            </div>

          </div>

          {/* Converted Results Section */}
          {convertedImages && convertedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <span>Converted {convertedImages.length} Images</span>
                </h3>

                {zipBlob && (
                  <button
                    onClick={downloadAllZip}
                    className="liquid-export-btn text-xs py-2 px-5"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              {/* Grid of Converted Image Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {convertedImages.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="group rounded-2xl ios-glass p-3 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] ios-glass-subtle rounded-xl overflow-hidden mb-3 border border-black/5 dark:border-white/10 shadow-inner flex items-center justify-center">
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>Page {img.pageNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {formatFileSize(img.blob.size)}
                        </span>
                      </div>

                      <button
                        onClick={() => downloadSingleImage(img)}
                        className="w-full py-1.5 px-3 rounded-xl ios-btn-secondary text-xs font-medium flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
