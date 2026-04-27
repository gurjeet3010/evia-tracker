-- =========================================================
-- Evia: profiles, period_history, daily_logs
-- =========================================================

-- 1) PROFILES ---------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  tracking_for text not null default 'self' check (tracking_for in ('self', 'partner')),
  cycle_length integer not null default 28 check (cycle_length between 15 and 60),
  period_length integer not null default 5 check (period_length between 1 and 15),
  last_period_start date,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: users can view own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles: users can insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles: users can update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Profiles: users can delete own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- 2) PERIOD HISTORY --------------------------------------------
create table public.period_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index period_history_user_start_idx
  on public.period_history (user_id, start_date desc);

alter table public.period_history enable row level security;

create policy "Period: users can view own"
  on public.period_history for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Period: users can insert own"
  on public.period_history for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Period: users can update own"
  on public.period_history for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Period: users can delete own"
  on public.period_history for delete
  to authenticated
  using (auth.uid() = user_id);

-- 3) DAILY LOGS ------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  mood text,
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date desc);

alter table public.daily_logs enable row level security;

create policy "Logs: users can view own"
  on public.daily_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Logs: users can insert own"
  on public.daily_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Logs: users can update own"
  on public.daily_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Logs: users can delete own"
  on public.daily_logs for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4) updated_at trigger ---------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

create trigger period_history_set_updated_at
  before update on public.period_history
  for each row execute function public.tg_set_updated_at();

create trigger daily_logs_set_updated_at
  before update on public.daily_logs
  for each row execute function public.tg_set_updated_at();

-- 5) Auto-create profile on signup ----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
