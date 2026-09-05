# SPEC 09 — Tabla `users`, enums y trigger de auth en Supabase

> **Status:** Aprobado
> **Depends on:** SPEC 07, SPEC 08
> **Date:** 2026-09-05
> **Objective:** Crear la tabla `public.users` con sus enums `user_role` y `user_status`, el trigger que replica perfiles desde `auth.users`, y un usuario staff semilla en "Guardería Sala Soles".

## Scope

**In:**

- Crear los enums `public.user_role` (`staff`/`parent`/`admin`) y `public.user_status` (`pending`/`active`).
- Crear la tabla `public.users` según la referencia `info-database`: `id` (uuid PK, FK → `auth.users(id)` ON DELETE CASCADE), `daycare_id` (uuid NOT NULL, FK → `daycares`) — un usuario = un daycare, un daycare = muchos usuarios —, `role`, `status` (default `active`), `full_name`, `avatar_url` (nullable), `notify_on_post` (default `true`), `daily_summary_enabled` (default `true`), `created_at`/`updated_at`.
- Activar RLS en `users` **sin policies** (deny-all, mismo patrón que SPEC 07).
- Función `handle_new_user()` (`SECURITY DEFINER`) + trigger `AFTER INSERT` en `auth.users` que replica la fila a `public.users`, con `revoke execute` como hardening.
- Trigger genérico `set_updated_at` que mantiene `updated_at` en UPDATE de `users`.
- Seed de un staff: `staff@opendaycare.com` / `Staff123!` (email confirmado) en "Guardería Sala Soles", creado vía INSERT en `auth.users` para que el trigger dispare la réplica.
- Migraciones en `supabase/migrations/` con la CLI (`supabase migration new`), fuente de verdad en git (SPEC 08).

**Out of scope (para specs futuras):**

- Policies funcionales de RLS (llegan con la spec de auth/login real).
- Grants del Data API (`anon`/`authenticated`) para `users` (la app aún no lo consume).
- El resto de tablas y enums de la referencia (`rooms`, `children`, `posts`, etc.).
- Cliente `@supabase/supabase-js` y tipos generados.
- Pantallas reales de login/registro.

## Data model

**Migración `create_users_table`** (enums + tabla + RLS + triggers):

```sql
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
```

**Migración `seed_staff_user`** (el trigger replica la fila a `public.users`):

```sql
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff@opendaycare.com',
  crypt('Staff123!', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'staff'),
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'full_name', 'Staff Demo'
  ),
  now(), now(),
  '', '', '', '', ''
);
```

Convenciones de la referencia: PK `uuid`, campos en inglés, `timestamptz`, `gen_random_uuid()`. `role` se lee de `raw_app_meta_data` (controlado por servidor) y no de `user_metadata`; el seed referencia el daycare por nombre, sin hardcodear IDs.

## Implementation plan

Cada paso deja la BD funcional:

1. Pre-check: `supabase migration list` (local/remoto en sync) y MCP `list_extensions` (confirmar `pgcrypto` para `crypt`/`gen_salt`).
2. `supabase migration new create_users_table` → escribir en el archivo: enums + tabla + RLS + función `handle_new_user` + trigger `on_auth_user_created` + `revoke execute` + función `set_updated_at` + trigger `users_set_updated_at`.
3. `supabase migration new seed_staff_user` → escribir el INSERT en `auth.users` del staff.
4. Verificar `supabase db push --dry-run` (sin errores, aplica las 2 migraciones nuevas).
5. Aplicar con `supabase db push`.
6. MCP `list_tables` (public): `users` existe con columnas/PK/FK y los enums `user_role`/`user_status` están registrados.
7. `execute_sql`: `select u.role, u.status, u.full_name, d.name from public.users u join public.daycares d on d.id = u.daycare_id` → el staff está activo en "Guardería Sala Soles".
8. Verificar el trigger: insertar un auth user desechable (`trigger-test@opendaycare.com` con metadata), confirmar la réplica en `public.users`, borrarlo y confirmar CASCADE.
9. `get_advisors` (security) sin issues nuevos; `npm run lint` y `npx tsc --noEmit` pasan (la app no se tocó).

## Acceptance criteria

