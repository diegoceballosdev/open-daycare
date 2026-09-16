-- SPEC 15 — Rol `admin`: helper `is_admin()` y `is_staff()` ampliada a staff + admin.
-- El admin hereda las capacidades del staff: no se tocan las policies existentes de
-- `users`, `posts`, `post_children`, `post_photos` ni `storage.objects`.
-- `set search_path = ''` + nombres calificados evitan el hijacking de esquema.
-- `CREATE OR REPLACE` conserva el OID de la función y, con él, sus ACL ya otorgadas.

-- admin = rol con acceso a la gestión del equipo.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and role = 'admin')
$$;

-- El admin hereda las capacidades del staff (policies existentes sin cambios).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = (select auth.uid()) and role in ('staff', 'admin')
  )
$$;

-- Least privilege: Postgres otorga EXECUTE a PUBLIC por defecto en cada función nueva.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
-- is_staff ya estaba revocada de public/anon y otorgada a authenticated en la migración
-- 20260915204244 (`create_post_helpers_and_rpc`); el CREATE OR REPLACE de arriba no toca
-- esas ACL, así que no se vuelven a otorgar aquí.
