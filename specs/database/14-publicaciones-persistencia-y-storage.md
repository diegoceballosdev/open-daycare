# SPEC 14 — Publicaciones: persistencia, storage de imágenes y feed real

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 06, SPEC 09, SPEC 10, SPEC 11
> **Date:** 2026-09-15
> **Objective:** Permitir que **solo el staff** cree publicaciones (con hasta 10 imágenes comprimidas en el cliente) que persisten en Supabase, y conectar el feed `/` a la base de datos con paginación por cursor y aislamiento por rol y daycare.

## Scope

**In:**

- Migración **`create_posts_tables`**: enum `post_type` (`meal`/`nap`/`activity`/`achievement`/`photo`/`announcement`), columna `users.room_id` (FK → `rooms`, nullable), tablas `posts` (con `daycare_id`), `post_children` y `post_photos` según `info-database`, RLS activo e índices.
- Migración **`create_post_helpers_and_rpc`**: `users_select_self` y `users_select_staff_daycare`, helpers `current_daycare_id()` e `is_staff()`, policies de `posts`/`post_children`/`post_photos` y RPC transaccional `create_post`.
- Migración **`create_post_images_bucket`**: bucket privado `post-images` con `file_size_limit` y `allowed_mime_types`, más policies de `storage.objects` (subida/borrado de staff, lectura del daycare).
- Migración **`seed_staff_room_and_posts`**: `room_id = Soles` para el staff y los 3 posts del mock (autor = staff, `published_at` = hoy a las 14:20/09:40/07:50).
- Tipos TypeScript regenerados con `supabase gen types`.
- `next.config.ts`: `experimental.serverActions.bodySizeLimit` y `experimental.proxyClientMaxBodySize` en `'15mb'`.
- `src/lib/image-compression.ts` (cliente): compresión a WebP con Canvas nativo.
- `src/lib/post-types.ts`: mapeo `post_type` ↔ etiqueta/tema de UI y tipos del feed.
- `src/app/feed/actions.ts`: Server Action `createPost` (validar → subir imágenes → RPC atómico → compensar si falla) y `loadMorePosts` (paginación por cursor).
- Modal `new-post-modal.tsx` funcional: niños reales de la sala del staff, chip "Toda la sala", 6 tipos, fotos reales con preview + compresión + quitar, validación y errores inline.
- `src/app/page.tsx` pasa a Server Component: lee el perfil, resuelve el feed y delega en `feed-client.tsx`.
- `src/components/feed-client.tsx`: lista, encabezados por día (HOY / AYER / fecha), "Ver más" y estado vacío.
- `src/components/post-card.tsx` con autor/audiencia reales, imágenes firmadas y contadores en 0.
- Sidebar y Composer ocultan la acción de publicar si el rol no es `staff`.
- Se elimina `src/data/posts.ts`; la identidad de cabecera/sidebar se mueve a `src/data/current-user.ts`.

**Out of scope (para specs futuras):**

- Reacciones (`reactions`) y comentarios (`comments`): los contadores quedan en 0 y el botón "Editar" sigue inerte.
- Editar y eliminar publicaciones (no se crean policies de UPDATE/DELETE).
- Detalle de publicación (`detalle-publicacion.dc.html`) y vista de foto a pantalla completa (`foto.dc.html`); solo se guardan `width`/`height` para cuando lleguen.
- Feed de familia (`familia-feed.dc.html`) y `Avisos`.
- Notificaciones (`devices`, `notify_on_post`) y `daily_summaries`.
- Convertir la identidad mock de cabecera/sidebar al perfil real.
- Paginación por offset, scroll infinito o búsqueda en el feed.

## Data model

**Migración `create_posts_tables`** (enum + columna + tablas + RLS + índices):

```sql
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
```

**Migración `create_post_helpers_and_rpc`** (perfil, helpers, policies y RPC):

