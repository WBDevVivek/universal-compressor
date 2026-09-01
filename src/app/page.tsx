'use client';

import Link from 'next/link';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTaskHistory } from '@/hooks/useTaskHistory';
import { useStorageSaved } from '@/hooks/useStorageSaved';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { Card } from '@/components/ui/Card';
import { AdBanner } from '@/components/shared/AdBanner';

export default function HomePage() {
  // PERSISTENCE LAYERS LINKING
  const { compressionLevel, soundAlert, setCompressionLevel, setSoundAlert, isHydrated } = useUserPreferences();
  const { history, clearHistory } = useTaskHistory();
  const { formattedSavings, resetSavingsCounter } = useStorageSaved();

  // Privacy Self-Destruct Action Execution
  const handleClearFootprints = () => {
    if (confirm('Are you completely sure you want to wipe all local metadata caches from this device?')) {
      clearHistory();
      resetSavingsCounter();
      localStorage.clear();
      alert('Privacy Footprints Wiped Successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-12">
      {/* Brand Hero Context Section */}
      <header className="text-center space-y-4 mb-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Universal Compressor
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium">
          Zero Server Uploads. Absolute Privacy. 100% Local Sandboxed Processing.
        </p>
      </header>

      {/* Real-time Dynamic Storage Metric Dashboard Banner */}
      {isHydrated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card className="text-center p-4 bg-emerald-950/10 border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Bandwidth Saved</p>
            <p className="text-xl font-black text-emerald-400 font-mono mt-1">{formattedSavings}</p>
          </Card>
          <Card className="text-center p-4 bg-indigo-950/10 border-indigo-500/20">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ghost Protection Mode</p>
            <p className="text-xl font-black text-indigo-400 mt-1">100% Secure RAM</p>
          </Card>
        </div>
      )}

      {/* Main Suite Micro Entry Grid Navigation */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Suite Core Modules">
        {/* Images pipeline vector link card */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-2xl text-blue-400">🖼️</div>
            <h2 className="text-base font-bold text-slate-100">Image Suite</h2>
            <p className="text-xs text-slate-400 leading-relaxed">Optimize JPG, PNG, and AVIF blocks. Includes dynamic metadata stripping and canvas edits.</p>
          </div>
          <Link href={TOOLS_CONFIG['image-hub'].path} className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition">
            Open Image Hub
          </Link>
        </Card>

        {/* PDF document vector link card */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-2xl text-indigo-400">Doc Hub</div>
            <h2 className="text-base font-bold text-slate-100">PDF Document Suite</h2>
            <p className="text-xs text-slate-400 leading-relaxed">Local merge sequence adjustments, page extractions, and compact compilation filters.</p>
          </div>
          <Link href={TOOLS_CONFIG['pdf-hub'].path} className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition">
            Open PDF Hub
          </Link>
        </Card>

        {/* Video stream vector link card */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-2xl text-purple-400">🎬</div>
            <h2 className="text-base font-bold text-slate-100">Video Lab Suite</h2>
            <p className="text-xs text-slate-400 leading-relaxed">MP4, MKV, and MOV parameters tracking coupled with dynamic remaining time estimators.</p>
          </div>
          <Link href={TOOLS_CONFIG['video-hub'].path} className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/20 text-xs font-semibold text-purple-400 hover:bg-purple-600 hover:text-white transition">
            Open Video Hub
          </Link>
        </Card>
      </section>

      <AdBanner slotId="homepage-middle-banner" />

      {/* Global Configuration Controls and Activity Panel Layout */}
      {isHydrated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Left panel: Preferences control dashboard view */}
          <Card className="space-y-5 bg-slate-900/10 border-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900/50 pb-2">Global Client Settings</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Default Quality Allocation Engine</label>
              <select value={compressionLevel} onChange={(e) => setCompressionLevel(e.target.value as 'high' | 'balanced' | 'maximum')} className="w-full h-9 px-2 text-xs rounded-lg border border-slate-900 bg-slate-950 text-slate-300 focus:outline-none">
                <option value="high">High Quality Retention (Fidelity Lock)</option>
                <option value="balanced">Balanced Engine Profile (Standard Size)</option>
                <option value="maximum">Maximum File Shrink (Extreme Compact)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-300">Auditory Synthesis Feedback</p>
                <p className="text-[10px] text-slate-500">Play tone alerts instantly upon optimization completion.</p>
              </div>
              <input type="checkbox" checked={soundAlert} onChange={(e) => setSoundAlert(e.target.checked)} className="rounded border-slate-900 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer" />
            </div>

            <div className="pt-2 border-t border-slate-900/40 flex justify-start">
              <button onClick={handleClearFootprints} className="text-[11px] font-bold text-red-500 hover:text-red-400 transition uppercase tracking-wide">
                ⚠️ Wipe My Local Footprints
              </button>
            </div>
          </Card>

          {/* Right panel: Task rolling repository summary list */}
          <Card className="space-y-4 bg-slate-900/10 border-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-900/50 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rolling Activity (24h)</h3>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Local Logs: {history.length}</span>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No tasks recorded inside this session window yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1" aria-label="Session logs list">
                {history.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-950">
                    <span className="text-slate-300 truncate max-w-[180px] font-medium">{item.fileName}</span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-slate-500 uppercase">{item.fileType}</span>
                      <span className="text-emerald-500 font-bold">Done</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
