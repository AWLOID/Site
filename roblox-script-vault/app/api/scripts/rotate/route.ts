import { NextRequest, NextResponse } from 'next/server';
import { noStoreJsonHeaders } from '@/lib/http';

/**
 * Link rotation is disabled.
 * Scripts are encrypted with the secret slug as the key.
 * The slug is never stored, so re-encryption is impossible without it.
 * To change the URL, delete the script and re-upload it.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Link rotation is disabled. Content is encrypted with the original URL secret. Delete and re-upload to get a new link.' },
    { status: 410, headers: noStoreJsonHeaders() }
  );
}
