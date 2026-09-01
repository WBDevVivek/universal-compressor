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
import { useStorageSaved } from '@/hooks/useStorageSaved';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { createUnifiedFile, UnifiedFileObject, revokeFilePreview } from '@/shared/utils/dataAdapter';
import { PdfService } from '@/shared/services/pdfService';

export default function PdfReducePage() {
  const config = TOOLS_CONFIG['pdf-reduce'];
  const { soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();
  const { recordSavings } = useStorageSaved();

  const [files, setFiles] = useState<UnifiedFileObject[]>([]);
  const [activePreset, setActivePreset] = useState<string>('none');

  const playSuccessAlert = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio feedback blocked by sandbox constraint:', e);
    }
  };

  const handleFilesInput = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return config?.allowedExtensions.includes(ext) && file.size <= (config?.maxUploadSizeMB || 100) * 1024 * 1024;
    });
    if (validFiles.length === 0) return;
    setFiles((prev) => [...prev, ...validFiles.map((f) => createUnifiedFile(f))]);
  };

  useClipboardPaste({ onFilesPasted: handleFilesInput });

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id !== id);
      if (target) revokeFilePreview(target);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Continuation of PdfReducePage Component logic layer
  const executePdfCompression = async (fileObj: UnifiedFileObject) => {
    if (fileObj.status === 'processing') return;

    setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing', progress: 20 } : f)));

    try {
      const compressedBlob = await PdfService.compressPdf(fileObj.rawFile, {
        onProgress: (p) => {
          setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, progress: p } : f)));
        },
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'success',
                progress: 100,
                compressedSize: compressedBlob.size,
                compressedBlob: compressedBlob,
              }
            : f
        )
      );

      recordSavings(fileObj.size, compressedBlob.size);
      addTaskLog({
        fileName: fileObj.name,
        fileType: 'PDF',
        originalSize: fileObj.size,
        compressedSize: compressedBlob.size,
      });
      playSuccessAlert();
    } catch (err) {
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error', errorMessage: 'Object stream compression failed', progress: 0 } : f)));
    }
  };

  const downloadFile = (fileObj: UnifiedFileObject) => {
    if (!fileObj.compressedBlob) return;
    const url = URL.createObjectURL(fileObj.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileObj.name.split('.').slice(0, -1).join('.')}-compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFilesInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        {/* Top Preset Control Context */}
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 mb-6 max-w-xs">
          <label className="text-xs font-bold text-slate-400 block mb-1">Target Constraints Preset</label>
          <select
            value={activePreset}
            onChange={(e) => setActivePreset(e.target.value)}
            className="w-full h-9 px-2 text-xs rounded-lg border border-slate-900 bg-slate-900 text-slate-200 focus:outline-none"
          >
            <option value="none">Standard Optimization Preset</option>
            {config?.presets?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Binary Upload Drop Area */}
        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="pdfReduceInput"
            multiple
            accept=".pdf"
            onChange={(e) => e.target.files && handleFilesInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="pdfReduceInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Browse PDF Files
          </label>
          <p className="text-[11px] text-slate-500">or drop heavy document containers here / paste via Ctrl+V</p>
        </div>

        {/* Output Queue Stream */}
        <div className="mt-8 space-y-4">
          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Original: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'idle' && (
                    <Button variant="primary" onClick={() => executePdfCompression(file)} className="h-8 px-4 text-xs">
                      Reduce Size Now
                    </Button>
                  )}
                  {file.status === 'success' && file.compressedSize && (
                    <>
                      <span className="text-xs font-bold text-emerald-400 font-mono pr-2">
                        ⬇️ {(file.compressedSize / (1024 * 1024)).toFixed(2)} MB (-{(((file.size - file.compressedSize) / file.size) * 100).toFixed(0)}%)
                      </span>
                      <Button variant="primary" onClick={() => downloadFile(file)} className="h-8 px-4 text-xs">
                        Download PDF
                      </Button>
                    </>
                  )}
                  <button onClick={() => handleRemoveFile(file.id)} className="text-xs text-slate-600 hover:text-red-400 px-2 transition">✕</button>
                </div>
              </div>

              {file.status === 'processing' && <ProgressBar progress={file.progress} status="processing" />}
              {file.status === 'error' && <StatusBadge type="error" label={file.errorMessage || 'Error'} />}
            </div>
          ))}
        </div>
      </ToolWrapper>

      <AdBanner slotId="pdf-reduce-footer" />
    </div>
  );
}
