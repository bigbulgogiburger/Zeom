'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/design';
import type { FaqData } from './page';

interface FaqListProps {
  data: FaqData;
}

function normalize(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('ko');
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const target = normalize(text);
  const needle = normalize(query);
  const idx = target.indexOf(needle);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] px-0.5 rounded">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function FaqList({ data }: FaqListProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return data;
    const needle = normalize(deferredQuery);
    const result: FaqData = {};
    for (const [category, items] of Object.entries(data)) {
      const matched = items.filter(
        (item) => normalize(item.q).includes(needle) || normalize(item.a).includes(needle),
      );
      if (matched.length > 0) {
        result[category] = matched;
      }
    }
    return result;
  }, [data, deferredQuery]);

  const hasResults = Object.keys(filtered).length > 0;

  return (
    <div>
      <div className="relative mb-10">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[hsl(var(--text-muted))]"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="질문 검색..."
          aria-label="FAQ 검색"
          className="pl-11 h-12 text-base"
        />
      </div>

      {hasResults ? (
        <div className="space-y-12">
          {Object.entries(filtered).map(([category, items]) => (
            <section key={category} aria-labelledby={`faq-cat-${category}`}>
              <h2
                id={`faq-cat-${category}`}
                className="font-heading text-lg font-bold text-[hsl(var(--gold-soft))] mb-3"
              >
                {category}
              </h2>
              <Accordion
                type="single"
                collapsible
                className="border border-[hsl(var(--border-subtle))] rounded-xl bg-[hsl(var(--surface))] divide-y divide-[hsl(var(--border-subtle))]"
              >
                {items.map((item, idx) => (
                  <AccordionItem
                    key={`${category}-${idx}`}
                    value={`${category}-${idx}`}
                    className="px-4 first:rounded-t-xl last:rounded-b-xl border-b-0"
                  >
                    <AccordionTrigger>{highlight(item.q, deferredQuery)}</AccordionTrigger>
                    <AccordionContent>{highlight(item.a, deferredQuery)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="검색 결과가 없어요"
          body={`"${query}"에 대한 답변을 찾을 수 없습니다. 다른 키워드로 검색하시거나 고객센터로 문의해 주세요.`}
        />
      )}
    </div>
  );
}
