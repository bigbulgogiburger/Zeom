import Image from 'next/image';
import { cn } from '@/lib/utils';

type PortraitSize = 'sm' | 'md' | 'lg' | 'xl';

interface CounselorLike {
  name: string;
  imageUrl?: string | null;
  avatarUrl?: string | null;
}

interface PortraitProps {
  counselor: CounselorLike;
  size?: PortraitSize;
  className?: string;
}

const sizePx: Record<PortraitSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export function Portrait({ counselor, size = 'md', className }: PortraitProps) {
  const px = sizePx[size];
  const src = counselor.imageUrl ?? counselor.avatarUrl ?? null;
  const initial = counselor.name?.charAt(0) ?? '?';

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full',
        'ring-1 ring-gold/40 bg-surface-2 text-text-primary font-heading',
        className,
      )}
      style={{ width: px, height: px, fontSize: px / 2.4 }}
      aria-label={counselor.name}
    >
      {src ? (
        <Image
          src={src}
          alt={counselor.name}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
