type Props = {
  html: string;
  className?: string;
};

/** Full signature HTML preview for marketing pages (no clipped scroll regions). */
export function MarketingSignaturePreview({ html, className }: Props) {
  return (
    <div
      className={
        className ??
        'signature-email-preview rounded-md border bg-white p-3 text-left'
      }
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
