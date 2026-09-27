create table public.calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_encrypted text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_connections enable row level security;

revoke all on table public.calendar_connections from anon, authenticated;
grant all on table public.calendar_connections to service_role;