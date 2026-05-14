'use client';

import { useCallback, useState } from 'react';
import { copyHtmlToClipboard } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';

type Props = {
  html: string;
  disabled?: boolean;
  label?: string;
};

export function CopySignatureButton({ html, disabled, label = 'Copy HTML' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim()) return;
    try {
      await copyHtmlToClipboard(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [html, disabled]);

  return (
    <Button type="button" variant="default" onClick={handleClick} disabled={disabled || !html.trim()}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
