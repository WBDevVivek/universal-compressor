'use client';

import { useEffect, useState, DragEvent } from 'react';

interface DragDropOverlayProps {
  onFilesDropped: (files: File[]) => void;
}

/**
 * Global Drag & Drop Overlay - Triggers fullscreen capture state when files bypass viewport boundaries.
 */
export function DragDropOverlay({ onFilesDropped }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        onFilesDropped(filesArray);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  if (!isDragging) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md border-4 border-dashed border-indigo-500/50 p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="text-center space-y-4 pointer-events-none">
        <div className="w-20 h-20 inline-flex items-center justify-center rounded-3xl bg-indigo-500/10 text-4xl text-indigo-400 animate-bounce">
          📥
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Drop Your Files Anywhere</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Release to automatically stream and mount files into the processing pipeline sandbox.
        </p>
      </div>
    </div>
  );
}
