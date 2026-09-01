import { UnifiedFileObject } from './dataAdapter';

/**
 * Bundles processed files into a single ZIP archive using asynchronous code splitting.
 */
export async function downloadAsZip(files: UnifiedFileObject[], archiveName = 'compressed-archive.zip'): Promise<void> {
  // Filter only successfully processed files containing valid compressed binary structures
  const validFiles = files.filter((f) => f.status === 'success' && f.compressedBlob);
  if (validFiles.length === 0) return;

  try {
    // Dynamic import to keep initial landing footprint under 15KB boundary limit
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Mapping memory streams into zip allocation tables
    validFiles.forEach((file) => {
      if (file.compressedBlob) {
        zip.file(file.name, file.compressedBlob);
      }
    });

    const contentBlob = await zip.generateAsync({ type: 'blob' });
    
    // Creating instant localized download execution context
    const downloadUrl = URL.createObjectURL(contentBlob);
    const triggerLink = document.createElement('a');
    triggerLink.href = downloadUrl;
    triggerLink.download = archiveName;
    
    document.body.appendChild(triggerLink);
    triggerLink.click();
    
    // Immediate memory cleanup safety cycle
    document.body.removeChild(triggerLink);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Asynchronous ZIP packaging framework failed:', error);
    throw new Error('Failed to generate local ZIP file packaging stream.');
  }
}
