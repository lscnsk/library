import { NextRequest, NextResponse } from 'next/server';
import { invalidateLibraryCache, getLibraryBooks } from '@/lib/githubLibrary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const event = request.headers.get('x-github-event') || 'push';
    console.log(`[GitHub Webhook] Received event: ${event}`);

    // Invalidate memory cache immediately
    invalidateLibraryCache();

    // Trigger asynchronous fresh re-fetch in background to warm cache
    getLibraryBooks(true).catch(e => {
      console.warn('[GitHub Webhook] Background cache warm failed:', e);
    });

    return NextResponse.json({
      success: true,
      message: 'Library cache invalidated. Fresh books indexed.',
      event,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error handling webhook:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook',
    targetRepo: 'https://github.com/lscnsk/lscnsk_library',
    instructions:
      'Configure this URL as a GitHub Webhook in repository settings (Payload URL, Content type: application/json, Event: Just the push event).'
  });
}
