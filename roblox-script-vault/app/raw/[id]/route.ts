import { NextRequest } from 'next/server';
import { textDenied } from '@/lib/http';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isRawRequestAllowed, normalizeRawSlug, rawResponseHeaders } from '@/lib/rawAccess';
import { sha256 } from '@/lib/tokens';
import { decryptContent } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { slug, extension } = normalizeRawSlug(id);

  if (!slug || !extension) return textDenied(404);
  if (!isRawRequestAllowed(req)) return textDenied();

  const tokenHash = sha256(slug);

  const { data, error } = await supabaseAdmin()
    .from('scripts')
    .select('id,extension,content,is_encrypted,expires_at,hits')
    .eq('token_hash', tokenHash)
    .eq('extension', extension)
    .single();

  if (error || !data) return textDenied(404);
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return textDenied();

  // Decrypt if the script was stored encrypted.
  let body: string;
  if (data.is_encrypted) {
    const plain = decryptContent(data.content, slug);
    if (plain === null) return textDenied();
    body = plain;
  } else {
    // Legacy unencrypted scripts (uploaded before this update).
    body = data.content;
  }

  await supabaseAdmin()
    .from('scripts')
    .update({ hits: Number(data.hits || 0) + 1, last_accessed_at: new Date().toISOString() })
    .eq('id', data.id);

  return new Response(body, {
    status: 200,
    headers: rawResponseHeaders(),
  });
}

export async function HEAD() {
  return textDenied();
}
