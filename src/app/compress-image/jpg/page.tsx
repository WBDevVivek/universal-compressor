'use client';

import { useState, useEffect } from 'react';
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

export default function JpgCompressorPage() {
  const config = TOOLS_CONFIG['image-jpg'];
  
  // Persistence Hooks Mappings
  const { compressionLevel, soundAlert } = useUserPreferences();
  const { addTaskLog } = useTaskHistory();
  const { recordSavings } = useStorageSaved();

  // Functional Pipeline States
  const [files, setFiles] = useState<UnifiedFileObject[]>([]);
  const [activePreset, setActivePreset] = useState<string>('none');
  const [selectedFormat, setSelectedFormat] = useState<string>('image/jpeg');
  const [stripExif, setStripExif] = useState<boolean>(true);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Success audio alert mechanism triggers natively post lifecycle compilation
  const triggerSuccessAudio = () => {
    if (!soundAlert) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Crisp standard success frequency pitch
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio synthesis context creation blocked by browser privacy viewport layout:', e);
    }
  };

  // Safe file appending with criteria validation guards
  const handleFilesInput = (rawFiles: File[]) => {
    const validFiles = rawFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isValidExt = config?.allowedExtensions.includes(ext);
      const isValidSize = file.size <= (config?.maxUploadSizeMB || 30) * 1024 * 1024;
      return isValidExt && isValidSize;
    });

    if (validFiles.length === 0) return;

    const unifiedObjects = validFiles.map((file) => createUnifiedFile(file));
    setFiles((prev) => [...prev, ...unifiedObjects]);
  };

  // Hook systems activation layout mapping bindings
  useClipboardPaste({ onFilesPasted: handleFilesInput });

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const fileToClear = prev.find((f) => f.id === id);
      if (fileToClear) revokeFilePreview(fileToClear);
      return prev.filter((f) => f.id !== id);
    });
    if (editingFileId === id) setEditingFileId(null);
    if (activePreviewId === id) setActivePreviewId(null);
  };

  // Continuation template layout bridge

    // Continuation of JpgCompressorPage component logic layer
  const executeCompression = async (fileObj: UnifiedFileObject) => {
    if (fileObj.status === 'processing') return;

    setFiles((prev) =>
      prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing', progress: 10 } : f))
    );

    try {
      const finalQuality = mapPresetToQuality(compressionLevel);
      let targetMaxKB: number | undefined;

      if (activePreset !== 'none' && config?.presets) {
        const targetPreset = config.presets.find((p) => p.id === activePreset);
        if (targetPreset?.maxSizeKB) {
          targetMaxKB = targetPreset.maxSizeKB;
        }
      }

      let compressedBlob: Blob;
      
      if (targetMaxKB) {
        let lowerBound = 0.05;
        let upperBound = 0.95;
        let bestBlob: Blob | null = null;
        let iterations = 0;

        setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 40 } : f)));

        while (iterations < 5) {
          const currentTestQuality = (lowerBound + upperBound) / 2;
          const testBlob = await ImageService.compressImage(fileObj.rawFile, {
            quality: currentTestQuality,
            targetFormat: selectedFormat,
            stripMetadata: stripExif,
          });

          if ((testBlob.size / 1024) <= targetMaxKB) {
            bestBlob = testBlob;
            lowerBound = currentTestQuality;
          } else {
            upperBound = currentTestQuality;
          }
          iterations++;
        }

        compressedBlob = bestBlob || await ImageService.compressImage(fileObj.rawFile, {
          quality: 0.1,
          targetFormat: selectedFormat,
          stripMetadata: stripExif,
        });
      } else {
        compressedBlob = await ImageService.compressImage(fileObj.rawFile, {
          quality: finalQuality,
          targetFormat: selectedFormat,
          stripMetadata: stripExif,
          onProgress: (p) => {
            setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, progress: p } : f)));
          },
        });
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'success',
                progress: 100,
                compressedSize: compressedBlob.size,
                compressedBlob: compressedBlob,
                previewUrl: selectedFormat.startsWith('image/') ? URL.createObjectURL(compressedBlob) : f.previewUrl,
              }
            : f
        )
      );

      recordSavings(fileObj.size, compressedBlob.size);
      addTaskLog({
        fileName: fileObj.name,
        fileType: selectedFormat.split('/').pop()?.toUpperCase() || 'JPEG',
        originalSize: fileObj.size,
        compressedSize: compressedBlob.size,
      });
      
      triggerSuccessAudio();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Compression error';
      setFiles((prev) =>
        prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error', errorMessage: msg, progress: 0 } : f))
      );
    }
  };

  const downloadSingleFile = (fileObj: UnifiedFileObject) => {
    if (!fileObj.compressedBlob) return;
    const downloadUrl = URL.createObjectURL(fileObj.compressedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    const nameSegments = fileObj.name.split('.');
    const ext = selectedFormat.split('/').pop() || nameSegments.pop();
    a.download = `${nameSegments[0]}-optimized.${ext}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <DragDropOverlay onFilesDropped={handleFilesInput} />
      
      <ToolWrapper title={config?.title || ''} description={config?.description || ''}>
        {/* Configuration Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-900 bg-slate-950/40 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Target Output Preset</label>
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="w-full h-9 px-2 text-xs rounded-lg border border-slate-900 bg-slate-900 text-slate-200 focus:outline-none"
            >
              <option value="none">Standard Configuration</option>
              {config?.presets?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Convert Format On-the-Fly</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full h-9 px-2 text-xs rounded-lg border border-slate-900 bg-slate-900 text-slate-200 focus:outline-none"
            >
              <option value="image/jpeg">Convert to JPG/JPEG</option>
              <option value="image/png">Convert to PNG</option>
              <option value="image/webp">Convert to WebP</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5 pl-2">
            <input
              type="checkbox"
              id="exifStrip"
              checked={stripExif}
              onChange={(e) => setStripExif(e.target.checked)}
              className="rounded border-slate-900 bg-slate-900 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="exifStrip" className="text-xs font-semibold text-slate-400 cursor-pointer">
              Strip EXIF Privacy Data
            </label>
          </div>
        </div>

        {/* Upload Terminal Component */}
        <div className="p-8 rounded-xl border border-dashed border-slate-900 bg-slate-950/20 text-center space-y-4">
          <input
            type="file"
            id="fileUploadInput"
            multiple
            accept=".jpg,.jpeg"
            onChange={(e) => e.target.files && handleFilesInput(Array.from(e.target.files))}
            className="hidden"
          />
          <label htmlFor="fileUploadInput" className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
            Browse JPEG Files
          </label>
          <p className="text-[11px] text-slate-500">or drag and drop items here / paste anywhere via Ctrl+V</p>
        </div>

        {/* Real-time Render Queue */}
        <div className="mt-8 space-y-4">
          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">Size: {(file.size / 1024).toFixed(1)} KB</p>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'idle' && (
                    <Button variant="outline" onClick={() => executeCompression(file)} className="h-8 px-3 text-xs">
                      Optimize File
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
                      <Button variant="primary" onClick={() => downloadSingleFile(file)} className="h-8 px-3 text-xs">
                        Download
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setEditingFileId(editingFileId === file.id ? null : file.id)} className="h-8 px-2 text-xs">
                    ⚙️ Edit
                  </Button>
                  <button onClick={() => handleRemoveFile(file.id)} className="text-xs text-slate-600 hover:text-red-400 px-2 transition">
                    ✕
                  </button>
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

      <AdBanner slotId="jpg-footer-banner" />
    </div>
  );
}
