import { NextResponse } from 'next/server';
import { getLibraryBooks } from '@/lib/githubLibrary';

export const revalidate = 60; // cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get('refresh') === 'true';

  try {
    const data = await getLibraryBooks(isRefresh);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}
