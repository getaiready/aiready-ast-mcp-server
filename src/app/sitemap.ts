import { MetadataRoute } from 'next';
import { PLATFORM_BASE_URL } from '@/lib/seo-schema';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/metrics', '/pricing', '/login'].map((route) => ({
    url: `${PLATFORM_BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
