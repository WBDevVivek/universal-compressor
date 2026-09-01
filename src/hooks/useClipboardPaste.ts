'use client';

import { useEffect } from 'react';

interface ClipboardPasteProps {
  onFilesPasted: (files: File[]) => void;
  isActive?: boolean;
}

/**
 * Clipboard Paste Hook - Captures binary multi-stream items from runtime clip arrays.
 */
export function useClipboardPaste({ onFilesPasted, isActive = true }: ClipboardPasteProps) {
  useEffect(() => {
    if (!isActive) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Discard context triggers inside native editable system forms if any
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.files.length) return;

      const filesArray: File[] = [];
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files.item(i);
        if (file) {
          filesArray.push(file);
        }
      }

      if (filesArray.length > 0) {
        e.preventDefault();
        onFilesPasted(filesArray);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFilesPasted, isActive]);
}
