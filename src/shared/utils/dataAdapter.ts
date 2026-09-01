/**
 * Unified Blueprint Structure representing any media file within the browser session memory.
 */
export interface UnifiedFileObject {
  id: string;
  name: string;
  type: string;
  size: number;
  rawFile: File;
  previewUrl?: string;
  compressedSize?: number;
  compressedBlob?: Blob;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

/**
 * Transforms a raw native browser File object into our standard unified schema model.
 */
export function createUnifiedFile(file: File): UnifiedFileObject {
  const isImage = file.type.startsWith('image/');
  
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    rawFile: file,
    // Generate low-cost native memory safe pointers for image preview modules
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    status: 'idle',
    progress: 0,
  };
}

/**
 * Destroys explicit blob preview references to prevent memory leaks in browser runtime RAM.
 */
export function revokeFilePreview(fileObj: UnifiedFileObject): void {
  if (fileObj.previewUrl) {
    URL.revokeObjectURL(fileObj.previewUrl);
  }
}
