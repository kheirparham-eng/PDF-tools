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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title} — Page {pageNumber}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-resolution page preview
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onRotate && (
              <button
                onClick={onRotate}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Rotate Page"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[400px]">
          <div
            className="transition-transform duration-200 shadow-xl rounded-lg overflow-hidden bg-white"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxWidth: '100%'
            }}
          >
            <img
              src={thumbnailUrl}
              alt={`Page ${pageNumber}`}
              className="max-h-[65vh] object-contain block mx-auto"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Click outside or press ESC to close</span>
        </div>

      </div>
    </div>
  );
};