- [x] `public.user_role` existe con valores `staff`, `parent`, `admin`.
- [x] `public.user_status` existe con valores `pending`, `active`.
- [x] `public.users` existe con `id` (uuid PK, FK→`auth.users` ON DELETE CASCADE), `daycare_id` (uuid NOT NULL, FK→`daycares`), `role`, `status` (default `active`), `full_name`, `avatar_url` (nullable), `notify_on_post` (default `true`), `daily_summary_enabled` (default `true`), `created_at`/`updated_at`.
- [x] RLS habilitado en `users` y sin policies (deny-all).
- [x] Existe `public.handle_new_user()` (`SECURITY DEFINER`, `search_path` fijado) y el trigger `on_auth_user_created` AFTER INSERT en `auth.users`.
- [x] `revoke execute` aplicado sobre `handle_new_user()` (no invocable por anon/authenticated).
- [x] Insertar en `auth.users` replica una fila en `public.users`, con `role` leído de `app_metadata` (fallback `parent`) y `daycare_id`/`full_name` de `user_metadata`.
- [x] Existe trigger que actualiza `updated_at` en UPDATE de `users`.
- [x] `staff@opendaycare.com` existe en `auth.users` (email confirmado) y su fila en `public.users` tiene `role=staff`, `status=active`, `full_name='Staff Demo'` y daycare "Guardería Sala Soles".
- [x] Borrar un auth user borra su fila en `public.users` (CASCADE).
- [x] `supabase migration list` muestra local = remoto y `db push --dry-run` sin pendientes.
- [x] `get_advisors` (security) sin issues nuevos.
- [x] No se modificó ningún archivo del código Next.js; `npm run lint` y `npx tsc --noEmit` pasan.

## Decisions

- **Tomadas:** solo enums `user_role`/`user_status` (spec enfocada; los demás enums llegan con sus tablas); RLS deny-all sin policies (patrón SPEC 07, las policies van con auth real); trigger `AFTER INSERT` en `auth.users` con `SECURITY DEFINER` (patrón de la referencia, necesario porque RLS bloquea el insert desde `authenticated`); `role` desde `raw_app_meta_data` con fallback `parent` — desviación de la referencia por seguridad, `user_metadata` es editable por el usuario y `role` es autorización, `full_name`/`daycare_id` sí desde `user_metadata`; `daycare_id` NOT NULL y `updated_at` con trigger genérico `set_updated_at` reutilizable (pedido del usuario); seed vía INSERT directo en `auth.users` con `crypt` (autocontenido en la migración, dispara el trigger y replica la fila; sin hardcodear IDs); `revoke execute` sobre la función SECURITY DEFINER.
- **Descartadas:** los otros 4 enums ahora; policies funcionales de RLS; grants `anon`/`authenticated` (la app no consume `users` aún); crear el staff por Admin API/script (depende de cliente/fetch y no queda reproducible en git); trigger que lea `role` de `user_metadata` (escalada de privilegios).

## Risks

| Riesgo                                                     | Mitigación                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `auth.users` cambia de esquema entre versiones de Supabase | Verificar columnas con `list_tables` antes de escribir el seed; el INSERT lista columnas explícitas                       |
| `pgcrypto` deshabilitado para `crypt()`/`gen_salt()`       | Verificar con `list_extensions` en el paso 1; habilitarlo si faltara (Supabase lo trae por defecto)                       |
| `SECURITY DEFINER` en `public` invocable por cualquiera    | `revoke execute` + `set search_path`; solo se ejecuta vía trigger                                                         |
| Signup real sin `daycare_id` en metadata aborta el trigger | Documentado: `daycare_id` es NOT NULL y debe venir en el signup; el flujo real (invitaciones/admin) lo provee             |
| Insert manual en `auth.users` no idempotente               | La migración se ejecuta una vez; si falla a mitad, `supabase db push` marca el estado y se corrige en una migración nueva |

## What is **not** in this spec

- Policies funcionales de RLS ni flujo de auth/login real.
- Grants del Data API ni consumo de `users` desde la app.
- El resto de tablas y enums de la referencia.
- Cliente Supabase ni tipos generados.
- Alta de usuarios por UI o Admin API.

Cada uno de esos, si llega, va en su propia spec.
