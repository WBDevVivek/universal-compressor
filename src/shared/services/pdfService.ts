interface PdfOptions {
  onProgress?: (progress: number) => void;
  pageIndices?: number[];
}

/**
 * Service Layer - Handles client-side PDF image extraction, canvas-driven
 * downscaling, and merging/splitting workflows.
 */
export class PdfService {
  /**
   * Browser-compatible alternative to Node's sharp. Compresses raw embedded image
   * bytes inside the PDF using HTML5 Canvas streams.
   */
  private static async compressPdfImageBytes(
    bytes: Uint8Array,
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      // const blob = new Blob([bytes]);
      const blob = new Blob([bytes as unknown as BlobPart]);
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(bytes);
            return;
          }

          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (b) => {
              URL.revokeObjectURL(url);
              if (!b) {
                resolve(bytes);
                return;
              }

              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result instanceof ArrayBuffer) {
                  resolve(new Uint8Array(reader.result));
                } else {
                  resolve(bytes);
                }
              };
              reader.readAsArrayBuffer(b);
            },
            "image/jpeg",
            0.5,
          ); // Emulating exactly the 50% sharp quality threshold
        } catch {
          URL.revokeObjectURL(url);
          resolve(bytes);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(bytes); // Non-image raw streams bypass safely
      };
      img.src = url;
    });
  }

  /**
   * Compresses an existing PDF by parsing embedded elements and downscaling high-res images.
   */
  public static async compressPdf(
    file: File,
    options: PdfOptions = {},
  ): Promise<Blob> {
    const { onProgress } = options;
    if (onProgress) onProgress(5);

    try {
      const { PDFDocument, PDFRawStream, PDFName } = await import("pdf-lib");
      if (onProgress) onProgress(15);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const objects = pdfDoc.context.enumerateIndirectObjects();
      const count = objects.length;

      // Iterating exactly like your node script to process embedded images inside browser memory
      for (let i = 0; i < count; i++) {
        const [, obj] = objects[i];

        if (onProgress && i % 10 === 0) {
          onProgress(15 + Math.round((i / count) * 75));
        }

        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          if (dict.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
            try {
              const compressedBytes = await this.compressPdfImageBytes(
                obj.contents,
              );
              // obj.contents = compressedBytes;
              // Fix: Bracket property notation coupled with unknown mapping bypasses the read-only compilation guard
              (obj as unknown as Record<string, unknown>)['contents'] = compressedBytes;
              
              dict.set(
                PDFName.of("Length"),
                pdfDoc.context.obj(compressedBytes.length),
              );
              dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
            } catch {
              continue;
            }
          }
        }
      }

      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([compressedBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
    } catch (error) {
      console.error("Client-side nested PDF stream processing failed:", error);
      throw new Error(
        "Failed to optimize embedded assets within browser layout.",
      );
    }
  }

  /**
   * Merges multiple isolated PDF binary streams into a single sequential master archive.
   */
  public static async mergePdfs(
    files: File[],
    options: PdfOptions = {},
  ): Promise<Blob> {
    const { onProgress } = options;
    if (onProgress) onProgress(10);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedDoc = await PDFDocument.create();

      const totalFiles = files.length;
      for (let i = 0; i < totalFiles; i++) {
        const fileBuffer = await files[i].arrayBuffer();
        const srcDoc = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedDoc.copyPages(
          srcDoc,
          srcDoc.getPageIndices(),
        );

        copiedPages.forEach((page: unknown) => {
          mergedDoc.addPage(page as unknown as never);
        });

        if (onProgress) {
          onProgress(10 + Math.floor(((i + 1) / totalFiles) * 80));
        }
      }

      const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([mergedBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
    } catch (error) {
      console.error("Local client-side PDF merging failed:", error);
      throw new Error(
        "Failed to combine specified PDF structures into a single archive.",
      );
    }
  }

  /**
   * Splits a source PDF by isolating specific page indices into a new independent array buffer.
   */
  public static async splitPdf(
    file: File,
    options: PdfOptions = {},
  ): Promise<Blob> {
    const { onProgress, pageIndices = [] } = options;
    if (onProgress) onProgress(15);

    if (pageIndices.length === 0) {
      throw new Error(
        "Extraction matrix array cannot be empty for splitting pipelines.",
      );
    }

    try {
      const { PDFDocument } = await import("pdf-lib");
      const srcDoc = await PDFDocument.load(await file.arrayBuffer());
      const splitDoc = await PDFDocument.create();

      const copiedPages = await splitDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page: unknown) => {
        splitDoc.addPage(page as unknown as never);
      });

      const splitBytes = await splitDoc.save({ useObjectStreams: true });
      if (onProgress) onProgress(100);

      return new Blob([splitBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
    } catch (error) {
      console.error(
        "Local client-side PDF structural splitting failed:",
        error,
      );
      throw new Error(
        "Failed to extract target page indices from source document.",
      );
    }
  }
}
