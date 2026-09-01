import React from 'react';
import Link from 'next/link';

interface ImageLayoutProps {
  children: React.ReactNode;
}

/**
 * Isolated Image Layout - Wraps all underlying image formatting sub-routes 
 * with a standardized back-navigation system.
 */
export default function ImageLayout({ children }: ImageLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-slate-950">
      {/* Top Section Navigation Header */}
      <nav className="w-full max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between" aria-label="Sub-route Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-900"
        >
          ← Back to Dashboard Hub
        </Link>
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 font-mono">
          Isolated Image Hub
        </span>
      </nav>

      {/* Dynamic Nested View Injection */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
