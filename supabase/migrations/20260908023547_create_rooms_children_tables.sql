create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id         uuid        primary key default gen_random_uuid(),
  daycare_id uuid        not null references public.daycares (id),
  name       text        not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id            uuid                 primary key default gen_random_uuid(),
  room_id       uuid                 references public.rooms (id),
  full_name     text                 not null,
  birth_date    date                 not null,
  enrolled_at   date                 not null,
  medical_notes text,
  allergy_tags  text[]               not null default '{}',
  photo_consent boolean              not null default true,
  status        public.child_status  not null default 'active',
  created_at    timestamptz          not null default now(),
  updated_at    timestamptz          not null default now()
);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_authenticated_select"
  on public.rooms for select to authenticated using (true);
create policy "children_authenticated_select"
  on public.children for select to authenticated using (true);
create policy "children_authenticated_insert"
  on public.children for insert to authenticated with check (true);

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();