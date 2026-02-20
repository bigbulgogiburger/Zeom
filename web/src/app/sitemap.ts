import type { MetadataRoute } from 'next';
import { blogPosts, BLOG_CATEGORIES, getCategorySlug } from './blog/blog-data';

const BASE_URL = 'https://www.cheonjiyeon.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/counselors`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Blog category pages
  const categoryPages: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/blog/${getCategorySlug(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${getCategorySlug(post.category)}/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Dynamically fetch counselor IDs for individual pages
  let counselorPages: MetadataRoute.Sitemap = [];
  try {
    const apiBase = process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
    const res = await fetch(`${apiBase}/api/v1/counselors`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const counselors: { id: number }[] = await res.json();
      counselorPages = counselors.map((c) => ({
        url: `${BASE_URL}/counselors/${c.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // If backend is unavailable, skip dynamic pages
  }

  return [...staticPages, ...categoryPages, ...blogPages, ...counselorPages];
}
