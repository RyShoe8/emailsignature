'use client';

import { useState, useCallback } from 'react';
import { copyHtmlToClipboard } from '@/app/admin/signature/utils/clipboard';

type Props = {
  html: string;
  disabled?: boolean;
};

export function CopyButton({ html, disabled }: Props) {
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
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !html.trim()}
      style={{
        padding: '0.65rem 1.25rem',
        fontSize: '15px',
        fontWeight: 600,
        background: disabled ? '#ccc' : 'var(--sbd-brown, #5c4033)',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: '44px',
      }}
    >
      {copied ? 'Copied!' : 'Copy signature'}
    </button>
  );
}
