'use client';

import { useCallback, useState } from 'react';

export function useBulkSelection<T extends string | number>(items: ReadonlyArray<T>) {
  const [selected, setSelected] = useState<Set<T>>(new Set());
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const toggle = useCallback(
    (id: T, idx: number, shiftKey: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastIndex !== null) {
          const [from, to] = idx < lastIndex ? [idx, lastIndex] : [lastIndex, idx];
          for (let i = from; i <= to; i++) {
            const item = items[i];
            if (item !== undefined) next.add(item);
          }
        } else if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastIndex(idx);
    },
    [items, lastIndex]
  );

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items)));
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    count: selected.size,
    allSelected: items.length > 0 && selected.size === items.length,
    anySelected: selected.size > 0,
  };
}
