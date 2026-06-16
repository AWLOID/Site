'use client';

import { FormEvent, useState } from 'react';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Login failed');
      return;
    }

    window.location.reload();
  }

  return (
    <section className="card login-card">
      <div className="brand-dot" />
      <h1>Script Vault</h1>
      <p className="muted">Private server-side raw script storage.</p>

      <form onSubmit={onSubmit} className="stack">
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="primary" disabled={loading}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </section>
  );
}
