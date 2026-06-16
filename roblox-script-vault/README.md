# Roblox Script Vault

Private `.lua` / `.txt` raw script vault for Vercel + Supabase with **AES-256-GCM encryption**.

## How it works

1. You upload a `.lua` or `.txt` file through the admin panel.
2. The server generates a long random secret slug.
3. The script content is **encrypted with AES-256-GCM** using a key derived from that slug.
4. Only the **SHA-256 hash** of the slug and the **encrypted ciphertext** are stored in the database.
5. You receive the raw URL **once**. It is never shown again.

```lua
loadstring(game:HttpGet("https://your-site.vercel.app/raw/VERY_LONG_SECRET.lua"))()
```

## Who can read the content?

| Access method | Result |
|---|---|
| Open raw URL in browser | ❌ **Access Denied** |
| Admin panel "View" | ❌ **Removed — no preview exists** |
| Read database directly | ❌ **AES-256-GCM ciphertext — useless without the slug** |
| `game:HttpGet(url)` from Roblox | ✅ **Decrypts and executes** |
| Custom HTTP client with correct URL | ✅ Works (see security note) |

### Why even the owner can't view it

The encryption key is **the secret slug itself**, which is:
- Generated once at upload time
- Shown to you once in the raw URL
- **Never stored anywhere** — only `sha256(slug)` is saved for lookup

Without the slug, there is no way to decrypt the content. Not from the database, not from the admin panel, not from the server code. The slug only arrives inside the raw URL when `game:HttpGet` fetches it.

## Security note

This is the strongest practical protection possible for a `loadstring(game:HttpGet("..."))()` setup. The only theoretical weakness: if someone already has the exact raw URL and uses a custom HTTP client that mimics non-browser headers, they can fetch the content. This is inherent to any URL-based loader — the URL itself is the secret.

To mitigate this:
- Never share the raw URL
- Use the optional `RAW_USER_AGENT_REGEX` to whitelist specific User-Agents
- Set an expiry time when uploading

## Features

- **AES-256-GCM encryption** — content encrypted with slug-derived key
- **Zero-knowledge storage** — server never stores the decryption key
- **One-time URL reveal** — raw link shown once, then gone forever
- **Browser blocking** — `sec-fetch-mode`, `accept`, User-Agent checks
- **No preview** — admin panel shows metadata only, never content
- **No link rotation** — impossible without the original slug (delete & re-upload instead)
- **Optional expiry** — auto-disable scripts after N hours
- **Hit counter** — track how many times the script was loaded
- **Rate-limited login** — brute force protection
- **HttpOnly session cookies** — HMAC-signed, `sameSite: strict`
- **Full no-cache headers** — `no-store` on every response, Vercel CDN bypass
- **CSP / security headers** — `X-Frame-Options: DENY`, `nosniff`, etc.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy your Project URL and service role/secret key.

## Vercel setup

Add environment variables:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_PASSWORD=change-this-long-password
AUTH_SECRET=change-this-64-char-random-secret
RAW_USER_AGENT_REGEX=
```

Deploy to Vercel.

## Optional strict raw mode

By default, normal browsers are denied and non-browser HTTP clients are allowed. If your Roblox loader sends a clear User-Agent, you can make access stricter:

```env
RAW_USER_AGENT_REGEX=Roblox|HttpGet|HttpService
```

## Local dev

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.
