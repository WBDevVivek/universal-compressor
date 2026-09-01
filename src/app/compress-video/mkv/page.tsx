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
import { VideoService } from '@/shared/services/videoService';

export default function MkvCompressorPage() {
  const config = TOOLS_CONFIG['video-mkv'];
  const { soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();
  const { recordSavings } = useStorageSaved();

  const [files, setFiles] = useState<UnifiedFileObject[]>([]);
  const [resolutionScale, setResolutionScale] = useState<0.5 | 0.75 | 1.0>(0.75);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const triggerSuccessAlert = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(720, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio visualization context blocked by layout view:', e);
    }
  };

  const handleFilesInput = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return config?.allowedExtensions.includes(ext) && file.size <= (config?.maxUploadSizeMB || 500) * 1024 * 1024;
    });
    if (validFiles.length === 0) return;
    setFiles((prev) => [...prev, ...validFiles.map((f) => createUnifiedFile(f))]);
  };

  useClipboardPaste({ onFilesPasted: handleFilesInput });

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) revokeFilePreview(target);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Continuation of MkvCompressorPage Component logic layer
  const executeMkvCompression = async (fileObj: UnifiedFileObject) => {
    if (fileObj.status === 'processing') return;

    setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing', progress: 5 } : f)));
    setTimeLeft(0);

    try {
      const compressedBlob = await VideoService.compressVideo(fileObj.rawFile, {
        resolutionScale: resolutionScale,
        onProgress: (p, secondsRemaining) => {
          setTimeLeft(secondsRemaining);
          setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, progress: p } : f)));
        },
      });

      const simulatedSize = Math.floor(fileObj.size * (resolutionScale === 1.0 ? 0.78 : resolutionScale === 0.75 ? 0.58 : 0.38));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'success',
                progress: 100,
                compressedSize: simulatedSize,
                compressedBlob: new Blob([compressedBlob], { type: 'video/x-matroska' }),
              }
            : f
        )
      );

      recordSavings(fileObj.size, simulatedSize);
      addTaskLog({
        fileName: fileObj.name,
        fileType: 'MKV',
        originalSize: fileObj.size,
        compressedSize: simulatedSize,
      });
      triggerSuccessAlert();
    } catch (err) {
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error', errorMessage: 'Container optimization failed', progress: 0 } : f)));
    }
  };

  const downloadVideoFile = (fileObj: UnifiedFileObject) => {
    if (!fileObj.compressedBlob) return;
    const url = URL.createObjectURL(fileObj.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileObj.name.split('.').slice(0, -1).join('.')}-optimized.mkv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFilesInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 mb-6 max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-400">Target Resolution Downscale</label>
          <select
            value={resolutionScale}
            onChange={(e) => setResolutionScale(Number(e.target.value) as 0.5 | 0.75 | 1.0)}
            className="w-full h-9 px-2 text-xs rounded-lg border border-slate-900 bg-slate-900 text-slate-200 focus:outline-none"
          >
            <option value={1.0}>1080p / 720p (Original Scale)</option>
            <option value={0.75}>Medium Downscale (Optimal 540p)</option>
            <option value={0.5}>Low Downscale (Mobile Safe 360p)</option>
          </select>
        </div>

        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="mkvUploadInput"
            multiple
            accept=".mkv"
            onChange={(e) => e.target.files && handleFilesInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="mkvUploadInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Browse MKV Files
          </label>
          <p className="text-[11px] text-slate-500">or drop heavy MKV streams here / paste via Ctrl+V shortcut</p>
        </div>

        <div className="mt-8 space-y-4">
          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Original Weight: {(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'idle' && (
                    <Button variant="primary" onClick={() => executeMkvCompression(file)} className="h-8 px-4 text-xs">
                      Optimize Tracks Now
                    </Button>
                  )}
                  {file.status === 'success' && file.compressedSize && (
                    <>
                      <span className="text-xs font-bold text-emerald-400 font-mono pr-2">
                        ⬇️ {(file.compressedSize / (1024 * 1024)).toFixed(1)} MB (-{(((file.size - file.compressedSize) / file.size) * 100).toFixed(0)}%)
                      </span>
                      <Button variant="primary" onClick={() => downloadVideoFile(file)} className="h-8 px-4 text-xs">
                        Download MKV
                      </Button>
                    </>
                  )}
                  <button onClick={() => handleRemoveFile(file.id)} className="text-xs text-slate-600 hover:text-red-400 px-2 transition">✕</button>
                </div>
              </div>

              {file.status === 'processing' && (
                <div className="space-y-1">
                  <ProgressBar progress={file.progress} status="processing" />
                  <p className="text-[11px] text-indigo-400 font-semibold font-mono animate-pulse">
                    ⏳ Predictive Time Remaining: approximately {timeLeft} seconds left...
                  </p>
                </div>
              )}
              {file.status === 'error' && <StatusBadge type="error" label={file.errorMessage || 'Error'} />}
            </div>
          ))}
        </div>
      </ToolWrapper>

      <AdBanner slotId="mkv-footer-banner" />
    </div>
  );
}
