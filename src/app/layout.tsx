import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Universal Client-Side Compressor | 100% Secure SaaS Web App',
  description: 'Compress images, PDFs, and videos locally in your browser. Zero server uploads, absolute privacy with Ghost Mode.',
  keywords: ['compress image', 'compress pdf', 'compress video', 'client-side compressor', 'local privacy web app'],
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root Layout - Defines the global HTML structure and theme boundary.
 * Future global providers (Theme, Drag-Drop, PWA) will wrap the children inside this body.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500/30">
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
          {/* Core viewport layer */}
          <main className="flex-1 flex flex-col justify-start">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
