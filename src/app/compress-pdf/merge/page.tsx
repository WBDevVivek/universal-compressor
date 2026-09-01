'use client';

import { useState } from 'react';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { ToolWrapper } from '@/components/shared/ToolWrapper';
import { DragDropOverlay } from '@/components/shared/DragDropOverlay';
import { AdBanner } from '@/components/shared/AdBanner';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTaskHistory } from '@/hooks/useTaskHistory';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { createUnifiedFile, UnifiedFileObject } from '@/shared/utils/dataAdapter';
import { PdfService } from '@/shared/services/pdfService';
import PdfOrderList from '@/components/tools/pdf/PdfOrderList';

export default function PdfMergePage() {
  const config = TOOLS_CONFIG['pdf-merge'];
  const { soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();

  const [files, setFiles] = useState<UnifiedFileObject[]>([]);
  const [mergeStatus, setMergeStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [errMessage, setErrMessage] = useState<string>('');

  const playSuccessBeep = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(840, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio synthesis context creation blocked:', e);
    }
  };

  const handleFilesInput = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return config?.allowedExtensions.includes(ext) && file.size <= (config?.maxUploadSizeMB || 150) * 1024 * 1024;
    });
    if (validFiles.length === 0) return;
    
    // Clear old compilation if new files are appended
    setOutputBlob(null);
    setMergeStatus('idle');
    setFiles((prev) => [...prev, ...validFiles.map((f) => createUnifiedFile(f))]);
  };

  useClipboardPaste({ onFilesPasted: handleFilesInput });

  // Continuation of PdfMergePage Component logic layer
  const executePdfMerge = async () => {
    if (files.length < 2 || mergeStatus === 'processing') return;

    setMergeStatus('processing');
    setProgress(10);
    setErrMessage('');

    try {
      const nativeFilesArray = files.map((f) => f.rawFile);
      
      const mergedResultBlob = await PdfService.mergePdfs(nativeFilesArray, {
        onProgress: (p) => setProgress(p),
      });

      setOutputBlob(mergedResultBlob);
      setMergeStatus('success');
      playSuccessBeep();

      addTaskLog({
        fileName: `merged_document_${Date.now().toString().slice(-4)}.pdf`,
        fileType: 'PDF',
        originalSize: files.reduce((acc, f) => acc + f.size, 0),
        compressedSize: mergedResultBlob.size,
      });
    } catch (error) {
      setMergeStatus('error');
      setErrMessage(error instanceof Error ? error.message : 'Merging process failed');
      setProgress(0);
    }
  };

  const downloadMergedFile = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universal-compressed-bundle.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFilesInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        {/* Document Drop terminal area */}
        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="pdfMergeInput"
            multiple
            accept=".pdf"
            onChange={(e) => e.target.files && handleFilesInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="pdfMergeInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Select PDF Documents
          </label>
          <p className="text-[11px] text-slate-500">Add 2 or more files / paste items via Ctrl+V shortcut</p>
        </div>

        {/* Dynamic Drag Sequence List container */}
        {files.length > 0 && (
          <div className="mt-8 p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-6">
            <PdfOrderList
              files={files}
              onReorder={(updated) => setFiles(updated)}
              onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            />

            {/* Global Processing Indicators */}
            {mergeStatus === 'processing' && <ProgressBar progress={progress} status="processing" />}
            {mergeStatus === 'error' && <StatusBadge type="error" label={errMessage} />}

            {/* Bottom Form Action row */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-900/50 pt-4">
              {mergeStatus === 'success' && (
                <Button variant="primary" onClick={downloadMergedFile} className="h-9 px-5 text-xs">
                  Download Combined PDF
                </Button>
              )}
              {mergeStatus !== 'processing' && files.length >= 2 && (
                <Button variant={mergeStatus === 'success' ? 'secondary' : 'primary'} onClick={executePdfMerge} className="h-9 px-5 text-xs">
                  {mergeStatus === 'success' ? 'Re-Merge Documents' : 'Merge Files Now'}
                </Button>
              )}
            </div>
          </div>
        )}
      </ToolWrapper>

      <AdBanner slotId="pdf-merge-footer" />
    </div>
  );
}
