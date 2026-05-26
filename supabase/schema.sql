create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  home_area text not null default '',
  commute_minutes integer not null default 45,
  education text not null default '',
  major text not null default '',
  age integer,
  certificates text not null default '',
  political_status text not null default '',
  work_years numeric not null default 0,
  target_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default '',
  target_date date,
  date_status text not null default 'pending' check (date_status in ('pending', 'confirmed', 'past')),
  source_url text not null default '',
  notes text not null default '',
  priority integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  track text not null default '',
  task_date date not null,
  duration_minutes integer not null default 30,
  status text not null default 'todo' check (status in ('todo', 'done')),
  review_note text not null default '',
  wrong_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  mood text not null default 'steady',
  minutes integer not null default 0,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  metric text not null default '',
  target integer not null default 0,
  current integer not null default 0,
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.target_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default '',
  area text not null default '',
  commute_score integer not null default 3,
  stability_score integer not null default 3,
  fit_note text not null default '',
  priority integer not null default 2,
  status text not null default 'watching',
  source_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_exams_updated_at on public.exams;
create trigger set_exams_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

drop trigger if exists set_study_tasks_updated_at on public.study_tasks;
create trigger set_study_tasks_updated_at
before update on public.study_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_checkins_updated_at on public.checkins;
create trigger set_checkins_updated_at
before update on public.checkins
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_target_units_updated_at on public.target_units;
create trigger set_target_units_updated_at
before update on public.target_units
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.study_tasks enable row level security;
alter table public.checkins enable row level security;
alter table public.goals enable row level security;
alter table public.target_units enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own exams" on public.exams;
create policy "Users can view own exams"
on public.exams for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own exams" on public.exams;
create policy "Users can insert own exams"
on public.exams for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own exams" on public.exams;
create policy "Users can update own exams"
on public.exams for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own exams" on public.exams;
create policy "Users can delete own exams"
on public.exams for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own study tasks" on public.study_tasks;
create policy "Users can view own study tasks"
on public.study_tasks for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own study tasks" on public.study_tasks;
create policy "Users can insert own study tasks"
on public.study_tasks for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own study tasks" on public.study_tasks;
create policy "Users can update own study tasks"
on public.study_tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own study tasks" on public.study_tasks;
create policy "Users can delete own study tasks"
on public.study_tasks for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own checkins" on public.checkins;
create policy "Users can view own checkins"
on public.checkins for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own checkins" on public.checkins;
create policy "Users can insert own checkins"
on public.checkins for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own checkins" on public.checkins;
create policy "Users can update own checkins"
on public.checkins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own checkins" on public.checkins;
create policy "Users can delete own checkins"
on public.checkins for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own goals" on public.goals;
create policy "Users can view own goals"
on public.goals for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals"
on public.goals for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals"
on public.goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals"
on public.goals for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own target units" on public.target_units;
create policy "Users can view own target units"
on public.target_units for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own target units" on public.target_units;
create policy "Users can insert own target units"
on public.target_units for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own target units" on public.target_units;
create policy "Users can update own target units"
on public.target_units for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own target units" on public.target_units;
create policy "Users can delete own target units"
on public.target_units for delete
using (auth.uid() = user_id);
