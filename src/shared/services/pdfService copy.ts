interface PdfOptions {
  onProgress?: (progress: number) => void;
  pageIndices?: number[];
}

/**
 * Service Layer - Handles client-side PDF manipulation, merging, 
 * and structural deep-cleaning inside runtime memory.
 */
export class PdfService {
  /**
   * Compresses an existing PDF by extracting raw page nodes into a brand new 
   * document stream, dropping all unreferenced legacy bloat and history.
   */
  public static async compressPdf(file: File, options: PdfOptions = {}): Promise<Blob> {
    const { onProgress } = options;
    if (onProgress) onProgress(15);

    try {
      const { PDFDocument } = await import('pdf-lib');
      if (onProgress) onProgress(35);

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      
      // Fix: Creating a completely fresh document container to forcefully drop background bloat
      const freshCompressedDoc = await PDFDocument.create();
      if (onProgress) onProgress(55);

      // Copy all active pages sequentially into the new clean container
      const totalPages = srcDoc.getPageCount();
      const allIndices = Array.from({ length: totalPages }, (_, i) => i);
      const cleanPages = await freshCompressedDoc.copyPages(srcDoc, allIndices);
      
      cleanPages.forEach((page: unknown) => {
        freshCompressedDoc.addPage(page as unknown as never);
      });
      if (onProgress) onProgress(80);

      // Save using binary object streams optimization mapping
      const compressedBytes = await freshCompressedDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
    } catch (error) {
      console.error('Deep client-side PDF compression garbage collection failed:', error);
      throw new Error('Failed to optimize PDF asset structure within browser memory.');
    }
  }

  /**
   * Merges multiple isolated PDF binary streams into a single sequential master archive.
   */
  public static async mergePdfs(files: File[], options: PdfOptions = {}): Promise<Blob> {
    const { onProgress } = options;
    if (onProgress) onProgress(10);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedDoc = await PDFDocument.create();
      
      const totalFiles = files.length;
      if (onProgress) onProgress(30);

      for (let i = 0; i < totalFiles; i++) {
        const fileBuffer = await files[i].arrayBuffer();
        const srcDoc = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        
        copiedPages.forEach((page: unknown) => {
          mergedDoc.addPage(page as unknown as never);
        });

        if (onProgress) {
          const currentProgress = 30 + Math.floor(((i + 1) / totalFiles) * 60);
          onProgress(currentProgress);
        }
      }

      const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
    } catch (error) {
      console.error('Local client-side PDF merging failed:', error);
      throw new Error('Failed to combine specified PDF structures into a single file.');
    }
  }

  /**
   * Splits a source PDF by isolating specific page indices into a new independent array buffer.
   */
  public static async splitPdf(file: File, options: PdfOptions = {}): Promise<Blob> {
    const { onProgress, pageIndices = [] } = options;
    if (onProgress) onProgress(15);

    if (pageIndices.length === 0) {
      throw new Error('Extraction matrix array cannot be empty for splitting pipelines.');
    }

    try {
      const { PDFDocument } = await import('pdf-lib');
      if (onProgress) onProgress(40);

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const splitDoc = await PDFDocument.create();
      if (onProgress) onProgress(65);

      const copiedPages = await splitDoc.copyPages(srcDoc, pageIndices);
      
      copiedPages.forEach((page: unknown) => {
        splitDoc.addPage(page as unknown as never);
      });
      if (onProgress) onProgress(85);

      const splitBytes = await splitDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([splitBytes as unknown as BlobPart], { type: 'application/pdf' });
    } catch (error) {
      console.error('Local client-side PDF structural splitting failed:', error);
      throw new Error('Failed to extract target page indices from source document blueprint.');
    }
  }
}
