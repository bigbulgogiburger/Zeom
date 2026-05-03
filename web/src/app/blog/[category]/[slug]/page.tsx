import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  blogPosts,
  CATEGORY_COLORS,
  getCategoryFromSlug,
  getCategorySlug,
  getPostBySlug,
} from '../../blog-data';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    category: getCategorySlug(post.category),
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '블로그' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | 천지연꽃신당`,
      description: post.excerpt,
      type: 'article',
      locale: 'ko_KR',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: [post.category, '점술', '상담'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderInline(input: string): string {
  return escapeHtml(input).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inTable = false;
  let tableHeader = true;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
    if (inOl) {
      html += '</ol>';
      inOl = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      html += '</tbody></table>';
      inTable = false;
      tableHeader = true;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeLists();
      if (!inTable) {
        html += '<table><thead>';
        inTable = true;
        tableHeader = true;
      }
      if (/^\|[-\s|:]+\|$/.test(trimmed)) {
        if (tableHeader) {
          html += '</thead><tbody>';
          tableHeader = false;
        }
        continue;
      }
      const cells = trimmed
        .split('|')
        .filter((c) => c.length > 0)
        .map((c) => c.trim());
      const tag = tableHeader ? 'th' : 'td';
      html += '<tr>' + cells.map((c) => `<${tag}>${renderInline(c)}</${tag}>`).join('') + '</tr>';
      continue;
    }
    closeTable();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      closeLists();
      html += `<h4>${renderInline(trimmed.slice(5))}</h4>`;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      closeLists();
      html += `<h3>${renderInline(trimmed.slice(4))}</h3>`;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeLists();
      html += `<h2>${renderInline(trimmed.slice(3))}</h2>`;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${renderInline(trimmed.slice(2))}</li>`;
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (!inOl) {
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${renderInline(trimmed.replace(/^\d+\.\s/, ''))}</li>`;
      continue;
    }

    closeLists();
    html += `<p>${renderInline(trimmed)}</p>`;
  }

  closeLists();
  closeTable();
  return html;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;
  const category = getCategoryFromSlug(categorySlug);
  if (!category) notFound();

  const post = getPostBySlug(slug);
  if (!post || post.category !== category) notFound();

  const contentHtml = renderMarkdown(post.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: '천지연꽃신당',
      url: 'https://www.cheonjiyeon.com',
    },
  };

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="경로" className="mb-8 text-sm text-[hsl(var(--text-secondary))]">
        <Link
          href="/blog"
          className="text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] transition-colors no-underline"
        >
          블로그
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/blog/${getCategorySlug(post.category)}`}
          className="text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] transition-colors no-underline"
        >
          {post.category}
        </Link>
      </nav>

      <header className="mb-10">
        <div className="mb-4">
          <span
            className={`inline-block text-xs font-heading font-bold rounded-full px-3 py-1 border ${CATEGORY_COLORS[post.category]}`}
          >
            {post.category}
          </span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight text-[hsl(var(--gold))]">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mt-6 text-sm text-[hsl(var(--text-muted))]">
          <span>{formatDate(post.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.author}</span>
        </div>
      </header>

      <article className="prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />

      <aside className="mt-16 bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-8 text-center">
        <h3 className="font-heading font-bold text-xl text-[hsl(var(--gold))]">
          전문 상담사와 1:1 화상 상담
        </h3>
        <p className="mt-3 text-sm text-[hsl(var(--text-secondary))]">
          천지연꽃신당의 검증된 상담사에게 정확한 상담을 받아보세요.
        </p>
        <Link
          href="/counselors"
          className="mt-6 inline-block rounded-full px-8 py-3 bg-[hsl(var(--gold))] text-[hsl(var(--background))] font-heading font-bold no-underline hover:bg-[hsl(var(--gold-soft))] transition-colors"
        >
          상담사 보기
        </Link>
      </aside>

      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] no-underline transition-colors"
        >
          ← 블로그 목록으로
        </Link>
      </div>
    </main>
  );
}
