import { NextRequest } from 'next/server';
import { env } from './env';

const BROWSER_UA = /(Mozilla|Chrome|Chromium|Safari|Firefox|Edg|Opera|OPR|Brave|Vivaldi|YaBrowser|SamsungBrowser|UCBrowser)/i;
const SCRIPT_CLIENT_UA = /(Roblox|HttpGet|HttpService|Synapse|KRNL|Wave|Delta|Fluxus|Arceus|Codex|Solara|Electron|Hydrogen|Trigon|Comet|Swift|Xeno)/i;

export function normalizeRawSlug(input: string): { slug: string; extension: 'lua' | 'txt' | null } {
  const clean = decodeURIComponent(input || '').trim();
  const match = clean.match(/^([a-zA-Z0-9_-]{32,96})\.(lua|txt)$/i);
  if (!match) return { slug: '', extension: null };
  return { slug: match[1], extension: match[2].toLowerCase() as 'lua' | 'txt' };
}

export function isRawRequestAllowed(req: NextRequest): boolean {
  const customRule = env.rawUserAgentRegex();
  const ua = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';
  const secFetchMode = req.headers.get('sec-fetch-mode') || '';
  const secFetchDest = req.headers.get('sec-fetch-dest') || '';
  const secFetchSite = req.headers.get('sec-fetch-site') || '';

  if (customRule) {
    try {
      return new RegExp(customRule, 'i').test(ua);
    } catch {
      return false;
    }
  }

  // Real browser navigation adds these headers. Roblox/game HTTP clients normally do not.
  if (secFetchMode === 'navigate') return false;
  if (secFetchDest === 'document') return false;
  if (accept.toLowerCase().includes('text/html')) return false;
  if (BROWSER_UA.test(ua) && (secFetchSite || accept)) return false;

  // Known Roblox / script HTTP clients are allowed.
  if (SCRIPT_CLIENT_UA.test(ua)) return true;

  // Allow non-browser minimal HTTP clients. This keeps game:HttpGet-style requests working
  // even when the client sends a blank or generic User-Agent.
  if (!ua && !secFetchMode && !secFetchDest) return true;
  if (accept === '*/*' && !secFetchMode && !secFetchDest) return true;

  return false;
}

export function rawResponseHeaders() {
  return {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    'Referrer-Policy': 'no-referrer'
  } as const;
}
