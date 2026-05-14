import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/images/tailnote-logo.png';

type Props = {
  className?: string;
  /** Visual height in Tailwind terms; width follows intrinsic aspect ratio */
  heightClass?: string;
  priority?: boolean;
};

/** Horizontal wordmark (icon + “Tailnote”); transparent PNG in /public/images/tailnote-logo.png */
export function TailnoteLogo({ className, heightClass = 'h-10', priority = false }: Props) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Tailnote"
      width={1024}
      height={558}
      priority={priority}
      className={cn('w-auto object-contain object-left', heightClass, className)}
    />
  );
}