```sql
-- El usuario lee su propia fila (rol, sala, daycare).
create policy "users_select_self"
  on public.users for select to authenticated
  using (id = (select auth.uid()));

-- El staff lee los usuarios de su daycare (para resolver el autor del feed).
create policy "users_select_staff_daycare"
  on public.users for select to authenticated
  using (public.is_staff() and daycare_id = public.current_daycare_id());

-- Helpers SECURITY DEFINER: evitan la recursión de RLS sobre `users` y solo exponen datos del llamador.
create or replace function public.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select daycare_id from public.users where id = (select auth.uid())
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and role = 'staff')
$$;

revoke execute on function public.current_daycare_id() from public, anon;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.current_daycare_id() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- Escritura: solo staff del daycare y como autor propio.
create policy "posts_staff_insert"
  on public.posts for insert to authenticated
  with check (
    public.is_staff()
    and author_id = (select auth.uid())
    and daycare_id = public.current_daycare_id()
  );

-- Lectura: staff ve todo su daycare; el padre ve los posts de sus hijos + anuncios de su sala.
create policy "posts_select_visible"
  on public.posts for select to authenticated
  using (
    (public.is_staff() and daycare_id = public.current_daycare_id())
    or exists (
      select 1
      from public.post_children pc
      join public.parent_children pch on pch.child_id = pc.child_id
      where pc.post_id = posts.id
        and pch.parent_id = (select auth.uid())
        and posts.daycare_id = public.current_daycare_id()
    )
    or (
      type = 'announcement'
      and room_id in (
        select c.room_id
        from public.parent_children pch
        join public.children c on c.id = pch.child_id
        where pch.parent_id = (select auth.uid())
      )
    )
  );

-- Permisiva (mismo criterio que children/parent_children): evita la recursión de policies con `posts`.
create policy "post_children_select"
  on public.post_children for select to authenticated using (true);

create policy "post_photos_select"
  on public.post_photos for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_photos.post_id));

create policy "post_children_staff_insert"
  on public.post_children for insert to authenticated with check (public.is_staff());

create policy "post_photos_staff_insert"
  on public.post_photos for insert to authenticated with check (public.is_staff());

-- RPC: inserta posts + post_children + post_photos en una sola transacción.
-- SECURITY INVOKER: las policies y la validación de destinatarios aplican igual.
create or replace function public.create_post(
  p_type      public.post_type,
  p_body      text,
  p_room_id   uuid,
  p_child_ids uuid[],
  p_photos    jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'La descripción es obligatoria.';
  end if;

  if p_room_id is null and (p_child_ids is null or cardinality(p_child_ids) = 0) then
    raise exception 'Elegí al menos un destinatario.';
  end if;

  if p_room_id is not null and p_child_ids is not null and cardinality(p_child_ids) > 0 then
    raise exception 'Elegí niños o toda la sala, no ambos.';
  end if;

  if p_type = 'photo' and (p_photos is null or jsonb_array_length(p_photos) = 0) then
    raise exception 'El tipo Foto requiere al menos una imagen.';
  end if;

  -- Aislamiento de tenant: la sala y todos los niños deben pertenecer al daycare del autor.
  if p_room_id is not null and not exists (
    select 1 from public.rooms
    where id = p_room_id and daycare_id = public.current_daycare_id()
  ) then
    raise exception 'Sala inválida.';
  end if;

  if p_child_ids is not null and cardinality(p_child_ids) > 0 and exists (
    select 1
    from unnest(p_child_ids) as cid
    left join public.children c on c.id = cid
    left join public.rooms    r on r.id = c.room_id
    where c.id is null or r.daycare_id is distinct from public.current_daycare_id()
  ) then
    raise exception 'Destinatarios inválidos.';
  end if;

  insert into public.posts (daycare_id, author_id, room_id, type, body, published_at)
  values (public.current_daycare_id(), (select auth.uid()), p_room_id, p_type, trim(p_body), now())
  returning id into v_post_id;

  if p_child_ids is not null and cardinality(p_child_ids) > 0 then
    insert into public.post_children (post_id, child_id)
    select v_post_id, unnest(p_child_ids);
  end if;

  if p_photos is not null and jsonb_array_length(p_photos) > 0 then
    insert into public.post_photos (post_id, url, width, height, position)
    select
      v_post_id,
      e ->> 'path',
      nullif(e ->> 'width', '')::int,
      nullif(e ->> 'height', '')::int,
      coalesce((e ->> 'position')::int, 0)
    from jsonb_array_elements(p_photos) as e;
  end if;

  return v_post_id;
end;
$$;

revoke execute on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) from public, anon;
grant execute on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) to authenticated;
```

**Migración `create_post_images_bucket`** (bucket privado + policies):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', false, 10485760, array['image/webp', 'image/jpeg', 'image/png']);

create policy "post_images_staff_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_daycare_id()::text
  );

create policy "post_images_staff_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_daycare_id()::text
  );

create policy "post_images_daycare_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = public.current_daycare_id()::text
  );
```

Path de cada archivo: `{daycare_id}/{post_id}/{uuid}.webp`.

**Migración `seed_staff_room_and_posts`** (staff en Soles + 3 posts; `published_at` = hoy):

```sql
update public.users u
set room_id = (select id from public.rooms where name = 'Soles')
where u.role = 'staff' and u.room_id is null;

