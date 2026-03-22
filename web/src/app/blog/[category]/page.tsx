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
        <h1 className="text-4xl font-black tracking-tight text-text-primary font-heading">
          {categoryEmoji(category)} {category}
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed mt-3">
          {category}에 대한 전문 정보와 가이드
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <Link
          href="/blog"
          className="rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300 border border-[hsl(var(--gold)/0.2)] text-text-secondary bg-transparent hover:bg-gold/10 hover:text-gold hover:border-gold/30 no-underline"
        >
          전체
        </Link>
        {BLOG_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/blog/${getCategorySlug(cat)}`}
            className={`rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300 no-underline ${
              cat === category
                ? 'bg-gradient-to-r from-gold to-gold-soft text-background font-bold shadow-[0_4px_20px_hsl(var(--gold)/0.15)]'
                : 'border border-[hsl(var(--gold)/0.2)] text-text-secondary bg-transparent hover:bg-gold/10 hover:text-gold hover:border-gold/30'
            }`}
          >
            {categoryEmoji(cat)} {cat}
          </Link>
        ))}
      </div>

      {/* Blog grid */}
      {posts.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8 text-center">
          <p className="text-text-secondary">아직 작성된 글이 없습니다.</p>
          <Link
            href="/blog"
            className="mt-4 inline-block rounded-full px-8 py-3 bg-gradient-to-r from-gold to-gold-soft text-background font-bold font-heading no-underline"
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
              <article className="flex flex-col h-full bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-[hsl(var(--gold)/0.25)] hover:shadow-[0_8px_32px_hsl(var(--gold)/0.08)]">
                {/* Thumbnail placeholder */}
                <div className="w-full h-[160px] bg-gradient-to-br from-surface to-surface-hover rounded-xl mb-6 flex items-center justify-center text-5xl">
                  {categoryEmoji(post.category)}
                </div>

                {/* Category badge */}
                <div className="mb-3">
                  <span className={`inline-block text-xs font-heading font-bold rounded-full px-3 py-1 border ${CATEGORY_COLORS[post.category]}`}>
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="m-0 font-heading font-bold text-lg text-text-primary group-hover:text-gold transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-text-secondary text-sm leading-relaxed mt-3 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Date & Author */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[hsl(var(--gold)/0.08)]">
                  <span className="text-xs text-text-secondary/70">{formatDate(post.publishedAt)}</span>
                  <span className="text-xs text-text-secondary/70">{post.author}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
