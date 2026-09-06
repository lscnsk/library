import { NextRequest, NextResponse } from 'next/server';
import { extractFB2Preview } from '@/lib/ebookParser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const title = searchParams.get('title') || 'Книга';
    const author = searchParams.get('author') || 'Автор';

    if (!rawUrl) {
      return NextResponse.json({ error: 'Missing book url parameter' }, { status: 400 });
    }

    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'lscnsk-library-preview/1.0' }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch book content from source (${res.status})` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const isFb2 = rawUrl.toLowerCase().includes('.fb2') || text.includes('<FictionBook');

    if (isFb2) {
      const preview = extractFB2Preview(text, title, author);
      return NextResponse.json(preview);
    }

    // Plain text or other format fallback: split by double newlines into paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const chunkSize = 25;
    const chapters = [];
    for (let i = 0; i < Math.min(paragraphs.length, 300); i += chunkSize) {
      chapters.push({
        title: `Часть ${Math.floor(i / chunkSize) + 1}`,
        content: paragraphs.slice(i, i + chunkSize)
      });
    }

    return NextResponse.json({
      id: title,
      title,
      author,
      chapters: chapters.length > 0 ? chapters : [{ title: 'Текст', content: [text.slice(0, 5000)] }]
    });
  } catch (err: any) {
    console.error('Error generating book preview:', err);
    return NextResponse.json(
      { error: 'Failed to extract book preview', details: err?.message },
      { status: 500 }
    );
  }
}