do $$
declare
  v_staff_id   uuid;
  v_daycare_id uuid;
  v_soles      uuid;
  v_mateo      uuid;
  v_post       uuid;
begin
  select id, daycare_id into v_staff_id, v_daycare_id
  from public.users where role = 'staff' order by created_at limit 1;

  select id into v_soles from public.rooms where name = 'Soles' limit 1;
  select id into v_mateo from public.children where full_name = 'Mateo Fernández' limit 1;

  -- 1) logro (niño)
  insert into public.posts (daycare_id, author_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, 'achievement',
          '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.',
          date_trunc('day', now()) + interval '14 hours 20 minutes')
  returning id into v_post;
  if v_mateo is not null then
    insert into public.post_children (post_id, child_id) values (v_post, v_mateo);
  end if;

  -- 2) actividad (niño; sin foto: ver Risks)
  insert into public.posts (daycare_id, author_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, 'activity',
          'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.',
          date_trunc('day', now()) + interval '9 hours 40 minutes')
  returning id into v_post;
  if v_mateo is not null then
    insert into public.post_children (post_id, child_id) values (v_post, v_mateo);
  end if;

  -- 3) anuncio (toda la sala)
  insert into public.posts (daycare_id, author_id, room_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, v_soles, 'announcement',
          'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.',
          date_trunc('day', now()) + interval '7 hours 50 minutes');
end $$;
```

**Tipos/cliente (TS):**

```ts
// src/lib/post-types.ts
export type PostType =
  "meal" | "nap" | "activity" | "achievement" | "photo" | "announcement";

export interface FeedPhoto {
  path: string;
  width: number | null;
  height: number | null;
  signedUrl: string | null;
}

