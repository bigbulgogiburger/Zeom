'use client';

import { useState } from 'react';
import { Seg } from '@/components/design';

const items = [
  { key: 'all', label: '전체', count: 42 },
  { key: 'active', label: '진행중', count: 7 },
  { key: 'done', label: '완료', count: 35 },
] as const;

type Key = (typeof items)[number]['key'];

export function DesignSystemSegDemo() {
  const [value, setValue] = useState<Key>('all');
  return (
    <div className="space-y-3">
      <Seg<Key> items={items} value={value} onChange={setValue} ariaLabel="필터" />
      <p className="text-xs text-text-secondary">선택: <span className="tabular">{value}</span></p>
    </div>
  );
}
