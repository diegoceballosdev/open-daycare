create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid         primary key references auth.users (id) on delete cascade,
  daycare_id            uuid         not null references public.daycares (id),
  role                  public.user_role   not null,
  status                public.user_status not null default 'active',
  full_name             text         not null,
  avatar_url            text,
  notify_on_post        boolean      not null default true,
  daily_summary_enabled boolean      not null default true,
  created_at            timestamptz  not null default now(),
  updated_at            timestamptz  not null default now()
);

alter table public.users enable row level security;

-- réplica del perfil cuando se crea un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'parent'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- blinda la función SECURITY DEFINER de llamadas directas
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- mantiene updated_at (función genérica, reutilizable por otras tablas)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();