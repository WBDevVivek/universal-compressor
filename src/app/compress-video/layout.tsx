import React from 'react';
import Link from 'next/link';

interface VideoLayoutProps {
  children: React.ReactNode;
}

/**
 * Isolated Video Layout - Wraps all underlying video stream optimization sub-routes
 * with a unified back-navigation structure.
 */
export default function VideoLayout({ children }: VideoLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-slate-950">
      {/* Top Header Breadcrumb Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between" aria-label="Video Sub-route Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-900"
        >
          ← Back to Dashboard Hub
        </Link>
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 font-mono">
          Isolated Video Hub
        </span>
      </nav>

      {/* Dynamic Sub-Page View Injection Boundary */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
