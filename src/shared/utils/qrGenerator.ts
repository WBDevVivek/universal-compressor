/**
 * Generates an instant base64 QR Code string utilizing browser runtime optimization.
 */
export async function generateQrCodeUrl(payload: string): Promise<string> {
  if (!payload) return '';

  try {
    // On-demand dynamic loading to minimize core layout blocking threads
        // @ts-expect-error - Suppresses missing @types/qrcode compilation block in client runtime
    const QRCode = (await import('qrcode')).default;
    
    const base64Url = await QRCode.toDataURL(payload, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a',  // Elegant Slate-900 mapping dark context
        light: '#ffffff', // Pure white core alignment
      },
    });

    return base64Url;
  } catch (error) {
    console.error('Dynamic localized QR rendering module failed:', error);
    return '';
  }
}
