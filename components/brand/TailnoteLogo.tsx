import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/images/tailnote-logo.jpg';

type Props = {
  className?: string;
  /** Visual height in Tailwind terms; width follows intrinsic aspect ratio */
  heightClass?: string;
  priority?: boolean;
};

/** Horizontal wordmark (icon + “Tailnote”); JPEG in /public/images/tailnote-logo.jpg */
export function TailnoteLogo({ className, heightClass = 'h-8', priority = false }: Props) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Tailnote"
      width={200}
      height={56}
      priority={priority}
      className={cn('w-auto object-contain object-left', heightClass, className)}
    />
  );
}
