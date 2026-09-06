import { NextRequest, NextResponse } from 'next/server';
import { getLibraryBooks, invalidateLibraryCache } from '@/lib/githubLibrary';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      invalidateLibraryCache();
    }

    const data = await getLibraryBooks(force);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': force
          ? 'no-store, max-age=0'
          : 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err: any) {
    console.error('Error serving /api/books:', err);
    return NextResponse.json(
      { error: 'Failed to load library catalog', details: err?.message },
      { status: 500 }
    );
  }
}
