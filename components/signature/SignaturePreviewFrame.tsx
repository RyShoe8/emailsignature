'use client';

import { useLayoutEffect, useRef, useState } from 'react';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
};

const MOBILE_FRAME_WIDTH = 360;

/**
 * Renders signature HTML in either a flexible desktop card or a phone-sized
 * mobile frame. The mobile variant:
 *   - constrains width to ~360px (no horizontal scroll)
 *   - relaxes root-table `max-width` so signatures with `max-width:600px`
 *     can flex down to the frame width
 *   - measures the natural content width and applies a CSS transform: scale
 *     when the content still exceeds the frame, so the entire signature
 *     remains visible without scrolling
 */
export function SignaturePreviewFrame({ html, animationKey = 0, variant = 'desktop' }: Props) {
  if (variant === 'mobile') {
    return <MobileSignaturePreviewFrame html={html} animationKey={animationKey} />;
  }

  return (
    <div className="max-w-full w-full min-w-0">
      <div
        key={animationKey}
        className="signature-email-preview rounded-md border bg-white p-6 text-left overflow-x-auto overflow-y-visible min-h-[280px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function MobileSignaturePreviewFrame({ html, animationKey }: { html: string; animationKey: string | number }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      if (!frameRef.current || !contentRef.current) return;
      const frameW = frameRef.current.clientWidth || MOBILE_FRAME_WIDTH;
      // scrollWidth reports intrinsic size and is unaffected by CSS transforms.
      const naturalW = contentRef.current.scrollWidth;
      const naturalH = contentRef.current.scrollHeight;
      const nextScale = naturalW > 0 ? Math.min(1, frameW / naturalW) : 1;
      setScale(nextScale);
      setScaledHeight(naturalH > 0 ? Math.ceil(naturalH * nextScale) : null);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(frame);
    ro.observe(content);
    window.addEventListener('resize', measure);
    const onLoad = () => measure();
    content.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', onLoad, { once: true });
    });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [html, animationKey]);

  return (
    <div
      ref={frameRef}
      className="signature-email-preview signature-email-preview--mobile rounded-md border bg-white p-4 text-left overflow-hidden"
      style={{ width: MOBILE_FRAME_WIDTH, maxWidth: '100%', minHeight: 200 }}
    >
      <div
        key={animationKey}
        style={{
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          width: scale < 1 ? `${100 / scale}%` : '100%',
          height: scaledHeight !== null ? scaledHeight / scale : 'auto',
        }}
      >
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
