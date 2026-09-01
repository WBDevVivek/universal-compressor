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
import { createUnifiedFile, UnifiedFileObject, revokeFilePreview } from '@/shared/utils/dataAdapter';
import { PdfService } from '@/shared/services/pdfService';

export default function PdfSplitPage() {
  const config = TOOLS_CONFIG['pdf-split'];
  const { soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();

  const [file, setFile] = useState<UnifiedFileObject | null>(null);
  const [pageRangeInput, setPageRangeInput] = useState<string>('1');
  const [splitStatus, setSplitStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [errMessage, setErrMessage] = useState<string>('');

  const playSuccessAlert = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(820, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio visualization blocked:', e);
    }
  };

  // Helper logic to transform comma/dash expressions into zero-based index ranges
  const parsePageIndices = (input: string): number[] => {
    const indices: number[] = [];
    const segments = input.split(',');

    for (const segment of segments) {
      const clean = segment.trim();
      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            indices.push(i - 1); // Shifting to zero-based matrix indexing
          }
        }
      } else {
        const val = parseInt(clean, 10);
        if (!isNaN(val)) {
          indices.push(val - 1);
        }
      }
    }
    return Array.from(new Set(indices)).sort((a, b) => a - b);
  };

  const handleFileInput = (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    const targetFile = rawFiles[0];
    const ext = targetFile.name.split('.').pop()?.toLowerCase() || '';
    
    if (config?.allowedExtensions.includes(ext) && targetFile.size <= (config?.maxUploadSizeMB || 100) * 1024 * 1024) {
      if (file) revokeFilePreview(file);
      setOutputBlob(null);
      setSplitStatus('idle');
      setFile(createUnifiedFile(targetFile));
    }
  };

  useClipboardPaste({ onFilesPasted: handleFileInput });

  // Continuation of PdfSplitPage Component logic layer
  const executePdfSplit = async () => {
    if (!file || splitStatus === 'processing') return;

    const targetIndices = parsePageIndices(pageRangeInput);
    if (targetIndices.length === 0) {
      setSplitStatus('error');
      setErrMessage('Please enter a valid page number query format (e.g. 1, 2, 4-6).');
      return;
    }

    setSplitStatus('processing');
    setProgress(20);
    setErrMessage('');

    try {
      const splitResultBlob = await PdfService.splitPdf(file.rawFile, {
        pageIndices: targetIndices,
        onProgress: (p) => setProgress(p),
      });

      setOutputBlob(splitResultBlob);
      setSplitStatus('success');
      playSuccessAlert();

      addTaskLog({
        fileName: `${file.name.split('.').slice(0, -1).join('.')}_extracted.pdf`,
        fileType: 'PDF',
        originalSize: file.size,
        compressedSize: splitResultBlob.size,
      });
    } catch (error) {
      setSplitStatus('error');
      setErrMessage(error instanceof Error ? error.message : 'Splitting execution cracked');
      setProgress(0);
    }
  };

  const downloadExtractedFile = () => {
    if (!outputBlob || !file) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.split('.').slice(0, -1).join('.')}_extracted.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFileInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        {/* Upload Terminal Box Container */}
        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="pdfSplitInput"
            accept=".pdf"
            onChange={(e) => e.target.files && handleFileInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="pdfSplitInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Select PDF Document
          </label>
          <p className="text-[11px] text-slate-500">Upload document container / paste via Ctrl+V anytime</p>
        </div>

        {/* Dynamic Parameter Settings Layout Panel */}
        {file && (
          <div className="mt-8 p-5 rounded-xl border border-slate-900 bg-slate-900/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/50 pb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200 truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-slate-500 font-mono">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setFile(null); setOutputBlob(null); setSplitStatus('idle'); }} className="text-xs text-slate-500 hover:text-red-400 transition">
                Remove File
              </button>
            </div>

            {/* Matrix Input Parameter Controller row */}
            <div className="space-y-2 max-w-md">
              <label className="text-xs font-bold text-slate-400">Specify Pages to Extract</label>
              <input
                type="text"
                value={pageRangeInput}
                onChange={(e) => setPageRangeInput(e.target.value)}
                placeholder="e.g. 1, 3, 5-8"
                className="w-full h-10 px-3 rounded-lg border border-slate-900 bg-slate-950 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-500 font-medium">Use commas for individual indices and dashes for sequential ranges blocks.</p>
            </div>

            {splitStatus === 'processing' && <ProgressBar progress={progress} status="processing" />}
            {splitStatus === 'error' && <StatusBadge type="error" label={errMessage} />}

            <div className="flex items-center justify-end gap-3 pt-2">
              {splitStatus === 'success' && (
                <Button variant="primary" onClick={downloadExtractedFile} className="h-9 px-5 text-xs">
                  Download Extracted Pages
                </Button>
              )}
              {splitStatus !== 'processing' && (
                <Button variant={splitStatus === 'success' ? 'secondary' : 'primary'} onClick={executePdfSplit} className="h-9 px-5 text-xs">
                  {splitStatus === 'success' ? 'Extract Again' : 'Extract Pages Now'}
                </Button>
              )}
            </div>
          </div>
        )}
      </ToolWrapper>

      <AdBanner slotId="pdf-split-footer" />
    </div>
  );
}
