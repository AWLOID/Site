create extension if not exists pgcrypto;

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  extension text not null check (extension in ('lua', 'txt')),
  content text not null,
  token_hash text not null,
  is_encrypted boolean not null default true,
  hits bigint not null default 0,
  expires_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration helpers for existing installs.
alter table public.scripts add column if not exists token_hash text;
alter table public.scripts add column if not exists is_encrypted boolean not null default false;
alter table public.scripts add column if not exists last_accessed_at timestamptz;
alter table public.scripts add column if not exists hits bigint not null default 0;
alter table public.scripts add column if not exists expires_at timestamptz;
alter table public.scripts add column if not exists created_at timestamptz not null default now();
alter table public.scripts add column if not exists updated_at timestamptz not null default now();

-- Compatibility with older versions.
alter table public.scripts add column if not exists secret_slug text;
alter table public.scripts alter column secret_slug drop not null;

update public.scripts
set token_hash = encode(digest(coalesce(secret_slug, id::text), 'sha256'), 'hex')
where token_hash is null or token_hash = '';

alter table public.scripts alter column token_hash set not null;

alter table public.scripts enable row level security;

-- No public policies on purpose.
-- Only the server-side Supabase service role key should read/write this table.

create unique index if not exists scripts_token_hash_unique_idx on public.scripts (token_hash);
create index if not exists scripts_created_at_idx on public.scripts (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists scripts_set_updated_at on public.scripts;
create trigger scripts_set_updated_at
before update on public.scripts
for each row execute function public.set_updated_at();
