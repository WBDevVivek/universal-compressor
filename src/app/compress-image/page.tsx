import Link from 'next/link';
import { TOOLS_CONFIG } from '@/config/toolsConfig';

/**
 * Image Hub Landing Page - Displays specialized dynamic route entry vectors
 * for target image optimization sub-pipelines.
 */
export default function ImageHubPage() {
  const hubData = TOOLS_CONFIG['image-hub'];
  
  // Extracting specific formats nodes from central configuration registry
  const formatCards = [
    { config: TOOLS_CONFIG['image-jpg'], color: 'border-blue-500/20 hover:border-blue-500/50', chip: 'Highly Compatible' },
    { config: TOOLS_CONFIG['image-png'], color: 'border-emerald-500/20 hover:border-emerald-500/50', chip: 'Lossless Transparancy' },
    { config: TOOLS_CONFIG['image-avif'], color: 'border-purple-500/20 hover:border-purple-500/50', chip: 'Next-Gen Bitrate' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-12">
      {/* Header Context Branding */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
          {hubData?.title || 'Image Optimization Sandbox'}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {hubData?.description || 'Browser-driven compression suite without privacy vulnerabilities.'}
        </p>
      </header>

      {/* Target Format Sub-Route Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Image Tools Varieties">
        {formatCards.map((card) => {
          if (!card.config) return null;

          return (
            <article 
              key={card.config.path}
              className={`flex flex-col justify-between p-6 rounded-2xl border bg-slate-900/10 backdrop-blur-sm transition-all duration-300 ${card.color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl" aria-hidden="true">
                    {card.config.icon}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {card.chip}
                  </span>
                </div>
                
                <h2 className="text-base font-bold text-slate-200">{card.config.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{card.config.description}</p>
                
                <div className="text-[11px] font-medium text-slate-500 font-mono pt-1">
                  Upload Constraint: Max {card.config.maxUploadSizeMB}MB
                </div>
              </div>

              <Link 
                href={card.config.path}
                className="mt-6 w-full inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                Open {card.config.title.split(' ')[0]} Tool
              </Link>
            </article>
          );
        })}
      </section>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 text-center max-w-xl mx-auto">
        <p className="text-[11px] font-medium text-slate-500">
          💡 <span className="text-slate-400 font-semibold">Note:</span> Selecting a specific tool above unlocks premium target presets like government job portal attachment overrides (<span className="text-indigo-400 font-mono">&lt;20KB / 50KB</span>) natively.
        </p>
      </div>
    </div>
  );
}
