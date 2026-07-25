import React, { useState } from 'react';
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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-xl shrink-0 shadow-lg shadow-purple-500/30 border border-white/30">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF to Image Converter
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Convert PDF pages into high-resolution PNG or JPEG images. Download individual pages or export all pages together as a ZIP archive.
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
          description="Upload a PDF document to render pages into image format"
          id="convert-image-dropzone"
        />
      ) : (
        <div className="space-y-6">
          
          {/* File Overview Bar */}
          <div className="glass-card rounded-2xl p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {file.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {file.pageCount} pages • {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setConvertedImages(null);
                setZipBlob(null);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Choose Different PDF</span>
            </button>
          </div>

          {/* Options Toolbar */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Image Options</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Output Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('png')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      format === 'png'
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    onClick={() => setFormat('jpeg')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      format === 'jpeg'
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    JPEG (High Quality)
                  </button>
                </div>
              </div>

              {/* Quality Resolution Scale */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Image Resolution
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1.0}>Standard (150 DPI)</option>
                  <option value={1.5}>Medium High (225 DPI - Recommended)</option>
                  <option value={2.0}>Ultra Clear (300 DPI)</option>
                </select>
              </div>

              {/* Page Range Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pages to Convert
                </label>
                <input
                  type="text"
                  placeholder={`1-${file.pageCount}`}
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleConvert}
                id="convert-image-btn"
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Convert Pages to {format.toUpperCase()}</span>
              </button>
            </div>

          </div>

          {/* Converted Results Section */}
          {convertedImages && convertedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Converted {convertedImages.length} Images</span>
                </h3>

                {zipBlob && (
                  <button
                    onClick={downloadAllZip}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center space-x-2 cursor-pointer"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>Download All as ZIP</span>
                  </button>
                )}
              </div>

              {/* Grid of Converted Image Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {convertedImages.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-700/60">
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Page {img.pageNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatFileSize(img.blob.size)}
                        </span>
                      </div>

                      <button
                        onClick={() => downloadSingleImage(img)}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
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
