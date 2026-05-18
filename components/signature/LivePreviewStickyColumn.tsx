'use client';

import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Keeps the live preview card pinned while the editor column scrolls (lg+). */
export function LivePreviewStickyColumn({ children, className }: Props) {
  return <div className={cn('min-w-0 lg:sticky lg:top-6 lg:z-10 lg:self-start', className)}>{children}</div>;
}
