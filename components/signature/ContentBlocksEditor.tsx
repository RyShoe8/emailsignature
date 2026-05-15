'use client';

import { useState } from 'react';
import type { ContentBlockData } from 'emailsignature-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  value: ContentBlockData[];
  onChange: (blocks: ContentBlockData[]) => void;
};

export function ContentBlocksEditor({ value, onChange }: Props) {
  const blocks = [...value];
  while (blocks.length < 2) {
    blocks.push({ type: 'book_a_call', enabled: false });
  }

  const updateBlock = (index: number, next: Partial<ContentBlockData>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...next } as ContentBlockData;
    onChange(newBlocks);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {blocks.map((block, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Content Block {i + 1}</CardTitle>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={(e) => updateBlock(i, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label className="font-normal text-sm">Enable</Label>
              </div>
            </div>
          </CardHeader>
          {block.enabled && (
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={block.type}
                  onChange={(e) => updateBlock(i, { type: e.target.value as ContentBlockData['type'] })}
                >
                  <option value="book_a_call">Book a Call</option>
                  <option value="latest_blogs">Latest Blogs (RSS)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {block.type === 'book_a_call' && (
                <>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={block.callTitle || ''}
                      onChange={(e) => updateBlock(i, { callTitle: e.target.value })}
                      placeholder="Book a Call"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={block.callUrl || ''}
                      onChange={(e) => updateBlock(i, { callUrl: e.target.value })}
                      placeholder="https://calendly.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={block.callButtonText || ''}
                      onChange={(e) => updateBlock(i, { callButtonText: e.target.value })}
                      placeholder="Schedule Now"
                    />
                  </div>
                </>
              )}

              {block.type === 'latest_blogs' && (
                <>
                  <div className="space-y-2">
                    <Label>RSS Feed URL</Label>
                    <Input
                      value={block.rssUrl || ''}
                      onChange={(e) => updateBlock(i, { rssUrl: e.target.value })}
                      placeholder="https://blog.example.com/rss.xml"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!block.rssUrl) return;
                        try {
                          const res = await fetch('/api/dashboard/rss-preview', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: block.rssUrl }),
                          });
                          const json = await res.json();
                          if (json.items) {
                            updateBlock(i, { rssItems: json.items, rssLastFetched: new Date().toISOString() });
                          }
                        } catch (e) {}
                      }}
                    >
                      Refresh Now
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {block.rssLastFetched ? `Last fetched: ${new Date(block.rssLastFetched).toLocaleString()}` : 'Not fetched yet'}
                    </span>
                  </div>
                  {/* Schedule functionality */}
                  <div className="space-y-2">
                    <Label>Auto-refresh Schedule</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      value={(block as any).rssRefreshInterval || 'none'}
                      onChange={(e) => updateBlock(i, { rssRefreshInterval: e.target.value } as any)}
                    >
                      <option value="none">None (Manual only)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  {block.rssItems && block.rssItems.length > 0 && (
                    <div className="text-sm space-y-1 mt-4">
                      <p className="font-medium text-xs text-muted-foreground">Preview items:</p>
                      <ul className="list-disc pl-4 text-xs">
                        {block.rssItems.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="truncate">{item.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {block.type === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={block.customTitle || ''}
                      onChange={(e) => updateBlock(i, { customTitle: e.target.value })}
                      placeholder="Special Offer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <Textarea
                      value={block.customText || ''}
                      onChange={(e) => updateBlock(i, { customText: e.target.value })}
                      placeholder="Get 20% off your first month..."
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link URL</Label>
                    <Input
                      value={block.customUrl || ''}
                      onChange={(e) => updateBlock(i, { customUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={block.customImageUrl || ''}
                        onChange={(e) => updateBlock(i, { customImageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('/api/dashboard/me/image', {
                                method: 'POST',
                                body: formData,
                              });
                              if (!res.ok) throw new Error('Upload failed');
                              const data = await res.json();
                              updateBlock(i, { customImageUrl: data.url });
                            } catch (err) {
                              console.error(err);
                              alert('Image upload failed. Please ensure it is < 4MB.');
                            }
                          }}
                        />
                        <Button type="button" variant="outline">Upload</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
