# SPEC 15 — Rol `admin` y alta de staff desde `/equipo`

> **Status:** Aprobado
> **Depends on:** SPEC 09, SPEC 10, SPEC 12, SPEC 14
> **Date:** 2026-09-15
> **Objective:** Habilitar el rol `admin` y permitir que un admin autenticado liste al equipo de su daycare y cree usuarios `staff` desde `/equipo`, enviándoles por email un enlace para fijar su contraseña.

## Scope

**In:**

- Rol `admin` operativo: helper `public.is_admin()` y `public.is_staff()` **redefinida** para incluir `staff` y `admin` (el admin hereda las capacidades del staff).
- Migración `create_admin_helper`: `is_admin()` + nueva definición de `is_staff()` + grants.
- Migración `seed_admin_user`: usuario `admin@opendaycare.com` / `Admin123!` (email confirmado) en "Guardería Sala Soles", creado por `INSERT` en `auth.users` con `app_metadata.role = admin` (patrón del seed de SPEC 09) y `room_id = Soles`.
- Cliente `service_role` **solo de servidor** en `src/utils/supabase/admin.ts`.
- Server Actions de `/equipo`: `createStaff(prevState, formData)` (validar → `auth.admin.createUser` → `generateLink({ type: 'invite' })` → enviar con Resend) y la lectura del equipo del daycare.
- Plantilla de email `src/emails/staff-invitation-email.tsx` (misma identidad que `invitation-email.tsx`).
- Ruta `/equipo` (Server Component que exige `role = admin`) + `src/components/team-client.tsx` con la lista del equipo y el formulario de alta (nombre, email, sala obligatoria).
- Ruta pública `/definir-contrasena` (`page` + form + Server Action `auth.updateUser({ password })`) como destino del enlace; se agrega a las rutas públicas de `src/proxy.ts`.
- Ítem "Equipo" en `src/components/sidebar.tsx`, visible solo para `admin`.
- Regeneración de tipos (`supabase gen types`).

**Out of scope (para specs futuras):**

- Editar, desactivar o eliminar staff; resetear contraseñas; subir/editar avatares.
- Promover o degradar roles (`staff` ↔ `admin`), incluyendo crear más admins desde la UI.
- Listar o administrar padres desde `/equipo`.
- Notificaciones (`notify_on_post`, `daily_summary_enabled`) y `devices`.
- Move de la identidad mock a la real (va en SPEC 16).

## Data model

**Migración `create_admin_helper`** (helpers y grants; sin tablas nuevas):

```sql
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

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
-- is_staff ya estaba revocada de public/anon y otorgada a authenticated en SPEC 14.
```

`is_staff()` alimenta `users_select_staff_daycare`, `posts_staff_insert`, `posts_select_visible`, `post_children_staff_insert`, `post_photos_staff_insert` y las policies de `storage.objects` del bucket `post-images`; al incluir `admin`, el admin accede a todas esas capacidades **sin policies nuevas**.

> **Nota RLS:** `users_select_staff_daycare` devuelve **todos** los usuarios del daycare (incluye padres). La consulta de `/equipo` debe filtrar explícitamente por `role in ('staff','admin')`.

**Migración `seed_admin_user`** (el trigger replica la fila a `public.users`; luego se asigna la sala):

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
  'admin@opendaycare.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'admin'),
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'full_name', 'Admin Demo'
  ),
  now(), now(),
  '', '', '', '', ''
);

-- El trigger no setea room_id; se asigna aquí para que el admin pueda publicar "Toda la sala".
update public.users u
set room_id = (select id from public.rooms where name = 'Soles')
where u.role = 'admin' and u.room_id is null;
```

**Alta de staff (Server Action, no DDL):**

- `auth.admin.createUser({ email, email_confirm: false, app_metadata: { role: 'staff' }, user_metadata: { daycare_id, full_name } })` → el trigger crea `public.users` con `daycare_id` del admin y `status = active`.
  - **Verificado en implementación:** con la Admin API el trigger `handle_new_user` **no ve** `app_metadata.role` (GoTrue aplica el `app_metadata` personalizado después del INSERT), así que la fila nace con `role = parent`. El rol se reafirma en el `UPDATE` posterior.
- `role = 'staff'` y `room_id` se asignan en un `UPDATE` posterior desde la Server Action con `service_role` (el trigger no setea `room_id`), validando que la sala pertenezca al daycare del admin.
- Email: `auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: `${APP_URL}/definir-contrasena` } })` devuelve `properties.action_link`; se envía con Resend (`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`).
  - **Verificado en implementación:** el `action_link` es *implicit flow* (sesión en el fragmento `#access_token=…`), pero `@supabase/ssr` fuerza `flowType: 'pkce'` y supabase-js descarta ese fragmento (`AuthPKCEGrantCodeExchangeError`, silencioso). El formulario de `/definir-contrasena` adjunta los tokens del fragmento al `FormData` y la Server Action hace `auth.setSession({ access_token, refresh_token })` antes de `auth.updateUser({ password })`.
  - El vínculo `type: 'invite'` es de un solo uso: una vez abierto (o confirmado el email) no se puede regenerar otro invite para el mismo usuario; el reenvío requeriría `recovery`/`magiclink` (fuera de alcance).

