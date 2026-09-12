import { NextResponse } from 'next/server';
import { getLibraryBooks } from '@/lib/githubLibrary';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const data = await getLibraryBooks(refresh);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API library error:', error);
    return NextResponse.json({ books: [], error: 'Failed to fetch library' }, { status: 500 });
  }
}