export interface FeedPost {
  id: string;
  type: PostType;
  body: string;
  publishedAt: string;
  authorId: string;
  authorName: string;
  isRoomAnnouncement: boolean;
  audienceLabel: string; // "Para: familia de Mateo" | "Para: toda la sala"
  photos: FeedPhoto[];
  likes: number; // siempre 0 en esta spec
  comments: number; // siempre 0 en esta spec
}
```

## Implementation plan

Cada paso deja el sistema funcional:

1. `supabase migration new create_posts_tables` → SQL del bloque anterior; `supabase db push --dry-run` y `supabase db push`. Verificar con MCP `list_tables` y `execute_sql`.
2. `supabase migration new create_post_helpers_and_rpc` → políticas, helpers, guard de audiencia y `create_post`; aplicar y verificar con `execute_sql` (staff inserta OK; padre inserta → error de RLS).
3. `supabase migration new create_post_images_bucket` → bucket y policies; aplicar y verificar con `execute_sql` sobre `storage.buckets`.
4. `supabase migration new seed_staff_room_and_posts` → aplicar y verificar que el feed devuelve 3 posts ordenados 14:20 / 09:40 / 07:50.
5. `supabase gen types typescript --linked > src/lib/database.types.ts`; `npx tsc --noEmit`.
6. `next.config.ts`: `experimental.serverActions.bodySizeLimit = "15mb"` y `experimental.proxyClientMaxBodySize = "15mb"`.
7. `src/lib/image-compression.ts`: `compressImage(file)` con `createImageBitmap` + `<canvas>` → `toBlob('image/webp', 0.8)`, lado mayor 1920px; devuelve `{ blob, width, height }`. Si la compresión falla, cae al original (mismo mime permitido).
8. `src/lib/post-types.ts`: `PostType`, `FeedPost`, `typeTheme` (6 tipos) y `typeLabel` en español.
9. `src/data/current-user.ts`: mover `CurrentUser`/`currentUser` de `posts.ts` (valores idénticos) y borrar `src/data/posts.ts`.
10. `src/app/feed/actions.ts`:
    - `createPost(prevState, formData)`: `createClient()` + `getClaims()`; valida (destinatarios excluyentes, tipo, body, ≤10 fotos, mime y ≤10MB); genera `postId = crypto.randomUUID()`; sube cada archivo a `{daycare}/{postId}/{uuid}.webp` con `contentType: 'image/webp'`; **si cualquier subida falla, borra lo subido y devuelve `{ error }` sin insertar**; si todo sube, llama `rpc('create_post', …)`; si el RPC falla, borra lo subido y devuelve `{ error }`; si no, `revalidatePath('/')` y `{ success: true }`.
    - `loadMorePosts(cursor)`: misma consulta con filtro keyset `(published_at, id) < cursor`, `limit 10`, y `createSignedUrls` para las fotos.
11. `src/components/new-post-modal.tsx`: recibe `kids` (sala del staff), `roomName` y `canPublishWholeRoom`; TIPO con 6 chips; PARA con niños reales y "Toda la sala"; FOTOS con `<input type="file" accept="image/webp,image/jpeg,image/png" multiple>`, previews, botón quitar y contador; comprime al seleccionar; `useActionState` con `createPost`; errores inline; cierra y `router.refresh()` al éxito.
12. `src/app/page.tsx` → Server Component: lee el perfil (`users_select_self`); si `role === 'staff'` consulta los niños de su sala, las salas y el feed; pasa `canPublish` a Sidebar/Composer y datos a `feed-client.tsx`.
13. `src/components/feed-client.tsx`: estado del modal + posts + cursor; agrupa por día (`HOY`, `AYER`, `DD MMM`); botón "Ver más" que llama `loadMorePosts`; estado vacío con CTA.
14. `src/components/post-card.tsx`: recibe `FeedPost`; avatar del autor (megáfono si `isRoomAnnouncement`), subtítulo `HH:MM · publicado por vos` (o el nombre del autor si no es el actual), audiencia, body, imágenes con `<img src={signedUrl}>` y contadores en 0.
15. `src/components/sidebar.tsx` y `composer.tsx`: prop `canPublish?: boolean` (default `true`); si es `false`, no muestran "Nueva publicación"/Composer.
16. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `get_advisors` (security/performance), flujo manual completo, comparación visual con `feed.dc.html` y `crear-publicacion.dc.html` vía Playwright, y prueba de fuga con los 4 padres.

## Acceptance criteria

- [ ] `public.post_type` existe con los 6 valores; `users.room_id` y `posts.daycare_id` existen.
- [ ] `posts`, `post_children` y `post_photos` existen con sus columnas, FKs, índices y RLS habilitado.
- [ ] Existe `users_select_self`; un usuario autenticado lee su propia fila de `users` y no la de otros.
- [ ] `current_daycare_id()` e `is_staff()` devuelven los valores correctos para el staff y para un padre.
- [ ] `posts_staff_insert` permite al staff publicar y **rechaza** el insert de un padre.
- [ ] `posts_select_visible`: el staff ve todos los posts de su daycare; un padre ve solo los de sus hijos y los anuncios de la sala de sus hijos.
- [ ] `create_post` inserta post + niños + fotos en una transacción y devuelve el `id`; si falla, no deja filas parciales.
- [ ] `create_post` rechaza una sala o niños de otro daycare.
- [ ] Un post con `room_id` rechaza filas en `post_children` (trigger de audiencia).
- [ ] El bucket `post-images` existe, es privado, con `file_size_limit` 10MB y mime permitidos.
- [ ] El staff sube una imagen a `{daycare}/{post}/…` y un usuario de otro daycare no puede subir ni leer ese path.
- [ ] Existen 3 posts sembrados con `published_at` de hoy (14:20 / 09:40 / 07:50) y autor = staff.
- [ ] El staff logueado publica desde el modal y el post aparece primero en `/` y persiste al recargar.
- [ ] Si una subida de imagen falla, la publicación **no** se guarda, el modal queda abierto y muestra un error inline.
- [ ] Las imágenes se guardan como WebP con lado mayor ≤1920px y `post_photos` guarda `url` (path), `position`, `width` y `height`.
- [ ] "Publicar" exige destinatario + tipo + descripción; el tipo `photo` exige ≥1 imagen.
- [ ] "Toda la sala" persiste `room_id` sin filas en `post_children`; elegir niños persiste `post_children` sin `room_id`.
- [ ] `/` muestra 10 publicaciones y "Ver más" carga las siguientes con cursor por `(published_at, id)`.
- [ ] Los encabezados de fecha son HOY / AYER / `DD MMM`; sin publicaciones se muestra el estado vacío.
- [ ] `post-card` muestra autor y audiencia reales, las imágenes desde URLs firmadas y contadores en 0.
- [ ] Un padre logueado no ve "Nueva publicación" ni el Composer, y su INSERT es rechazado por RLS.
- [ ] Un padre no puede leer posts de niños de otro padre ni de otro daycare (probado con los 4 padres reales).
- [ ] `src/data/posts.ts` ya no existe y `src/data/current-user.ts` conserva la identidad mock.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [ ] `get_advisors` (security) sin issues nuevos y `supabase migration list` en sync.

## Decisions

- **Tomadas:** el feed real lee de la BD (no se mantiene el mock); `post_type` con los 6 valores de la referencia y "Ánimo" se retira del modal (mapeo UI en `src/lib/post-types.ts`); audiencia **excluyente** (`room_id` XOR `post_children`), forzada por el RPC y un trigger de guarda; se agrega `posts.daycare_id` y `users.room_id` como **desviaciones documentadas** de `info-database` (RLS por daycare y resolución de "Toda la sala"); bucket **privado** `post-images` con URLs firmadas; **atomicidad total**: una sola Server Action sube las imágenes y recién entonces llama al RPC transaccional, y compensa borrando lo subido si algo falla (el post nunca se guarda si una imagen falla); compresión **client-side** con Canvas nativo → WebP 1920px calidad 0.8 (sin dependencias, y entrega `width`/`height`); `post_photos.url` guarda el **path** del bucket, no la URL completa; `is_staff()`/`current_daycare_id()` como `SECURITY DEFINER` con `search_path = ''` y `execute` solo para `authenticated` (evitan la recursión de RLS sobre `users`); RLS de lectura para padres **desde ya**; UI oculta publicar a padres **y** RLS lo bloquea; paginación **cursor + "Ver más"** de 10; encabezados por día; seed de los 3 posts con `published_at` de hoy; la identidad de cabecera/sidebar sigue siendo mock.
- **Descartadas:** bucket público y URLs públicas (fotos de menores); expandir "Toda la sala" a una fila por niño; permitir audiencia mixta; subir desde el cliente para luego crear el post (no garantiza el "todo o nada"); enviar archivos a Postgres (`bytea`) en vez de Storage; compresión server-side o con librería; recortar a 3/6 imágenes o limitar tamaño distinto de 10MB; paginación por offset o scroll infinito; un único divider "PUBLICADO HOY"; sembrar fotos reales; `users` con policy abierta a todos los roles; los otros 6 enums/tablas de la referencia (`reactions`, `comments`, `daily_summaries`, `devices`).

## Risks

| Riesgo                                                                    | Mitigación                                                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| El límite de 1MB de Server Actions corta la subida de fotos               | Subir `serverActions.bodySizeLimit` y `proxyClientMaxBodySize` a `15mb` (el proyecto usa `src/proxy.ts`, que buffea el body) |
| `SECURITY DEFINER` en `public` invocable por cualquiera                   | `revoke execute` de `public`/`anon`, `grant` solo a `authenticated`, `search_path = ''` y sin datos de terceros              |
| Recursión de RLS entre `posts` y `post_children`                          | `post_children` usa `select using (true)` (patrón de `children`) y los insert policies solo exigen `is_staff()`              |
| `createSignedUrl` no firma por la policy de Storage                       | La policy de SELECT del bucket cubre al daycare; verificar el flujo de firma en el paso 16 y, si falla, ajustar la policy    |
| URLs firmadas expiran y las imágenes se rompen al scrollear               | Firmar con TTL de 1h y volver a firmar en cada página del cursor; en el peor caso el post conserva el `path`                 |
| El filtro keyset con PostgREST `.or()` es frágil con `timestamptz`        | Encadenar `published_at.lt` / `and(published_at.eq,id.lt)`; si complica, mover la paginación a un RPC `list_posts_page`      |
| `storage.buckets` insert desde una migración puede requerir privilegios   | Verificar tras el push; si falla, crear el bucket vía `storage` API/SQL con el rol de migración y documentar el paso         |
| Objetos huérfanos en Storage si el RPC falla después de subir             | Borrado compensatorio en la acción; el `post_id` en el path permite identificar restos                                       |
| El post sembrado de témperas queda sin imagen (el mock tenía placeholder) | Documentado: el placeholder punteado era artefacto del mock; la paridad visual se acepta con esa diferencia                  |
| Los padres creados por invitación no tienen `room_id`                     | No lo necesitan: su lectura se resuelve por `parent_children`/`children`; el `room_id` es solo para el staff                 |

## What is **not** in this spec

- Reacciones y comentarios (contadores en 0, "Editar" inerte).
- Editar y eliminar publicaciones.
- Detalle de publicación y vista de foto a pantalla completa.
- Feed de familia y `Avisos`.
- Notificaciones push y `daily_summaries`.
- Convertir la identidad de cabecera/sidebar al perfil real.
- Paginación por offset, scroll infinito o búsqueda en el feed.

Cada uno de esos, si llega, va en su propia spec.