## Implementation plan

Cada paso deja el sistema funcional. Los pasos de BD los ejecuta el agente `db-migrator` (subagente de `spec-impl`).

1. Migración `create_admin_helper`: `is_admin()` + `is_staff()` redefinida + grants; `supabase db push --dry-run` y `supabase db push`; verificar con MCP `list_tables`/`execute_sql` que `is_admin()` responde para un admin y `is_staff()` es `true` para staff y admin.
2. Migración `seed_admin_user`: INSERT del admin + `UPDATE` de `room_id`; aplicar y verificar `select role, status, room_id from public.users where full_name = 'Admin Demo'`.
3. `supabase gen types typescript --linked > src/lib/database.types.ts`; `npx tsc --noEmit`.
4. `src/utils/supabase/admin.ts`: cliente con `SUPABASE_SERVICE_ROLE_KEY`, sin `NEXT_PUBLIC_`, con `autoRefreshToken: false` y `persistSession: false`; marcado server-only (no importable desde Client Components).
5. `src/emails/staff-invitation-email.tsx`: plantilla con nombre del staff, nombre del daycare y el `action_link` (misma identidad visual que `invitation-email.tsx`).
6. `src/app/equipo/actions.ts`:
   - `createStaff(prevState, formData)`: `createClient()` + `getClaims()`; re-verificar en `public.users` que el llamador tenga `role = 'admin'` (no confiar en el cliente); validar nombre, email y que `room_id` pertenezca al daycare del admin; llamar `auth.admin.createUser`; asignar `room_id`; `generateLink` invite; enviar con Resend; devolver `{ error }` claro ante email ya registrado o fallo de envío; `revalidatePath('/equipo')` y `{ success: true }`.
