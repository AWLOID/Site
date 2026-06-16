import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { noStoreJsonHeaders } from '@/lib/http';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from('scripts')
    .select('id,name,extension,hits,is_encrypted,expires_at,last_accessed_at,created_at,updated_at')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStoreJsonHeaders() });

  // Content is NEVER returned. It's encrypted and the key doesn't exist on the server.
  return NextResponse.json({ script: { ...data, content: undefined } }, { headers: noStoreJsonHeaders() });
}
