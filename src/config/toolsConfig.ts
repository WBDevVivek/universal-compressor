export interface ToolPreset {
  id: string;
  name: string;
  maxSizeKB?: number;
  description: string;
}

export interface ToolRouteConfig {
  path: string;
  title: string;
  description: string;
  icon: string;
  allowedExtensions: string[];
  maxUploadSizeMB: number;
  presets?: ToolPreset[];
}

/**
 * Global Configuration Registry - Centralized plug-and-play mapper for all 13 application routes.
 */
export const TOOLS_CONFIG: Record<string, ToolRouteConfig> = {
  // Image Compression Suite
  'image-hub': {
    path: '/compress-image',
    title: 'Image Optimization Sandbox',
    description: 'Local browser-based image compression with live layout comparisons.',
    icon: '🖼️',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'avif', 'webp'],
    maxUploadSizeMB: 50,
  },
  'image-jpg': {
    path: '/compress-image/jpg',
    title: 'JPEG Specific Optimizer',
    description: 'Targeted compression algorithm focused strictly on JPEG/JPG matrices.',
    icon: '📸',
    allowedExtensions: ['jpg', 'jpeg'],
    maxUploadSizeMB: 30,
    presets: [
      { id: 'gov-portal-20', name: 'Gov Portal (< 20KB)', maxSizeKB: 20, description: 'Strict compliance for official document attachments.' },
      { id: 'gov-portal-50', name: 'Gov Portal (< 50KB)', maxSizeKB: 50, description: 'Standard passport/signature upload constraint.' },
    ],
  },
  'image-png': {
    path: '/compress-image/png',
    title: 'PNG Alpha Compressor',
    description: 'Lossless bitstream optimization while keeping alpha channel transparency intact.',
    icon: '🎨',
    allowedExtensions: ['png'],
    maxUploadSizeMB: 40,
  },
  'image-avif': {
    path: '/compress-image/avif',
    title: 'AVIF Next-Gen Encoder',
    description: 'Highly efficient modern layout encoding utilizing custom web workers.',
    icon: '🚀',
    allowedExtensions: ['avif'],
    maxUploadSizeMB: 25,
  },

  // PDF Document Engineering Suite
  'pdf-hub': {
    path: '/compress-pdf',
    title: 'PDF Pipeline Hub',
    description: 'Local RAM buffering layer to manage, merge, split, and shrink document architectures.',
    icon: '📄',
    allowedExtensions: ['pdf'],
    maxUploadSizeMB: 100,
  },
  'pdf-merge': {
    path: '/compress-pdf/merge',
    title: 'PDF Multi-Stream Merger',
    description: 'Combine distinct file fragments into a single structured compilation array.',
    icon: '🗂️',
    allowedExtensions: ['pdf'],
    maxUploadSizeMB: 150,
  },
  'pdf-split': {
    path: '/compress-pdf/split',
    title: 'PDF Structural Splitter',
    description: 'Isolate page blocks or extract explicit indices completely client-side.',
    icon: '✂️',
    allowedExtensions: ['pdf'],
    maxUploadSizeMB: 100,
  },
  'pdf-reduce': {
    path: '/compress-pdf/reduce',
    title: 'PDF Size Reduction Engine',
    description: 'Downscale complex embedded vector profiles and image layers safely.',
    icon: '📉',
    allowedExtensions: ['pdf'],
    maxUploadSizeMB: 100,
    presets: [
      { id: 'email-safe', name: 'Email Attachment (< 25MB)', description: 'Compresses large presentation decks to clear server rules.' },
    ],
  },

  // Video Streaming Optimization Suite
  'video-hub': {
    path: '/compress-video',
    title: 'Video Encoding Lab',
    description: 'Client-side media block transformation framework with predictive calculations.',
    icon: '🎬',
    allowedExtensions: ['mp4', 'mkv', 'mov'],
    maxUploadSizeMB: 500,
  },
  'video-mp4': {
    path: '/compress-video/mp4',
    title: 'MP4 Bitrate Governor',
    description: 'H.264/H.265 compression sandbox mapped using chunked array streaming.',
    icon: '📹',
    allowedExtensions: ['mp4'],
    maxUploadSizeMB: 500,
  },
  'video-mkv': {
    path: '/compress-video/mkv',
    title: 'MKV Container Optimizer',
    description: 'Compress tracks while preserving multiple local subtitle streams.',
    icon: '🎥',
    allowedExtensions: ['mkv'],
    maxUploadSizeMB: 500,
  },
  'video-mov': {
    path: '/compress-video/mov',
    title: 'ProRes MOV Downscaler',
    description: 'Optimize Apple MOV container properties inside native memory allocation limits.',
    icon: '🍏',
    allowedExtensions: ['mov'],
    maxUploadSizeMB: 400,
  },
};

/**
 * Helper utility to securely resolve runtime path mapping to a configuration node.
 */
export function getToolConfigByPath(currentPath: string): ToolRouteConfig | undefined {
  return Object.values(TOOLS_CONFIG).find((config) => config.path === currentPath);
}
