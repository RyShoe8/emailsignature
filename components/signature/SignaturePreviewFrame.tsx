'use client';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
};

export function SignaturePreviewFrame({ html, animationKey = 0, variant = 'desktop' }: Props) {
  const maxW = variant === 'mobile' ? 'max-w-[320px]' : 'max-w-[640px]';
  return (
    <div className={maxW}>
      <div
        key={animationKey}
        className="rounded-md border bg-white p-4 text-left overflow-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
