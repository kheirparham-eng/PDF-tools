import React, { useState } from 'react';
import {
  FileImage,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageToPdfItem, ProcessingState, ToastMessage } from '../types';
import { convertImagesToPDF, formatFileSize, downloadFile } from '../utils/pdfOperations';
import { DropZone } from './DropZone';

interface ImgToPdfToolProps {
  onProcessingChange: (state: ProcessingState) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ImgToPdfTool: React.FC<ImgToPdfToolProps> = ({
  onProcessingChange,
  addToast
}) => {
  const [images, setImages] = useState<ImageToPdfItem[]>([]);
  const [pageSizeOption, setPageSizeOption] = useState<'fit' | 'a4'>('fit');
  const [margin, setMargin] = useState<number>(0);
  const [outputFilename, setOutputFilename] = useState('compiled_images.pdf');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const newItems: ImageToPdfItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!file.type.startsWith('image/')) {
        addToast({
          type: 'warning',
          title: 'Skipped invalid file',
          message: `"${file.name}" is not a supported image file.`
        });
        continue;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        
        // Measure image dimensions
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => resolve({ width: 800, height: 600 });
          img.src = previewUrl;
        });

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          previewUrl,
          width: dimensions.width,
          height: dimensions.height,
          rotation: 0
        });
      } catch (err: any) {
        addToast({
          type: 'error',
          title: `Failed to load "${file.name}"`,
          message: err.message
        });
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      addToast({
        type: 'success',
        title: `Added ${newItems.length} ${newItems.length === 1 ? 'image' : 'images'}`
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setImages(updated);
  };

  // Drag reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...images];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setImages(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      addToast({ type: 'warning', title: 'No images uploaded', message: 'Please add images to convert.' });
      return;
    }

    try {
      onProcessingChange({
        isProcessing: true,
        title: 'Compiling Images to PDF...',
        progress: 10,
        detail: 'Embedding images into PDF document...'
      });

      const pdfBytes = await convertImagesToPDF(
        images,
        pageSizeOption,
        margin,
        (progress, detail) => {
          onProcessingChange({
            isProcessing: true,
            title: 'Compiling Images to PDF...',
            progress,
            detail
          });
        }
      );

      const filename = outputFilename.trim().endsWith('.pdf')
        ? outputFilename.trim()
        : `${outputFilename.trim()}.pdf`;

      downloadFile(pdfBytes, filename);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast({
        type: 'success',
        title: 'PDF Created!',
        message: `Compiled ${images.length} images into "${filename}".`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.message || 'An error occurred during PDF creation.'
      });
    } finally {
      onProcessingChange({ isProcessing: false, title: '', progress: 0 });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shrink-0 shadow-lg shadow-blue-500/30 border border-white/30">
            <FileImage className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Image to PDF Converter
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Convert PNG, JPG, or WebP images into a single PDF file. Drag to reorder image sequence, choose page sizes, and customize page margins.
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={handleFilesSelected}
        acceptTypes="image/*"
        multiple={true}
        title="Drop your image files here (PNG, JPG, WebP)"
        description="Upload images to merge them into a single PDF document"
        id="img-to-pdf-dropzone"
      />

      {images.length > 0 && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Image Sequence ({images.length} {images.length === 1 ? 'image' : 'images'})
            </h3>

            <button
              onClick={() => {
                images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
                setImages([]);
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* List of Image Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imgItem, index) => (
              <div
                key={imgItem.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-2xl border bg-white dark:bg-slate-800 transition-all flex flex-col justify-between ${
                  draggedIndex === index
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">
                      Page #{index + 1}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                        title="Move Left"
                      >
                        <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                      <button
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                        title="Move Right"
                      >
                        <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                      <button
                        onClick={() => removeImage(imgItem.id)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-2">
                    <img
                      src={imgItem.previewUrl}
                      alt={imgItem.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="mt-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {imgItem.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {imgItem.width} × {imgItem.height} px • {formatFileSize(imgItem.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>PDF Page Layout Options</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Sizing
                </label>
                <select
                  value={pageSizeOption}
                  onChange={(e) => setPageSizeOption(e.target.value as 'fit' | 'a4')}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl glass-input text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="fit">Fit Page to Image Aspect Ratio</option>
                  <option value="a4">Standard A4 Page (Centered)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Margins
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl glass-input text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value={0}>No Margins (0pt)</option>
                  <option value={10}>Small Margin (10pt)</option>
                  <option value={20}>Medium Margin (20pt)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Output Filename
                </label>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl glass-input text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleConvert}
                id="convert-img-to-pdf-btn"
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary text-white font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Compile {images.length} Images to PDF</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
