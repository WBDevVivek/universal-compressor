'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface InlineEditorProps {
  imageSrc: string;
  originalFile: File;
  onSave: (updatedFile: File) => void;
  onCancel: () => void;
}

/**
 * Inline Image Mini-Editor Component - Handles non-destructive client-side 
 * canvas transformations (rotation and exact width/height resizing).
 */
export default function InlineEditor({ imageSrc, originalFile, onSave, onCancel }: InlineEditorProps) {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270 degrees
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Automatically analyze image dimensions on mounting thread
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setAspectRatio(img.width / img.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(parseInt(e.target.value) || 0, 1);
    setWidth(newWidth);
    // Auto-maintain precise aspect ratio constraints dynamically
    setHeight(Math.round(newWidth / aspectRatio));
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(parseInt(e.target.value) || 0, 1);
    setHeight(newHeight);
    setWidth(Math.round(newHeight * aspectRatio));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyTransformations = async () => {
    setIsProcessing(true);
    
    // Defer implementation slightly to keep UI frame budget responsive
    setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to capture native canvas 2D render matrix.');
          }

          // Compute boundary box changes based on current rotation angle
          const isOrthogonal = rotation === 90 || rotation === 270;
          canvas.width = isOrthogonal ? height : width;
          canvas.height = isOrthogonal ? width : height;

          // Move registration point to canvas origin for coordinate mapping
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          
          // Draw frame relative to shifted origin context
          ctx.drawImage(img, -width / 2, -height / 2, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], originalFile.name, {
                type: originalFile.type,
                lastModified: Date.now(),
              });
              onSave(processedFile);
            }
            setIsProcessing(false);
          }, originalFile.type);

        } catch (error) {
          console.error('Local transformation execution failed:', error);
          setIsProcessing(false);
        }
      };
      img.src = imageSrc;
    }, 50);
  };

  return (
    <div className="w-full p-5 rounded-xl border border-slate-900 bg-slate-950/60 backdrop-blur-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-200 uppercase">
          🔧 Inline Mini-Editor
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">Local RAM Canvas Mode</span>
      </div>

      {/* Numerical Dimension Input Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Target Width (px)</label>
          <input
            type="number"
            value={width || ''}
            onChange={handleWidthChange}
            className="w-full h-10 px-3 rounded-lg border border-slate-900 bg-slate-900/30 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Target Height (px)</label>
          <input
            type="number"
            value={height || ''}
            onChange={handleHeightChange}
            className="w-full h-10 px-3 rounded-lg border border-slate-900 bg-slate-900/30 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Rotation Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleRotate}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
        >
          🔄 Rotate 90° <span className="text-slate-500 font-mono">({rotation}°)</span>
        </button>

        {/* Operational Flow Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button variant="outline" onClick={onCancel} className="h-9 px-4 text-xs">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyTransformations} isLoading={isProcessing} className="h-9 px-4 text-xs">
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
