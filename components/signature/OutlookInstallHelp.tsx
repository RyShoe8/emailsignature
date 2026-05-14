'use client';

import Link from 'next/link';

export function OutlookInstallHelp() {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Outlook</p>
      <p>
        Microsoft does not offer a supported public API to set your personal HTML signature from a website (Microsoft
        Graph cannot update signature HTML). Use copy-and-paste or install from a file.
      </p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          <strong>Outlook on the web:</strong> open{' '}
          <Link
            href="https://outlook.office.com/mail/options/mail/layout"
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Mail → Layout
          </Link>{' '}
          (path may differ slightly by tenant), then paste under Email signature.
        </li>
        <li>
          <strong>Outlook desktop (Windows):</strong> File → Options → Mail → Signatures… → paste under Edit signature.
        </li>
      </ol>
      <p className="text-xs">
        Use <strong>Copy rich text</strong> for best results in Outlook, or <strong>Download HTML</strong> if your IT
        policy prefers a file.
      </p>
    </div>
  );
}
