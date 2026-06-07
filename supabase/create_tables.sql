-- Supabase table creation for provider observability
create table if not exists provider_health (
  id uuid default gen_random_uuid() primary key,
  provider text not null,
  available boolean default true,
  avg_response_time numeric,
  last_checked timestamptz
);

create table if not exists provider_metrics (
  id uuid default gen_random_uuid() primary key,
  provider text not null,
  event text,
  meta jsonb,
  timestamp timestamptz default now()
);

create table if not exists provider_failures (
  id uuid default gen_random_uuid() primary key,
  provider text not null,
  error text,
  timestamp timestamptz default now()
);

create table if not exists provider_request_logs (
  id uuid default gen_random_uuid() primary key,
  provider text not null,
  timestamp timestamptz default now(),
  details jsonb
);
