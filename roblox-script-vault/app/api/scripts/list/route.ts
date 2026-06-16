import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { noStoreJsonHeaders } from '@/lib/http';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const { data, error } = await supabaseAdmin()
    .from('scripts')
    .select('id,name,extension,hits,is_encrypted,expires_at,last_accessed_at,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreJsonHeaders() });
  return NextResponse.json({ scripts: data || [] }, { headers: noStoreJsonHeaders() });
}
