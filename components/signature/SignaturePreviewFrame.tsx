'use client';

import { useLayoutEffect, useRef, useState } from 'react';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
  /** Mobile frame width in CSS px; stacked layout uses a slightly wider frame. */
  mobileFrameWidth?: number;
};

export const DEFAULT_MOBILE_FRAME_WIDTH = 360;
export const STACKED_MOBILE_FRAME_WIDTH = 385;

/**
 * Renders signature HTML in either a flexible desktop card or a phone-sized
 * mobile frame. The mobile variant:
 *   - constrains width (default 360px; wider when `mobileFrameWidth` is set for stacked)
 *   - measures intrinsic content width/height, scales down if needed
 *   - clips using an outer box sized to the scaled footprint so transforms do not
 *     spill past overflow:hidden (avoids right-edge clipping)
 */
export function SignaturePreviewFrame({
  html,
  animationKey = 0,
  variant = 'desktop',
  mobileFrameWidth = DEFAULT_MOBILE_FRAME_WIDTH,
}: Props) {
  if (variant === 'mobile') {
    return (
      <MobileSignaturePreviewFrame
        html={html}
        animationKey={animationKey}
        mobileFrameWidth={mobileFrameWidth}
      />
    );
  }

  return (
    <div className="max-w-full w-full min-w-0">
      <div className="signature-email-preview rounded-md border bg-white p-6 text-left overflow-x-auto overflow-y-visible min-h-[280px]">
        <div
          key={animationKey}
          style={{ minWidth: 640 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

function MobileSignaturePreviewFrame({
  html,
  animationKey,
  mobileFrameWidth,
}: {
  html: string;
  animationKey: string | number;
  mobileFrameWidth: number;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      if (!frameRef.current || !contentRef.current) return;
      const frameW = frameRef.current.clientWidth || mobileFrameWidth;
      const nw = Math.max(1, contentRef.current.scrollWidth);
      const nh = Math.max(1, contentRef.current.scrollHeight);
      const nextScale = nw > 0 ? Math.min(1, frameW / nw) : 1;
      setNaturalW(nw);
      setNaturalH(nh);
      setScale(nextScale);
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
  }, [html, animationKey, mobileFrameWidth]);

  const scaledW = Math.ceil(naturalW * scale);
  const scaledH = Math.ceil(naturalH * scale);

  return (
    <div
      ref={frameRef}
      className="signature-email-preview signature-email-preview--mobile sig-mobile-preview-container rounded-md border bg-white p-4 text-left"
      style={{ width: mobileFrameWidth, maxWidth: '100%', minHeight: 200 }}
    >
      <div
        style={{
          width: scaledW,
          maxWidth: '100%',
          height: scaledH,
          overflow: 'hidden',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          key={animationKey}
          style={{
            width: naturalW,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <div ref={contentRef} className="mobile-signature-scale-root" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
