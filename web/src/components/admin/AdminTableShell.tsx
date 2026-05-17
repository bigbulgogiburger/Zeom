'use client';

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type AdminTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row, idx: number) => ReactNode;
  /** numeric/시각/금액 컬럼 — tabular-nums 적용 */
  tabular?: boolean;
  className?: string;
  /** 최소 폭 (px). 모바일에서 가로 스크롤 안정성용 */
  minWidth?: number;
};

export type BulkAction = {
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'destructive' | 'default';
};

type AdminTableShellProps<Row> = {
  columns: ReadonlyArray<AdminTableColumn<Row>>;
  rows: ReadonlyArray<Row>;
  getRowKey: (row: Row, idx: number) => string;
  selectable?: boolean;
  selectedKeys?: ReadonlySet<string>;
  allSelected?: boolean;
  onToggleRow?: (key: string, idx: number, shiftKey: boolean) => void;
  onToggleAll?: () => void;
  onClearSelection?: () => void;
  bulkActions?: ReadonlyArray<BulkAction>;
  emptyState?: ReactNode;
  caption?: ReactNode;
  /** 행 클릭 핸들러 (체크박스 클릭은 stopPropagation으로 분리) */
  onRowClick?: (row: Row, idx: number) => void;
};

export function AdminTableShell<Row>({
  columns,
  rows,
  getRowKey,
  selectable = false,
  selectedKeys,
  allSelected,
  onToggleRow,
  onToggleAll,
  onClearSelection,
  bulkActions,
  emptyState,
  caption,
  onRowClick,
}: AdminTableShellProps<Row>) {
  const selectedCount = selectedKeys?.size ?? 0;
  const showBulkBar = selectable && selectedCount > 0 && (bulkActions?.length ?? 0) > 0;

  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {showBulkBar && (
        <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm">
          <span className="font-medium text-[hsl(var(--text-primary))]">
            <span className="tabular-nums">{selectedCount}</span>개 선택됨
          </span>
          <div className="flex items-center gap-2">
            {bulkActions?.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant ?? 'ghost'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
            {onClearSelection && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                aria-label="선택 해제"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}
      <Table className="text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader className="sticky top-0 z-10 bg-[hsl(var(--card))]">
          <TableRow className="border-b border-[hsl(var(--border))] hover:bg-transparent">
            {selectable && (
              <TableHead className="w-10 py-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onToggleAll?.()}
                  aria-label="모두 선택"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn('py-2.5 align-middle', col.tabular && 'tabular-nums', col.className)}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-[hsl(var(--text-secondary))]"
              >
                {emptyState ?? '표시할 데이터가 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => {
              const rowKey = getRowKey(row, idx);
              const isSelected = selectedKeys?.has(rowKey) ?? false;
              return (
                <TableRow
                  key={rowKey}
                  data-state={isSelected ? 'selected' : undefined}
                  onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row, idx);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  className={cn(
                    '[&_td]:py-2',
                    'even:bg-[hsl(var(--surface-2)/0.4)]',
                    onRowClick &&
                      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--card))]'
                  )}
                >
                  {selectable && (
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleRow?.(rowKey, idx, false)}
                        onClick={(e) => {
                          if ((e as React.MouseEvent).shiftKey) {
                            e.preventDefault();
                            onToggleRow?.(rowKey, idx, true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            onToggleRow?.(rowKey, idx, false);
                          }
                        }}
                        aria-label={`${rowKey} 선택`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(col.tabular && 'tabular-nums', col.className)}
                    >
                      {col.cell(row, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
