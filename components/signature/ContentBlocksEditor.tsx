'use client';

import { useState } from 'react';
import type { ContentBlockData, ContentBlockListItem } from 'emailsignature-engine';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  value: ContentBlockData[];
  onChange: (blocks: ContentBlockData[]) => void;
};

const SLOT_COUNT = 2;

function ensureSlots(blocks: ContentBlockData[]): ContentBlockData[] {
  const out = [...blocks];
  while (out.length < SLOT_COUNT) {
    out.push({ type: 'book_a_call', enabled: false });
  }
  return out.slice(0, SLOT_COUNT);
}

export function ContentBlocksEditor({ value, onChange }: Props) {
  const blocks = ensureSlots(value);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  const updateBlock = (index: number, next: Partial<ContentBlockData>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...next } as ContentBlockData;
    onChange(newBlocks);
  };

  const block = blocks[activeSlot];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {blocks.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSlot(i)}
            className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSlot === i
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Block {i + 1}
            {b.enabled ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" /> : null}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id={`block-enabled-${activeSlot}`}
                type="checkbox"
                checked={block.enabled}
                onChange={(e) => updateBlock(activeSlot, { enabled: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={`block-enabled-${activeSlot}`} className="font-normal text-sm">
                Enable Block {activeSlot + 1}
              </Label>
            </div>
          </div>
        </CardHeader>
        {block.enabled && (
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={block.type === 'custom' ? 'list' : block.type}
                onChange={(e) => updateBlock(activeSlot, { type: e.target.value as ContentBlockData['type'] })}
              >
                <option value="book_a_call">Book a Call</option>
                <option value="latest_blogs">Latest Blogs (RSS)</option>
                <option value="list">List</option>
                <option value="image">Image</option>
              </select>
            </div>

            {block.type === 'book_a_call' && (
              <BookACallEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'latest_blogs' && (
              <LatestBlogsEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {(block.type === 'list' || block.type === 'custom') && (
              <ListEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
            {block.type === 'image' && (
              <ImageEditor block={block} onChange={(p) => updateBlock(activeSlot, p)} />
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function BookACallEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={block.callTitle || ''}
          onChange={(e) => onChange({ callTitle: e.target.value })}
          placeholder="Book a Call"
        />
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={block.callUrl || ''}
          onChange={(e) => onChange({ callUrl: e.target.value })}
          placeholder="https://calendly.com/..."
        />
      </div>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={block.callButtonText || ''}
          onChange={(e) => onChange({ callButtonText: e.target.value })}
          placeholder="Schedule Now"
        />
      </div>
    </>
  );
}

function LatestBlogsEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>RSS Feed URL</Label>
        <Input
          value={block.rssUrl || ''}
          onChange={(e) => onChange({ rssUrl: e.target.value })}
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
                onChange({ rssItems: json.items, rssLastFetched: new Date().toISOString() });
              }
            } catch {
              /* swallow fetch errors; user can retry */
            }
          }}
        >
          Refresh Now
        </Button>
        <span className="text-xs text-muted-foreground">
          {block.rssLastFetched ? `Last fetched: ${new Date(block.rssLastFetched).toLocaleString()}` : 'Not fetched yet'}
        </span>
      </div>
      <div className="space-y-2">
        <Label>Auto-refresh Schedule</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={block.rssRefreshInterval || 'none'}
          onChange={(e) => onChange({ rssRefreshInterval: e.target.value as ContentBlockData['rssRefreshInterval'] })}
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
              <li key={idx} className="truncate">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const MAX_LIST_ITEMS = 4;

function ListEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  // Migrate a legacy `custom` block into the list shape on first edit.
  const legacyMigrated: ContentBlockListItem[] | undefined =
    block.type === 'custom' && !block.listItems && (block.customTitle || block.customText || block.customUrl)
      ? [
          {
            title: (block.customTitle || '').trim() || 'Item 1',
            description: block.customText || undefined,
            url: block.customUrl || undefined,
          },
        ]
      : undefined;

  const items = block.listItems ?? legacyMigrated ?? [];
  const title = block.listTitle ?? (block.type === 'custom' ? block.customTitle ?? '' : '');

  const updateItem = (index: number, next: Partial<ContentBlockListItem>) => {
    const padded: ContentBlockListItem[] = [];
    for (let i = 0; i <= index; i += 1) {
      padded[i] = items[i] ?? { title: '' };
    }
    for (let i = index + 1; i < items.length; i += 1) {
      padded[i] = items[i];
    }
    padded[index] = { ...padded[index], ...next } as ContentBlockListItem;
    onChange({ listItems: padded.slice(0, MAX_LIST_ITEMS) });
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange({ listItems: next });
  };

  const visibleSlots = Math.min(MAX_LIST_ITEMS, Math.max(items.length, 1));

  return (
    <>
      <div className="space-y-2">
        <Label>List title</Label>
        <Input
          value={title}
          onChange={(e) => onChange({ listTitle: e.target.value })}
          placeholder="Special Offers"
        />
      </div>
      <div className="space-y-3">
        <Label>Items (up to {MAX_LIST_ITEMS})</Label>
        {Array.from({ length: visibleSlots }).map((_, i) => {
          const item = items[i] ?? { title: '' };
          return (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                {items[i] ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder={`Item ${i + 1} title`}
              />
              <Textarea
                value={item.description || ''}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder="Optional description"
                className="resize-none"
                rows={2}
              />
              <Input
                value={item.url || ''}
                onChange={(e) => updateItem(i, { url: e.target.value })}
                placeholder="Optional link URL (https://...)"
              />
            </div>
          );
        })}
        {visibleSlots < MAX_LIST_ITEMS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ listItems: [...items, { title: '' }] })}
          >
            Add item
          </Button>
        )}
      </div>
    </>
  );
}

function ImageEditor({
  block,
  onChange,
}: {
  block: ContentBlockData;
  onChange: (next: Partial<ContentBlockData>) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <div className="flex gap-2">
          <Input
            value={block.imageUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://..."
          />
          <div className="relative">
            <Input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = '';
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
                  onChange({ imageUrl: data.url });
                } catch (err) {
                  console.error(err);
                  alert('Image upload failed. Please ensure it is < 4MB.');
                }
              }}
            />
            <Button type="button" variant="outline">
              Upload
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Link URL (optional)</Label>
        <Input
          value={block.imageLinkUrl || ''}
          onChange={(e) => onChange({ imageLinkUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </>
  );
}
