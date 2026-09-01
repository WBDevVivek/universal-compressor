import type { MetadataRoute } from 'next';

/**
 * Generates the dynamic XML sitemap for search engine optimization (SEO).
 * Contains all format-specific landing pages as defined in the project architecture.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://universal-compressor.com';

  // Explicitly mapping all structured routes from the blueprint
  const routes = [
    '',
    '/compress-image',
    '/compress-image/jpg',
    '/compress-image/png',
    '/compress-image/avif',
    '/compress-pdf',
    '/compress-pdf/merge',
    '/compress-pdf/split',
    '/compress-pdf/reduce',
    '/compress-video',
    '/compress-video/mp4',
    '/compress-video/mkv',
    '/compress-video/mov',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
