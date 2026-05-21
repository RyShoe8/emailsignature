'use client';

import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminFeedbackRow } from '@/lib/admin/feedback';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadgeVariant(status: AdminFeedbackRow['status']): 'default' | 'accent' | 'outline' {
  if (status === 'new') return 'accent';
  if (status === 'read') return 'default';
  return 'outline';
}

function typeLabel(type: AdminFeedbackRow['type']): string {
  return type === 'bug' ? 'Bug' : 'Feature';
}

export function FeedbackAdminTable({ initialSubmissions }: { initialSubmissions: AdminFeedbackRow[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: AdminFeedbackRow['status']) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        submission?: AdminFeedbackRow;
      };
      if (!res.ok || !data.submission) {
        setError(data.error ?? 'Failed to update status');
        return;
      }
      setSubmissions((prev) => prev.map((s) => (s.id === id ? data.submission! : s)));
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="overflow-x-auto rounded-md border min-w-0">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Organization</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium w-24" />
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No feedback submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => {
                  const expanded = expandedId === s.id;
                  return (
                    <Fragment key={s.id}>
                      <tr className="border-b last:border-0">
                        <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(s.createdAt)}</td>
                        <td className="p-3">{typeLabel(s.type)}</td>
                        <td className="p-3 font-medium max-w-[14rem] truncate" title={s.subject}>
                          {s.subject}
                        </td>
                        <td className="p-3">
                          <a href={`mailto:${encodeURIComponent(s.userEmail)}`} className="text-primary hover:underline">
                            {s.userEmail}
                          </a>
                          {s.userName ? (
                            <span className="block text-xs text-muted-foreground">{s.userName}</span>
                          ) : null}
                        </td>
                        <td className="p-3 text-muted-foreground">{s.organizationName || '—'}</td>
                        <td className="p-3">
                          <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(expanded ? null : s.id)}
                          >
                            {expanded ? 'Hide' : 'View'}
                          </Button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${s.id}-detail`} className="border-b bg-muted/20">
                          <td colSpan={7} className="p-4 space-y-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Details</p>
                              <p className="whitespace-pre-wrap text-sm">{s.details}</p>
                            </div>
                            {s.imageUrl ? (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Screenshot</p>
                                <a
                                  href={s.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block rounded-md border overflow-hidden max-w-full"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={s.imageUrl}
                                    alt="Feedback screenshot"
                                    className="max-h-48 w-auto object-contain"
                                  />
                                </a>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                              {(['read', 'closed', 'new'] as const).map((status) => (
                                <Button
                                  key={status}
                                  type="button"
                                  size="sm"
                                  variant={s.status === status ? 'default' : 'outline'}
                                  disabled={updatingId === s.id || s.status === status}
                                  onClick={() => updateStatus(s.id, status)}
                                >
                                  Mark {status}
                                </Button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
