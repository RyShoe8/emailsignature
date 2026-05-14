'use client';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
};

export function SignaturePreviewFrame({ html, animationKey = 0, variant = 'desktop' }: Props) {
  const maxW =
    variant === 'mobile'
      ? 'max-w-full sm:max-w-md md:max-w-lg'
      : 'max-w-full w-full min-w-0';
  const minH = variant === 'mobile' ? 'min-h-[200px]' : 'min-h-[280px]';
  return (
    <div className={maxW}>
      <div
        key={animationKey}
        className={`rounded-md border bg-white p-6 text-left overflow-x-auto overflow-y-visible ${minH}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