7. `src/app/equipo/page.tsx`: con `getClaims()` + perfil; si `role !== 'admin'` → `redirect('/')`; leer los usuarios del daycare filtrando `role in ('staff','admin')`; enriquecer con emails vía `admin.listUsers()` (mapa `id → email`, service_role, server-only); listar salas del daycare; pasar todo a `team-client.tsx`.
8. `src/components/team-client.tsx`: lista del equipo (nombre, email, etiqueta de rol, sala, estado) y formulario de alta (nombre, email, select de sala) con `useActionState`; estados de error/éxito y `router.refresh()` al crear.
9. `src/app/definir-contrasena/` (page + form + action que llama `supabase.auth.updateUser({ password })`); agregar `/definir-contrasena` a las rutas públicas de `src/proxy.ts`.
10. `src/components/sidebar.tsx`: ítem "Equipo" (`/equipo`) condicionado a un prop `isAdmin`; pasar el flag desde `page.tsx`/páginas que renderizan el Sidebar (consumiendo `getClaims`).
11. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`; `get_advisors` (security/performance); flujo manual completo (admin crea staff → email → define contraseña → login → publica) y prueba negativa (staff/padre no accede a `/equipo`); verificación visual del sidebar con Playwright.

## Acceptance criteria

- [ ] `public.is_admin()` existe y devuelve `true` solo para `role = 'admin'`.
- [ ] `public.is_staff()` devuelve `true` para `staff` y `admin`, y `false` para `parent`.
- [ ] Existe `admin@opendaycare.com` (`role = admin`, `status = active`, `room_id = Soles`) con sesión funcional.
- [ ] Un admin autenticado ve `/equipo` y el ítem "Equipo" en el sidebar; un `staff` o `parent` es redirigido a `/` y no ve el ítem.
- [ ] El formulario exige nombre, email válido y una sala del daycare; muestra errores inline sin crear el usuario.
- [ ] Crear staff genera la fila en `auth.users` con `app_metadata.role = 'staff'` y la fila en `public.users` con `role = staff`, `status = active`, `room_id` elegido y el daycare del admin.
- [ ] Se envía el email de invitación vía Resend con el `action_link`.
- [ ] El staff abre el enlace, define su contraseña en `/definir-contrasena`, inicia sesión y publica desde el modal (el post aparece en `/`).
- [ ] Un email ya registrado muestra un error y **no** crea ni modifica al usuario.
- [ ] El admin solo ve staff/admins de **su** daycare (no de otro daycare).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no aparece en el bundle del cliente.
- [ ] `src/data/current-user.ts` y la identidad mock no se modifican en esta spec.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan; `get_advisors` (security) sin issues nuevos y `supabase migration list` en sync.

## Decisions

- **Tomadas:** `admin` hereda las capacidades de `staff` redefiniendo `is_staff()` (evita duplicar policies y no obliga a tocar las policies de posts/storage); alta por **Admin API con `service_role`** porque `app_metadata` es la fuente del rol en el trigger y solo se escribe desde servidor; invitación con `createUser` (para fijar `app_metadata.role = staff` desde el `INSERT`) + `generateLink({ type: 'invite' })` + **Resend** (mantiene la marca y reutiliza la infra existente); sala **obligatoria** en el form para habilitar "Toda la sala"; alcance mínimo **listar + crear**; seed de admin reproducible en migración (patrón SPEC 09); se asigna `room_id = Soles` al admin en el seed para que pueda publicar; `/equipo` filtra explícitamente `role in ('staff','admin')` porque la policy del daycare no filtra por rol; los emails del equipo se resuelven con `admin.listUsers()` (no viven en `public.users`).
- **Descartadas:** RPC que inserta directo en `auth.users` con `crypt` (frágil ante cambios de Auth y duplica lógica de Supabase); correo integrado de Supabase (`inviteUserByEmail`) porque el rol se aplicaría tarde y el email no lleva la marca; reutilizar el sistema de `invitations` (atado a `child_id`); editar/desactivar/cambiar roles en esta spec; crear `admin` desde la UI.

## Risks

| Riesgo                                                                      | Mitigación                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| El `action_link` de `generateLink` no redirige bien a `/definir-contrasena` | Configurar `redirectTo` con `APP_URL` y verificar el ciclo completo en el paso 11; ajustar la allowlist de redirects en Supabase si hiciera falta |
| El trigger no recibe `app_metadata.role` al crear con la Admin API y la fila nace como `parent` | La Server Action reafirma `role = 'staff'` en el `UPDATE` posterior (junto con `room_id`), siempre con `service_role`; un fallback a `user_metadata.role` en el trigger sería escalada de privilegios vía `signUp`, por eso se descarta |
| El `action_link` (implicit) es incompatible con PKCE (`@supabase/ssr`) y no crea sesión | Los tokens del fragmento viajan en el `FormData` y la Server Action hace `auth.setSession(...)` antes de `auth.updateUser(...)`; no se depende del parseo del hash en el cliente |
| `/definir-contrasena` es ruta pública: con una sesión activa el proxy redirige a `/` | Aceptado: al seguir el enlace de invitación todavía no hay cookie (la sesión vive en el fragmento), así que la página carga; un usuario ya logueado que abra un enlace de recuperación sí es redirigido |
| `service_role` se filtra al cliente                                         | Módulo server-only, sin `NEXT_PUBLIC_`, importado solo en Server Actions/Components; verificar el bundle                                          |
| El trigger aborta si falta `user_metadata.daycare_id`                       | Pasar siempre el `daycare_id` del admin autenticado en `createUser`                                                                               |
| El admin está en un daycare distinto al de la sala elegida                  | La Server Action valida que `room_id` pertenezca a `current_daycare_id` antes de asignar                                                          |
| `is_staff()` incluyendo `admin` ensancha accesos                            | Intencional y documentado: `admin` = super-staff; revisar `get_advisors` en el paso 11                                                            |
| `admin.listUsers()` pagina y no lista a todos los usuarios                  | Recorrer páginas por `perPage` hasta agotar o listar solo el daycare; si complica, resolver emails por `getUserById` en paralelo                  |
| El enlace de invitación no crea sesión por PKCE/plantilla de Auth           | Probar en el paso 11; si falla, cambiar a `type: 'recovery'` o usar `inviteUserByEmail` con redirect configurado                                  |
| El seed deja al admin sin sala si "Soles" no existe                         | El `UPDATE` es idempotente (`where room_id is null`) y no falla si la sala no está; se verifica en el paso 2                                      |

## What is **not** in this spec

- Editar, desactivar o eliminar staff; reset de contraseñas; avatares.
- Cambiar roles o crear más admins desde la UI.
- Administrar padres desde `/equipo`.
- Notificaciones y preferencias de usuario.
- Convertir la identidad de cabecera/sidebar al perfil real (SPEC 16).

Cada uno de esos, si llega, va en su propia spec.
