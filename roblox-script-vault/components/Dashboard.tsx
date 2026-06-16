'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

export type ScriptItem = {
  id: string;
  name: string;
  extension: 'lua' | 'txt';
  hits: number;
  is_encrypted: boolean;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
};

type UploadResult = {
  rawUrl: string;
  loadstring: string;
  script: ScriptItem;
};

function fmtDate(date: string | null) {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function Dashboard({ initialScripts }: { initialScripts: ScriptItem[] }) {
  const [scripts, setScripts] = useState<ScriptItem[]>(initialScripts);
  const [file, setFile] = useState<File | null>(null);
  const [expireHours, setExpireHours] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);

  const selectedFileOk = useMemo(() => {
    if (!file) return false;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'lua' || ext === 'txt';
  }, [file]);

  async function refresh() {
    const res = await fetch('/api/scripts/list');
    const body = await res.json();
    setScripts(body.scripts || []);
  }

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setResult(null);

    if (!file || !selectedFileOk) {
      setMessage('Only .lua and .txt files are allowed');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('expireHours', expireHours);

    setUploading(true);
    const res = await fetch('/api/scripts/upload', { method: 'POST', body: data });
    const body = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      setMessage(body.error || 'Upload failed');
      return;
    }

    setResult(body);
    setFile(null);
    setExpireHours('');
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this script? This is irreversible — the encrypted content cannot be recovered.')) return;
    const res = await fetch('/api/scripts/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error || 'Delete failed');
      return;
    }
    await refresh();
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Private hosting · AES-256 encrypted</div>
          <h1>Script Vault</h1>
        </div>
        <button className="ghost" onClick={logout}>Logout</button>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Upload file</h2>
          <p className="muted">Allowed: .lua and .txt. Max size: 256 KB.</p>

          <form onSubmit={upload} className="stack">
            <label className="filebox">
              <input
                type="file"
                accept=".lua,.txt,text/plain"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
              />
              <span>{file ? file.name : 'Choose file'}</span>
            </label>

            <label>
              <span>Expiry in hours</span>
              <input
                inputMode="numeric"
                value={expireHours}
                onChange={(e) => setExpireHours(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Empty = never"
              />
            </label>

            {message ? <p className="error">{message}</p> : null}

            <button className="primary" disabled={uploading}>
              {uploading ? 'Encrypting & uploading...' : 'Upload & Encrypt'}
            </button>
          </form>
        </div>

        <div className="card result-card">
          <h2>🔒 Raw link (shown once)</h2>
          {!result ? (
            <div className="stack">
              <p className="muted">After upload the raw link appears here <strong>once</strong>. It is never stored — only its hash and the AES-encrypted content live in the database.</p>
              <div className="security-note">
                <p><strong>⛔ Nobody can view the content:</strong></p>
                <ul>
                  <li>Browser → Access Denied</li>
                  <li>Admin panel → encrypted, no key</li>
                  <li>Database → AES-256-GCM ciphertext</li>
                  <li>Only <code>game:HttpGet</code> → decrypts & executes</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="stack">
              <div className="warn-box">⚠️ Copy now — this link will never be shown again!</div>

              <label>
                <span>Raw URL</span>
                <textarea readOnly value={result.rawUrl} />
              </label>
              <button className="secondary" onClick={() => copy(result.rawUrl)}>Copy raw URL</button>

              <label>
                <span>Roblox loadstring</span>
                <textarea readOnly value={result.loadstring} />
              </label>
              <button className="secondary" onClick={() => copy(result.loadstring)}>Copy loadstring</button>
            </div>
          )}
        </div>
      </section>

      <section className="card table-card">
        <div className="section-head">
          <div>
            <h2>Scripts</h2>
            <p className="muted">Content is AES-256 encrypted. No preview, no rotation — the encryption key exists only inside the raw URL.</p>
          </div>
          <button className="ghost" onClick={refresh}>Refresh</button>
        </div>

        {scripts.length === 0 ? (
          <p className="muted">No scripts uploaded yet.</p>
        ) : (
          <div className="script-list">
            {scripts.map((s) => (
              <article className="script-row" key={s.id}>
                <div className="script-main">
                  <span className="pill">.{s.extension}</span>
                  <div>
                    <strong>{s.name}</strong>
                    <p className="muted small">
                      {s.is_encrypted ? '🔒 Encrypted' : '⚠️ Legacy'} · Hits: {s.hits} · Created: {fmtDate(s.created_at)} · Last raw: {fmtDate(s.last_accessed_at)} · Expires: {fmtDate(s.expires_at)}
                    </p>
                  </div>
                </div>
                <div className="actions">
                  <button className="danger" onClick={() => remove(s.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
