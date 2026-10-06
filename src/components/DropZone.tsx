import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

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
  title = 'Drop PDF files here',
  description = 'or browse files from your device',
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
  };

  const handleDropFiles = (e: React.DragEvent) => {
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
      e.target.value = '';
    }
  };

  return (
    <div
      id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropFiles}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer select-none overflow-hidden ${
        isDragOver
          ? 'glass-dropzone drag-active scale-[1.01]'
          : 'glass-dropzone hover:scale-[1.006] active:scale-[0.995]'
      }`}
    >
      {/* Specular ambient light refraction */}
      <div className="ios-glass-sheen" />
      <div className="absolute -top-16 -left-16 w-52 h-52 bg-zinc-400/10 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-zinc-500/10 dark:bg-zinc-700/[0.04] rounded-full blur-3xl pointer-events-none" />

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
        
        {/* Monochromatic Frosted Squircle Icon Badge */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
            isDragOver
              ? 'bg-gradient-to-b from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 scale-110 shadow-xl border border-white/40 ring-4 ring-black/10 dark:ring-white/20'
              : 'ios-glass-subtle text-zinc-800 dark:text-zinc-200 shadow-md border border-white/60 dark:border-white/15 group-hover:scale-110 group-hover:shadow-lg'
          }`}
        >
          {/* Top highlight line */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none" />
          {acceptTypes.includes('image') ? (
            <ImageIcon className="w-8 h-8 relative z-10" />
          ) : (
            <UploadCloud className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
          )}
        </div>

        <div className="space-y-1.5 max-w-md">
          <p className="text-base font-semibold text-zinc-950 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
            {title}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full ios-pill text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <span>Supported: {acceptTypes.replace(/\*/g, 'all')}</span>
        </div>
      </div>
    </div>
  );
};

