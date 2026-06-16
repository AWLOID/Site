import { isAuthed } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Dashboard, { ScriptItem } from '@/components/Dashboard';
import LoginForm from '@/components/LoginForm';

async function getScripts(): Promise<ScriptItem[]> {
  const { data } = await supabaseAdmin()
    .from('scripts')
    .select('id,name,extension,hits,is_encrypted,expires_at,last_accessed_at,created_at,updated_at')
    .order('created_at', { ascending: false });

  return (data || []) as ScriptItem[];
}

export default async function HomePage() {
  const authed = await isAuthed();

  if (!authed) {
    return (
      <main className="page center-page">
        <LoginForm />
      </main>
    );
  }

  const scripts = await getScripts();

  return (
    <main className="page">
      <Dashboard initialScripts={scripts} />
    </main>
  );
}
