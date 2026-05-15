import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

type SessionUser = { organizationId?: string };

type RssItem = {
  title: string;
  url: string;
  imageUrl?: string;
  pubDate?: string;
};

/**
 * Lightweight RSS/Atom parser — extracts items from XML without external dependencies.
 * Handles both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 */
function parseRssFeed(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Try RSS 2.0 items first
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractAtomLink(block);
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date');
    const imageUrl =
      extractMediaContent(block) ||
      extractEnclosure(block) ||
      extractFirstImgSrc(extractTag(block, 'description') || extractTag(block, 'content:encoded'));
    if (title && link) {
      items.push({ title: decodeEntities(title), url: link.trim(), imageUrl: imageUrl || undefined, pubDate: pubDate || undefined });
    }
  }

  // Fallback to Atom entries
  if (items.length === 0) {
    const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null && items.length < 5) {
      const block = match[1];
      const title = extractTag(block, 'title');
      const link = extractAtomLink(block);
      const pubDate = extractTag(block, 'published') || extractTag(block, 'updated');
      const imageUrl = extractMediaContent(block) || extractFirstImgSrc(extractTag(block, 'content') || extractTag(block, 'summary'));
      if (title && link) {
        items.push({ title: decodeEntities(title), url: link.trim(), imageUrl: imageUrl || undefined, pubDate: pubDate || undefined });
      }
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractAtomLink(xml: string): string {
  // <link href="..." rel="alternate" /> or <link href="..." />
  const re = /<link\s[^>]*href="([^"]+)"[^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[0];
    // Prefer rel="alternate" or no rel
    if (!tag.includes('rel=') || tag.includes('rel="alternate"')) {
      return m[1];
    }
  }
  // Fallback: any link
  const fallback = /<link\s[^>]*href="([^"]+)"[^>]*\/?>/i.exec(xml);
  return fallback ? fallback[1] : '';
}

function extractMediaContent(xml: string): string {
  const re = /<media:content[^>]+url="([^"]+)"/i;
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function extractEnclosure(xml: string): string {
  const re = /<enclosure[^>]+url="([^"]+)"[^>]*type="image\//i;
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function extractFirstImgSrc(html: string): string {
  if (!html) return '';
  const re = /<img[^>]+src="([^"]+)"/i;
  const m = re.exec(html);
  return m ? m[1] : '';
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const feedUrl = body.url?.trim();
  if (!feedUrl) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(feedUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Tailnote/1.0 RSS Reader',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Feed returned ${res.status}` },
        { status: 502 }
      );
    }

    const xml = await res.text();
    const items = parseRssFeed(xml);

    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
