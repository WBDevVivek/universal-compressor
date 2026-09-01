'use client';

import { useState } from 'react';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { ToolWrapper } from '@/components/shared/ToolWrapper';
import { DragDropOverlay } from '@/components/shared/DragDropOverlay';
import { AdBanner } from '@/components/shared/AdBanner';
import { VisualCompare } from '@/components/shared/VisualCompare';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTaskHistory } from '@/hooks/useTaskHistory';
import { useStorageSaved } from '@/hooks/useStorageSaved';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { createUnifiedFile, UnifiedFileObject, revokeFilePreview } from '@/shared/utils/dataAdapter';
import { ImageService, mapPresetToQuality } from '@/shared/services/imageService';
import InlineEditor from '@/components/tools/image/InlineEditor';

export default function AvifCompressorPage() {
  const config = TOOLS_CONFIG['image-avif'];
  const { compressionLevel, soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();
  const { recordSavings } = useStorageSaved();

  const [files, setFiles] = useState<UnifiedFileObject[]>([]);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const playSuccessAlert = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(950, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio visualization context blocked by sandbox constraints:', e);
    }
  };

  const handleFilesInput = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return config?.allowedExtensions.includes(ext) && file.size <= (config?.maxUploadSizeMB || 25) * 1024 * 1024;
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
    if (editingFileId === id) setEditingFileId(null);
    if (activePreviewId === id) setActivePreviewId(null);
  };

  // Continuation of AvifCompressorPage Component logic layer
  const executeAvifCompression = async (fileObj: UnifiedFileObject) => {
    if (fileObj.status === 'processing') return;

    setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing', progress: 15 } : f)));

    try {
      const targetQuality = mapPresetToQuality(compressionLevel);
      
      const compressedBlob = await ImageService.compressImage(fileObj.rawFile, {
        quality: targetQuality,
        targetFormat: 'image/avif',
        stripMetadata: true,
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
                previewUrl: URL.createObjectURL(compressedBlob),
              }
            : f
        )
      );

      recordSavings(fileObj.size, compressedBlob.size);
      addTaskLog({
        fileName: fileObj.name,
        fileType: 'AVIF',
        originalSize: fileObj.size,
        compressedSize: compressedBlob.size,
      });
      playSuccessAlert();
    } catch (err) {
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error', errorMessage: 'Next-gen AVIF encoding mismatch', progress: 0 } : f)));
    }
  };

  const downloadFile = (fileObj: UnifiedFileObject) => {
    if (!fileObj.compressedBlob) return;
    const url = URL.createObjectURL(fileObj.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileObj.name.split('.').slice(0, -1).join('.')}-optimized.avif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFilesInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="avifUploadInput"
            multiple
            accept=".avif"
            onChange={(e) => e.target.files && handleFilesInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="avifUploadInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Browse AVIF Files
          </label>
          <p className="text-[11px] text-slate-500">or drop heavy modern items here / paste via Ctrl+V</p>
        </div>

        <div className="mt-8 space-y-4">
          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Original: {(file.size / 1024).toFixed(1)} KB</p>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'idle' && (
                    <Button variant="outline" onClick={() => executeAvifCompression(file)} className="h-8 px-3 text-xs">
                      Encode Next-Gen Bitstream
                    </Button>
                  )}
                  {file.status === 'success' && file.compressedSize && (
                    <>
                      <span className="text-xs font-bold text-emerald-400 font-mono pr-2">
                        ⬇️ {(file.compressedSize / 1024).toFixed(1)} KB (-{(((file.size - file.compressedSize) / file.size) * 100).toFixed(0)}%)
                      </span>
                      <Button variant="outline" onClick={() => setActivePreviewId(activePreviewId === file.id ? null : file.id)} className="h-8 px-3 text-xs">
                        {activePreviewId === file.id ? 'Hide Compare' : 'Compare Quality'}
                      </Button>
                      <Button variant="primary" onClick={() => downloadFile(file)} className="h-8 px-3 text-xs">
                        Download
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setEditingFileId(editingFileId === file.id ? null : file.id)} className="h-8 px-2 text-xs">
                    ⚙️ Edit
                  </Button>
                  <button onClick={() => handleRemoveFile(file.id)} className="text-xs text-slate-600 hover:text-red-400 px-2 transition">✕</button>
                </div>
              </div>

              {file.status === 'processing' && <ProgressBar progress={file.progress} status="processing" />}
              {file.status === 'error' && <StatusBadge type="error" label={file.errorMessage || 'Error'} />}

              {editingFileId === file.id && file.previewUrl && (
                <InlineEditor
                  imageSrc={file.previewUrl}
                  originalFile={file.rawFile}
                  onCancel={() => setEditingFileId(null)}
                  onSave={(updatedFile) => {
                    setEditingFileId(null);
                    setFiles((prev) => prev.map((f) => (f.id === file.id ? createUnifiedFile(updatedFile) : f)));
                  }}
                />
              )}

              {activePreviewId === file.id && file.previewUrl && file.compressedBlob && (
                <div className="max-w-xl mx-auto pt-2">
                  <VisualCompare originalSrc={URL.createObjectURL(file.rawFile)} compressedSrc={file.previewUrl} altText={file.name} />
                </div>
              )}
            </div>
          ))}
        </div>
      </ToolWrapper>

      <AdBanner slotId="avif-footer-banner" />
    </div>
  );
}
