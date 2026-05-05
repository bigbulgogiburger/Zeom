import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BLOG_CATEGORIES,
  CATEGORY_COLORS,
  getCategoryFromSlug,
  getCategorySlug,
  getPostsByCategory,
} from '../blog-data';
import { EmptyState } from '@/components/design';

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
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-16">
      <header className="mb-12">
        <h1 className="font-heading text-4xl font-bold text-[hsl(var(--gold))]">
          {category}
        </h1>
        <p className="mt-3 text-base text-[hsl(var(--text-secondary))]">
          {category}에 대한 전문 정보와 가이드
        </p>
      </header>

      <nav aria-label="카테고리" className="flex flex-wrap gap-3 mb-12">
        <Link
          href="/blog"
          className="rounded-full px-5 py-2 text-sm font-heading font-medium no-underline border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold)/0.4)] hover:text-[hsl(var(--gold))] transition-colors"
        >
          전체
        </Link>
        {BLOG_CATEGORIES.map((cat) => {
          const isActive = cat === category;
          return (
            <Link
              key={cat}
              href={`/blog/${getCategorySlug(cat)}`}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'rounded-full px-5 py-2 text-sm font-heading font-bold no-underline bg-[hsl(var(--gold))] text-[hsl(var(--background))]'
                  : 'rounded-full px-5 py-2 text-sm font-heading font-medium no-underline border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold)/0.4)] hover:text-[hsl(var(--gold))] transition-colors'
              }
            >
              {cat}
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <EmptyState
          title="아직 작성된 글이 없어요"
          body={`${category} 카테고리의 새 글을 준비 중입니다. 다른 카테고리도 둘러보세요.`}
          cta={{ label: '전체 글 보기', href: '/blog' }}
        />
      ) : (
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${getCategorySlug(post.category)}/${post.slug}`}
              className="group no-underline"
            >
              <article className="flex flex-col h-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--gold)/0.3)] transition-colors">
                <div className="w-full aspect-[16/9] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border-subtle))] rounded-xl mb-5 flex items-center justify-center">
                  <span className="font-heading text-3xl text-[hsl(var(--gold-soft))]">
                    {post.category.charAt(0)}
                  </span>
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-block text-xs font-heading font-bold rounded-full px-3 py-1 border ${CATEGORY_COLORS[post.category]}`}
                  >
                    {post.category}
                  </span>
                </div>

                <h2 className="m-0 font-heading font-bold text-lg text-[hsl(var(--text-primary))] group-hover:text-[hsl(var(--gold))] transition-colors line-clamp-2">
                  {post.title}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--text-secondary))] flex-1 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[hsl(var(--border-subtle))]">
                  <span className="text-xs text-[hsl(var(--text-muted))]">
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="text-xs text-[hsl(var(--text-muted))]">{post.author}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
