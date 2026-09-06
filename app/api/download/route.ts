import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'book.fb2';

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch original file content from raw GitHub or CDN
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'lscnsk-library-download/1.0',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Remote file fetch failed: ${response.statusText}`, {
        status: response.status,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // MIME type determination
    let contentType = 'application/octet-stream';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.fb2')) {
      contentType = 'application/x-fictionbook+xml; charset=utf-8';
    } else if (lower.endsWith('.zip')) {
      contentType = 'application/zip';
    } else if (lower.endsWith('.epub')) {
      contentType = 'application/epub+zip';
    } else if (lower.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    // Prepare standard and UTF-8 encoded filename for Content-Disposition
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');
    const utf8Filename = encodeURIComponent(filename);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/download:', err);
    return new NextResponse(`Download failed: ${err?.message}`, { status: 500 });
  }
}
