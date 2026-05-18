type Props = {
  html: string;
  className?: string;
};

/** Scaled-down signature HTML preview for marketing pages. */
export function MarketingSignaturePreview({ html, className }: Props) {
  return (
    <div
      className={
        className ??
        'signature-email-preview overflow-hidden rounded-md border bg-white text-left'
      }
    >
      <div className="overflow-x-auto overflow-y-hidden" style={{ height: 220 }}>
        <div
          style={{
            minWidth: 660,
            transform: 'scale(0.68)',
            transformOrigin: 'top left',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
