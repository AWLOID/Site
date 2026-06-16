import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { noStoreJsonHeaders, sameOriginOk } from '@/lib/http';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(req: NextRequest) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStoreJsonHeaders() });
  }

  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: noStoreJsonHeaders() });

  const { error } = await supabaseAdmin().from('scripts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreJsonHeaders() });
  return NextResponse.json({ ok: true }, { headers: noStoreJsonHeaders() });
}
