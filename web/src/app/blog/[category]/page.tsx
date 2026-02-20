import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  blogPosts,
  BLOG_CATEGORIES,
  CATEGORY_COLORS,
  getCategoryFromSlug,
  getCategorySlug,
  getPostsByCategory,
} from '../blog-data';
import type { BlogCategory } from '../blog-data';

function categoryEmoji(category: BlogCategory): string {
  const map: Record<BlogCategory, string> = {
    사주: '🔮',
    타로: '🃏',
    꿈해몽: '🌙',
    운세: '⭐',
    상담가이드: '📋',
  };
  return map[category];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((cat) => ({ category: getCategorySlug(cat) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryFromSlug(slug);
  if (!category) return { title: '블로그' };

  return {
    title: `${category} 블로그`,
    description: `${category}에 대한 전문 정보와 가이드를 만나보세요.`,
    openGraph: {
      title: `${category} 블로그 | 천지연꽃신당`,
      description: `${category}에 대한 전문 정보와 가이드를 만나보세요.`,
      type: 'website',
      locale: 'ko_KR',
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategoryFromSlug(slug);
  if (!category) notFound();

  const posts = getPostsByCategory(category).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
          {categoryEmoji(category)} {category}
        </h1>
        <p className="text-[#a49484] text-lg leading-relaxed mt-3">
          {category}에 대한 전문 정보와 가이드
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <Link
          href="/blog"
          className="rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300 border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent hover:bg-[#C9A227]/10 hover:text-[#C9A227] hover:border-[#C9A227]/30 no-underline"
        >
          전체
        </Link>
        {BLOG_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/blog/${getCategorySlug(cat)}`}
            className={`rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300 no-underline ${
              cat === category
                ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold shadow-[0_4px_20px_rgba(201,162,39,0.15)]'
                : 'border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent hover:bg-[#C9A227]/10 hover:text-[#C9A227] hover:border-[#C9A227]/30'
            }`}
          >
            {categoryEmoji(cat)} {cat}
          </Link>
        ))}
      </div>

      {/* Blog grid */}
      {posts.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 text-center">
          <p className="text-[#a49484]">아직 작성된 글이 없습니다.</p>
          <Link
            href="/blog"
            className="mt-4 inline-block rounded-full px-8 py-3 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading no-underline"
          >
            전체 글 보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}
              className="group no-underline"
            >
              <article className="flex flex-col h-full bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-[rgba(201,162,39,0.25)] hover:shadow-[0_8px_32px_rgba(201,162,39,0.08)]">
                {/* Thumbnail placeholder */}
                <div className="w-full h-[160px] bg-gradient-to-br from-[#1a1612] to-[#2b2219] rounded-xl mb-6 flex items-center justify-center text-5xl">
                  {categoryEmoji(post.category)}
                </div>

                {/* Category badge */}
                <div className="mb-3">
                  <span className={`inline-block text-xs font-heading font-bold rounded-full px-3 py-1 border ${CATEGORY_COLORS[post.category]}`}>
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="m-0 font-heading font-bold text-lg text-[var(--color-text-on-dark)] group-hover:text-[#C9A227] transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-[#a49484] text-sm leading-relaxed mt-3 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Date & Author */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(201,162,39,0.08)]">
                  <span className="text-xs text-[#a49484]/70">{formatDate(post.publishedAt)}</span>
                  <span className="text-xs text-[#a49484]/70">{post.author}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
