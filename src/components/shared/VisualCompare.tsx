'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
import Image from 'next/image';

interface VisualCompareProps {
  originalSrc: string;
  compressedSrc: string;
  altText?: string;
}

/**
 * Visual Comparison Slider - Custom dual-layer rendering system for memory-buffered content canvas.
 */
export function VisualCompare({ originalSrc, compressedSrc, altText = 'Compression preview' }: VisualCompareProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-900 bg-slate-950 cursor-ew-resize select-none"
    >
      {/* Base Layer: Compressed Output (Right View) */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={compressedSrc}
          alt={`${altText} compressed preview`}
          fill
          unoptimized
          className="object-contain"
        />
        <span className="absolute bottom-3 right-3 z-10 rounded bg-slate-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-900">
          Optimized
        </span>
      </div>

      {/* Top Layer: Original Input (Left View / Clipped View) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <Image
          src={originalSrc}
          alt={`${altText} original blueprint`}
          fill
          unoptimized
          className="object-contain"
        />
        <span className="absolute bottom-3 left-3 z-10 rounded bg-indigo-950/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-900/40">
          Original
        </span>
      </div>

      {/* Synchronized Slider Handle Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-20 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Visual Central Tracker Thumb */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-black/40">
          ↔
        </div>
      </div>
    </div>
  );
}
