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

/** Very simple markdown-to-HTML: headings, bold, lists, tables, paragraphs */
function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inTable = false;
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!inTable) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<table class="w-full text-sm border-collapse my-4">';
        inTable = true;
      }
      // Skip separator rows
      if (/^\|[-\s|:]+\|$/.test(trimmed)) continue;
      const cells = trimmed.split('|').filter(Boolean).map((c) => c.trim());
      const tag = html.includes('<tr>') ? 'td' : 'th';
      html += '<tr>' + cells.map((c) => `<${tag} class="border border-[hsl(var(--gold)/0.15)] px-3 py-2 text-left">${c}</${tag}>`).join('') + '</tr>';
      continue;
    }
    if (inTable && !trimmed.startsWith('|')) {
      html += '</table>';
      inTable = false;
    }

    // Empty line
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h4 class="font-heading font-bold text-base text-[hsl(var(--text-primary))] mt-6 mb-2">${trimmed.slice(5)}</h4>`;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3 class="font-heading font-bold text-lg text-[hsl(var(--text-primary))] mt-8 mb-3">${trimmed.slice(4)}</h3>`;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2 class="font-heading font-bold text-xl text-[hsl(var(--text-primary))] mt-10 mb-4">${trimmed.slice(3)}</h2>`;
      continue;
    }

    // List items
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="list-disc list-inside space-y-1.5 my-3 text-[hsl(var(--text-secondary))]">';
        inList = true;
      }
      const content = trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--text-primary))]">$1</strong>');
      html += `<li class="text-sm leading-relaxed">${content}</li>`;
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      const content = trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--text-primary))]">$1</strong>');
      html += `<p class="text-sm leading-relaxed text-[hsl(var(--text-secondary))] my-1.5">${trimmed.match(/^\d+/)![0]}. ${content}</p>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }

    // Regular paragraph
    const processed = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--text-primary))]">$1</strong>');
    html += `<p class="text-sm leading-relaxed text-[hsl(var(--text-secondary))] my-3">${processed}</p>`;
  }

  if (inList) html += '</ul>';
  if (inTable) html += '</table>';
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
    <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-text-secondary">
        <Link href="/blog" className="hover:text-gold transition-colors no-underline text-text-secondary">
          블로그
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/blog/${getCategorySlug(post.category)}`}
          className="hover:text-gold transition-colors no-underline text-text-secondary"
        >
          {post.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{post.title}</span>
      </nav>

      {/* Article header */}
      <header className="mb-10">
        <div className="mb-4">
          <span className={`inline-block text-xs font-heading font-bold rounded-full px-3 py-1 border ${CATEGORY_COLORS[post.category]}`}>
            {post.category}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[hsl(var(--text-primary))] font-heading leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary/70">
          <span>{formatDate(post.publishedAt)}</span>
          <span>{post.author}</span>
        </div>
      </header>

      {/* Article content */}
      <article
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* CTA */}
      <div className="mt-16 bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.15)] rounded-2xl p-8 sm:p-10 text-center">
        <h3 className="font-heading font-bold text-xl text-[hsl(var(--text-primary))] mb-3">
          전문 상담사와 1:1 화상 상담
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">
          천지연꽃신당의 검증된 상담사에게 정확한 상담을 받아보세요.
        </p>
        <Link
          href="/counselors"
          className="inline-block rounded-full px-8 py-3 bg-gradient-to-r from-gold to-gold-soft text-background font-bold font-heading transition-all hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)] no-underline"
        >
          상담사 보기
        </Link>
      </div>

      {/* Back to blog */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-text-secondary hover:text-gold transition-colors text-sm no-underline"
        >
          &larr; 블로그 목록으로
        </Link>
      </div>
    </main>
  );
}
