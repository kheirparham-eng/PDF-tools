import React, { useRef, useState } from 'react';
import { UploadCloud, File, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  acceptTypes?: string; // e.g. ".pdf" or "image/*,.pdf"
  multiple?: boolean;
  title?: string;
  description?: string;
  id?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  acceptTypes = '.pdf',
  multiple = true,
  title = 'Drag & drop PDF files here',
  description = 'or click to browse from your computer',
  id = 'file-dropzone'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same file can be chosen again if needed
      e.target.value = '';
    }
  };

  return (
    <div
      id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer select-none overflow-hidden ${
        isDragOver
          ? 'glass-dropzone drag-active scale-[1.01]'
          : 'glass-dropzone hover:scale-[1.005]'
      }`}
    >
      {/* Background ambient light reflection */}
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
        id={`${id}-input`}
      />

      <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
        <div
          className={`p-4.5 rounded-2xl transition-all duration-300 backdrop-blur-md ${
            isDragOver
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white scale-110 shadow-xl shadow-indigo-500/40 border border-white/40'
              : 'bg-white/40 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 border border-white/50 dark:border-white/10 shadow-lg group-hover:scale-110 group-hover:shadow-indigo-500/20'
          }`}
        >
          {acceptTypes.includes('image') ? (
            <ImageIcon className="w-8 h-8" />
          ) : (
            <UploadCloud className="w-8 h-8 animate-bounce" />
          )}
        </div>

        <div className="space-y-1 max-w-md">
          <p className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            {title}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Supported format: {acceptTypes.replace(/\*/g, 'all')}</span>
        </div>
      </div>
    </div>
  );
};
