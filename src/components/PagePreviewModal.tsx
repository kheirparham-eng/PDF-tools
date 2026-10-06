import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  thumbnailUrl: string;
  pageNumber: number;
  rotation?: number;
  onRotate?: () => void;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  thumbnailUrl,
  pageNumber,
  rotation = 0,
  onRotate
}) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl">
      <div className="relative ios-glass rounded-3xl shadow-2xl border border-white/20 dark:border-white/15 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-ios-spring">
        <div className="ios-glass-sheen" />
        
        {/* iOS Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
              {title} — Page {pageNumber}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              High-resolution document preview
            </p>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {onRotate && (
              <button
                onClick={onRotate}
                className="p-2 rounded-xl ios-btn-secondary text-zinc-700 dark:text-zinc-300"
                title="Rotate Page"
                aria-label="Rotate Page"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}
              className="p-2 rounded-xl ios-btn-secondary text-zinc-700 dark:text-zinc-300"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-2 rounded-xl ios-btn-secondary text-zinc-700 dark:text-zinc-300"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl ios-btn-secondary text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Canvas Viewport */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/5 dark:bg-black/30 min-h-[420px]">
          <div
            className="transition-transform duration-200 shadow-2xl rounded-xl overflow-hidden bg-white ring-1 ring-black/10"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: '100%'
            }}
          >
            <img
              src={thumbnailUrl}
              alt={`Page ${pageNumber}`}
              className="max-h-[66vh] object-contain block mx-auto"
            />
          </div>
        </div>

        {/* iOS Modal Footer Bar */}
        <div className="px-6 py-3 border-t border-black/5 dark:border-white/5 bg-white/20 dark:bg-white/5 flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-mono tabular-nums">Zoom: {Math.round(zoom * 100)}%</span>
          <span>Press ESC or click close to exit</span>
        </div>

      </div>
    </div>
  );
};

