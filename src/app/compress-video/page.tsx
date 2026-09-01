import Link from 'next/link';
import { TOOLS_CONFIG } from '@/config/toolsConfig';

/**
 * Video Hub Landing Page - Displays structured vector cards mapping to
 * specific video encoding and bitrate optimization pipelines.
 */
export default function VideoHubPage() {
  const hubData = TOOLS_CONFIG['video-hub'];
  
  // Mapping specific video formats from central config registry
  const videoCards = [
    { config: TOOLS_CONFIG['video-mp4'], color: 'border-blue-500/20 hover:border-blue-500/50', tag: 'Standard MP4' },
    { config: TOOLS_CONFIG['video-mkv'], color: 'border-indigo-500/20 hover:border-indigo-500/50', tag: 'Multi-Track MKV' },
    { config: TOOLS_CONFIG['video-mov'], color: 'border-purple-500/20 hover:border-purple-500/50', tag: 'ProRes MOV' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-12">
      {/* Hero Context Core Title */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
          {hubData?.title || 'Video Encoding Sandbox'}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {hubData?.description || 'Browser-driven video compression suite with responsive memory buffering.'}
        </p>
      </header>

      {/* Feature Varieties Navigation Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Video Tools Options">
        {videoCards.map((card) => {
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
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 px-2 py-0.5 rounded bg-purple-500/5 border border-purple-500/10">
                    {card.tag}
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
                Launch Compressor
              </Link>
            </article>
          );
        })}
      </section>

      {/* Client-Side Processing Assurance Footer */}
      <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 text-center max-w-xl mx-auto">
        <p className="text-[11px] font-medium text-slate-500">
          🔒 <span className="text-slate-400 font-semibold">Security Note:</span> Heavy data streaming and predictive calculations are handled entirely within localized browser memory models.
        </p>
      </div>
    </div>
  );
}
