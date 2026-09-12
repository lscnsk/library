import { NextResponse } from 'next/server';
import { getLibraryBooks } from '@/lib/githubLibrary';

export async function GET(request: Request) {
  try {
    let refresh = false;
    if (request?.url) {
      try {
        const { searchParams } = new URL(request.url);
        refresh = searchParams.get('refresh') === 'true';
      } catch {
        // Fallback for static builds
      }
    }
    const data = await getLibraryBooks(refresh);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API library error:', error);
    return NextResponse.json({ books: [], error: 'Failed to fetch library' }, { status: 500 });
  }
}
