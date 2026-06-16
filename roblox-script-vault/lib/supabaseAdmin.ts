import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export type ScriptRow = {
  id: string;
  name: string;
  extension: 'lua' | 'txt';
  content: string;
  token_hash: string;
  hits: number;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function supabaseAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'roblox-script-vault'
      }
    }
  });
}
