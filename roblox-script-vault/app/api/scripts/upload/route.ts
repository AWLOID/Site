import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { noStoreJsonHeaders, originFromRequest, sameOriginOk } from '@/lib/http';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomToken, sha256 } from '@/lib/tokens';
import { encryptContent } from '@/lib/crypto';

const MAX_BYTES = 256 * 1024;
const ALLOWED = new Set(['lua', 'txt']);

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120) || 'script.lua';
}

function makeSecretSlug() {
  return randomToken(48).replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStoreJsonHeaders() });
  }

  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const expireHoursRaw = String(form.get('expireHours') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400, headers: noStoreJsonHeaders() });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be between 1 byte and 256 KB' }, { status: 400, headers: noStoreJsonHeaders() });
    }

    const safeFileName = cleanName(file.name);
    const extension = safeFileName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED.has(extension)) {
      return NextResponse.json({ error: 'Only .lua and .txt files are allowed' }, { status: 400, headers: noStoreJsonHeaders() });
    }

    const content = await file.text();
    if (content.includes('\u0000')) {
      return NextResponse.json({ error: 'Binary files are not allowed' }, { status: 400, headers: noStoreJsonHeaders() });
    }

    const expireHours = expireHoursRaw ? Number(expireHoursRaw) : 0;
    const expiresAt = Number.isFinite(expireHours) && expireHours > 0 && expireHours <= 24 * 365
      ? new Date(Date.now() + expireHours * 60 * 60 * 1000).toISOString()
      : null;

    const secretSlug = makeSecretSlug();

    // Encrypt content with the secret slug as key.
    // The slug is shown once and never stored — only sha256(slug) is in the DB.
    // Nobody (including the admin) can decrypt without the slug.
    const encryptedContent = encryptContent(content, secretSlug);

    const { data, error } = await supabaseAdmin()
      .from('scripts')
      .insert({
        name: safeFileName,
        extension,
        content: encryptedContent,
        token_hash: sha256(secretSlug),
        is_encrypted: true,
        expires_at: expiresAt,
      })
      .select('id,name,extension,hits,expires_at,last_accessed_at,created_at,updated_at')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Database insert failed' }, { status: 500, headers: noStoreJsonHeaders() });
    }

    const rawUrl = `${originFromRequest(req)}/raw/${secretSlug}.${extension}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    return NextResponse.json({ ok: true, script: data, rawUrl, loadstring, showOnce: true }, { headers: noStoreJsonHeaders() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500, headers: noStoreJsonHeaders() });
  }
}
