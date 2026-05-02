'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EndCallModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function EndCallModal({ open, onCancel, onConfirm, loading = false }: EndCallModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent
        className="rounded-2xl border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-[hsl(var(--text-primary))]">
            상담을 종료하시겠어요?
          </DialogTitle>
          <DialogDescription className="text-sm text-[hsl(var(--text-muted))]">
            지금 종료하면 상담실을 떠나 후기 화면으로 이동합니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full px-5 font-heading text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--gold)/0.08)] hover:text-[hsl(var(--gold))]"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            className="rounded-full px-5 font-heading font-bold"
          >
            {loading ? '종료 중...' : '종료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
