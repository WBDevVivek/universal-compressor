'use client';

import Link from 'next/link';

interface AdBannerProps {
  slotId?: string;
}

/**
 * Variable-Driven AdBanner Component - Toggles cleanly between cross-promotional internal components
 * and standard external monetization widgets (Google AdSense script rendering context).
 */
export function AdBanner({ slotId = 'default-slot' }: AdBannerProps) {
  // Toggle this environment variable to 'true' post-AdSense approval
  const isAdSenseApproved = process.env.NEXT_PUBLIC_ADSENSE_APPROVED === 'true';

  if (isAdSenseApproved) {
    return (
      <div className="w-full min-h-[90px] bg-transparent my-6 flex items-center justify-center overflow-hidden" data-slot={slotId}>
        {/* AdSense core engine placeholder */}
        <span className="text-[10px] tracking-wider text-slate-700 uppercase font-bold">Advertisement</span>
      </div>
    );
  }

  // Graceful fallback placeholder (Internal Cross-Promotion)
  return (
    <div className="w-full p-4 rounded-xl border border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
          ⚡
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-slate-200">Need Bulk Conversions?</p>
          <p className="text-[11px] text-slate-500">Combine multiple heavy streams instantly using client-side tool pipelines.</p>
        </div>
      </div>
      <Link
        href="/compress-pdf/merge"
        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition whitespace-nowrap bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10"
      >
        Explore PDF Merger
      </Link>
    </div>
  );
}
