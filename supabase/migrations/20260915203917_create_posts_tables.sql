create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');

-- Desviación de la referencia: vínculo staff -> sala para resolver "Toda la sala" y los chips PARA.
alter table public.users
  add column room_id uuid references public.rooms (id);

create table public.posts (
  id           uuid             primary key default gen_random_uuid(),
  daycare_id   uuid             not null references public.daycares (id),   -- desviación de la referencia
  author_id    uuid             not null references public.users (id),
  room_id      uuid             references public.rooms (id),               -- anuncio de sala
  type         public.post_type not null,
  title        text,                                                        -- nullable, no se usa todavía
  body         text             not null,
  published_at timestamptz      not null default now(),
  created_at   timestamptz      not null default now(),
  updated_at   timestamptz      not null default now()
);

create table public.post_children (
  post_id  uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id),
  primary key (post_id, child_id)
);

create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  url        text not null,                    -- path dentro del bucket (no URL completa)
  width      int,
  height     int,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

create index posts_daycare_published_idx on public.posts (daycare_id, published_at desc, id desc);
create index posts_room_id_idx           on public.posts (room_id);
create index posts_author_id_idx         on public.posts (author_id);
create index post_children_child_id_idx  on public.post_children (child_id);
create index post_photos_post_id_idx     on public.post_photos (post_id);

alter table public.posts         enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos   enable row level security;

-- reutiliza set_updated_at de SPEC 09
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- audiencia excluyente: un post con room_id no admite filas en post_children
create or replace function public.posts_guard_audience()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.posts p where p.id = new.post_id and p.room_id is not null) then
    raise exception 'Un anuncio de sala no puede etiquetar niños.';
  end if;
  return new;
end;
$$;

create trigger post_children_guard_audience
  before insert on public.post_children
  for each row execute function public.posts_guard_audience();
