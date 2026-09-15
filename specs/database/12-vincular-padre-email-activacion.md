# SPEC 12 — Invitar padre (email Resend) y activación de cuenta con código

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 09, SPEC 10, SPEC 11
> **Date:** 2026-09-08
> **Objective:** Persistir la invitación de un padre desde el modal "Vincular otro padre" de `/ninos/[id]`, enviar el correo con el código vía Resend y convertir `/activar` en el registro real del padre con el código, creando el vínculo `parent_children`.

## Scope

**In:**

- Migraciones: enums `relationship_type` e `invitation_status`, y tablas `public.invitations` y `public.parent_children` según la referencia `info-database`, con RLS, policies y la función `activate_invitation`.
- Tipos TypeScript generados con `supabase gen types typescript`.
- `src/components/link-parent-modal.tsx`: formulario con validación cliente/servidor (nombre, email, parentesco), generación de código de 6 alfanuméricos, alta en `invitations` (`pending`, `expires_at` +7 días, `invited_by` = staff logueado) y envío del correo de invitación.
- Envío de correo: paquete `resend` + componente React Email `src/emails/invitation-email.tsx` con el código y un enlace a `/activar?code=...`.
- `src/app/activar`: formulario real de activación (código, email, contraseña, confirmar contraseña) que valida la invitación contra BD, crea la cuenta en Supabase Auth (`role=parent`, `daycare_id` + `full_name` en metadata), crea `parent_children` y marca la invitación `accepted`.
- `src/components/child-profile.tsx` y `child-card.tsx`: mostrar la lista real de padres vinculados (join `parent_children` → `users`) y el conteo por niño.

**Out of scope (para specs futuras):**

- Reenviar ni cancelar invitaciones.
- Reusar una cuenta existente al activar (se muestra error y no se crea nada).
- Desvincular padres.
- Recuperación de contraseña.
- Expiración automática con scheduler (la validez se comprueba al activar contra `expires_at`, sin jobs).
- Autenticación previa al activar (el padre está deslogueado por diseño; `/activar` es pública).

## Data model

**Migración `create_invitations_parent_children_tables`** (enums + tablas + RLS + policies + función RPC):

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id           uuid                  primary key default gen_random_uuid(),
  child_id     uuid                  not null references public.children (id),
  invited_by   uuid                  not null references public.users (id),
  full_name    text                  not null,
  email        text                  not null,
  relationship public.relationship_type not null,
  code         text                  not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz           not null,
  accepted_at  timestamptz,
  created_at   timestamptz           not null default now()
);

create table public.parent_children (
  id           uuid                  primary key default gen_random_uuid(),
  parent_id    uuid                  not null references public.users (id),
  child_id     uuid                  not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz           not null default now(),
  unique (parent_id, child_id)
);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- staff (autenticado) crea la invitación desde el modal
create policy "invitations_authenticated_insert"
  on public.invitations for insert to authenticated with check (true);

-- perfil: staff autenticado lee los padres vinculados
create policy "parent_children_authenticated_select"
  on public.parent_children for select to authenticated using (true);

-- activación atómica y privilegiada (valida la invitación, crea el vínculo y marca accepted)
create or replace function public.activate_invitation(
  p_code text,
  p_email text,
  p_new_user_id uuid
)
returns table (ok boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
begin
  select * into v_invitation
  from public.invitations
  where code = p_code and lower(email) = lower(p_email)
  limit 1;

  if not found then
    return query select false, 'Código o email no válido.';
    return;
  end if;

  if v_invitation.status <> 'pending' then
    return query select false, 'Esta invitación ya fue usada.';
    return;
  end if;

  if v_invitation.expires_at < now() then
    return query select false, 'Esta invitación venció.';
    return;
  end if;

  insert into public.parent_children (parent_id, child_id, relationship)
  values (p_new_user_id, v_invitation.child_id, v_invitation.relationship);

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return query select true, 'Cuenta activada.';
end;
$$;

-- la función RPC es el único acceso en escritura a invitations/parent_children; blindar execute
revoke execute on function public.activate_invitation(text, text, uuid) from public, anon, authenticated;
```

> La función es `SECURITY DEFINER` (mismo patrón que `handle_new_user` de SPEC 09) porque la activación corre **sin sesión** (el padre está deslogueado) y debe leer/actualizar `invitations` y escribir `parent_children`, tablas con RLS que no exponen esos accesos. Se le pasa el `new_user_id` ya creado por `signUp`. El código es la credencial: la función solo deja pasar si `code`+`email` coinciden, está `pending` y no venció.

**Migración `seed`:** ninguna. No se siembran invitaciones ni vínculos (se generan en runtime).

## Implementation plan

Cada paso deja la app funcional:

1. Migraciones: `supabase migration new create_invitations_parent_children_tables` → escribir el SQL anterior; `supabase db push --dry-run`; luego `supabase db push`. Verificar con MCP `list_tables` (enums, tablas, policies, función) y `execute_sql`.
2. `supabase gen types typescript --linked > src/lib/database.types.ts`. Verificar `npx tsc --noEmit`.
3. Instalar Resend: `npm install resend`. Agregar `RESEND_API_KEY` al `.env` y al `.env.template`. Crear `src/emails/invitation-email.tsx` (componente React Email): logo, "Te invitamos a seguir el día de {child.firstName}", el código destacado y el botón/enlace "Activar mi cuenta" → `{origin}/activar?code={code}`.
4. `src/app/ninos/[id]/actions.ts` — Server Action `sendInvitation(prevState, formData)`: valida en servidor (nombre requerido, email con formato, parentesco), resuelve `daycare_id` desde `child → room → daycare` e `invited_by = auth.uid()`, genera un código único de 6 alfanuméricos (sin O/0/I/1, reintento si colisiona con un `code` existente), inserta en `invitations` (`pending`, `expires_at = now() + 7 days`), envía el correo con `resend.emails.send({ react: <InvitationEmail …/> })`, retorna `{ success }` con el código o `{ error }`.
5. `src/components/link-parent-modal.tsx`: agregar estado de envío y error inline; validación cliente de nombre/email antes de llamar a la acción; en éxito muestra una confirmación ("Invitación enviada a {email}") con el código generado y el botón cierra. El mapeo de parentesco Mamá→`mother`, Papá→`father`, Tutor/a→`guardian`. El código ya no se hardcodea (se muestra el generado o un estado de éxito).
6. `src/app/activar/page.tsx`: convertir el mock en un formulario cliente (patrón `login-form.tsx`): campos CÓDIGO (pre-relleno vía `searchParams.code`), EMAIL, CREAR CONTRASEÑA y CONFIRMAR CONTRASEÑA; muestra nombre del niño y parentesco desde la invitación cuando se valida. Server Action `activate` en `src/app/activar/actions.ts`.
7. Server Action `activate(prevState, formData)`: valida que las contraseñas coincidan y sean no vacías; `signUp(email, password, { data: { daycare_id, full_name } })`; si `error` es "User already registered" → devuelve "Este email ya está registrado."; si ok, llama RPC `activate_invitation(code, email, user.id)`; en éxito `redirect('/')` (el padre queda logueado); en error de la RPC devuelve el mensaje y no redirige.
8. `src/components/child-profile.tsx` y `child-card.tsx`: el perfil consulta `parent_children` (join `users`) y lista los padres vinculados (nombre + parentesco traducido Padre/Madre/Tutor) en lugar de "Sin padres vinculados todavía"; `child-card` muestra el conteo de padres. `/ninos/[id]/page.tsx` y `/ninos/page.tsx` amplían el `select` para traer `parent_children(parent_id, relationship, users(full_name))`.
9. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`, MCP `get_advisors` (security), flujo manual (invitar → llega el correo → activar → se ve en el perfil) y comparación visual del modal contra `vincular-padre.dc.html`.

## Acceptance criteria

- [ ] Existen los enums `public.relationship_type` (`father`/`mother`/`guardian`) e `invitation_status` (`pending`/`accepted`/`expired`/`cancelled`).
- [ ] `public.invitations` existe con `child_id` (FK→children), `invited_by` (FK→users), `full_name`, `email`, `relationship`, `code` UNIQUE, `status` default `pending`, `expires_at`, `accepted_at` nullable, `created_at`; RLS activo y solo policy `insert` para `authenticated`.
- [ ] `public.parent_children` existe con `parent_id` (FK→users), `child_id` (FK→children), `relationship`, `created_at` y `UNIQUE(parent_id, child_id)`; RLS activo y solo policy `select` para `authenticated`.
- [ ] Existe `public.activate_invitation(code, email, new_user_id)` (`SECURITY DEFINER`) que valida `pending` + no vencida + `code`/`email` coincidentes, inserta `parent_children` y marca `accepted` con `accepted_at`.
- [ ] `revoke execute` aplicado sobre `activate_invitation`. _(ver Riesgos)_
- [ ] El modal valida nombre/email (cliente y servidor) y muestra error inline si son inválidos.
- [ ] Enviar una invitación crea una fila en `invitations` con código de 6 alfanuméricos (sin O/0/I/1), `status=pending`, `expires_at = now()+7 días` e `invited_by` = staff logueado.
- [ ] El correo se envía vía Resend con el código y un enlace a `/activar?code=<código>`.
- [ ] Tras enviar con éxito, el modal muestra confirmación con el código generado.
- [ ] `/activar` pre-rellena el campo CÓDIGO desde `?code=` y permite editar código, email y contraseña (+confirmación).
- [ ] Activar con código+email válido crea la cuenta en `auth.users` (el trigger de SPEC 09 replica `public.users` con `role=parent`, `daycare_id` y `full_name` desde metadata), crea `parent_children` y marca la invitación `accepted`.
- [ ] Activar con código+email ya usados o vencidos muestra el error correspondiente y no crea nada.
- [ ] Activar con un email ya registrado muestra "Este email ya está registrado." y no crea nada.
- [ ] Si las contraseñas no coinciden o están vacías, error inline sin crear cuenta.
- [ ] Tras activar con éxito, el padre queda logueado y aterriza en `/`.
- [ ] El perfil del niño muestra los padres vinculados reales (nombre + Padre/Madre/Tutor) y la lista `/ninos` muestra el conteo.
- [ ] `supabase migration list` en sync y `db push --dry-run` sin pendientes.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [ ] `get_advisors` (security) sin issues nuevos.

## Decisions

- **Tomadas:** dos tablas nuevas según referencia `info-database`; parentesco mapeado UI→DB (Mamá→`mother`, Papá→`father`, Tutor/a→`guardian`); código de 6 alfanuméricos sin O/0/I/1 con unicidad (mayor espacio que el mock `7K4P9`, reintento en colisión); email con `resend` + React Email (`resend.emails.send({ react })`); correo con enlace `/activar?code=...` que pre-rellena el campo; `invitations.invited_by` = `auth.uid()` (staff); `expires_at = now()+7 días`; el vínculo `parent_children` se crea **al activar** (no al enviar), porque `parent_id` requiere la cuenta; la validación/activación corre por la función RPC `SECURITY DEFINER` `activate_invitation` (la activación es pública/sin sesión y debe tocar tablas con RLS); `users.status` queda `active` (el estado previo al signup se modela en `invitations`, como dice la referencia); si el email ya tiene cuenta → error y no se crea (Supabase Auth impide emails duplicados por defecto); RLS: `invitations` insert-authenticated y `parent_children` select-authenticated, el resto de accesos solo vía RPC.
- **Descartadas:** crear el vínculo al enviar la invitación (requería `parent_id` nullable o cuentas fantasma); `SECURITY INVOKER` para la activación (no podría leer `invitations` sin RLS policy anónima); exponer `invitations`/`parent_children` con policies `select`/`insert` amplias para anon/authenticated (riesgo de datos expuestos); template HTML plano (preferimos React Email tipado); código de 5 chars como el mock (menos espacio de códigos); reusar cuenta existente (decisión del usuario: error y no crear); scheduler de expiración (se valida `expires_at` al activar).

## Risks

| Riesgo                                                                      | Mitigación                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SECURITY DEFINER` `activate_invitation` invocable sin auth por la Data API | `revoke execute` desde anon/authenticated directo + `set search_path`; el código+email es la credencial. Revisar con `get_advisors`. Si se quiere endurecer, moverla a esquema no expuesto y exponerla por RPC con control de rol (spec futura). |
| La activación crea la cuenta y luego falla la RPC (padre sin vínculo)       | Registrar el error y avisar; documentar. Alternativa futura: transacción única.                                                                                                                                                                  |
| `signUp` con email confirmación habilitada no inicia sesión automática      | Si el proyecto exige confirmar email, el padre se loguea tras confirmar; se documenta y se ajusta la redirección.                                                                                                                                |
| La lista de padres del perfil exige joins nuevos (rendimiento/RLS)          | `parent_children` con policy select-authenticated y join a `users` (users sin policy → no se expone el nombre). Si `users` está deny-all, resolver el nombre por función o posponer el nombre (mostrar email/rol).                               |
| El correo de prueba de Resend no llega en dev (dominio no verificado)       | Usar `from` de dominio verificado o `onboarding@resend.dev` en dev; validar en staging con un email real.                                                                                                                                        |
| `RESEND_API_KEY` ausente rompe el envío                                     | Guardar en `.env`/`.env.template`; el Server Action devuelve error claro si falta.                                                                                                                                                               |

## What is **not** in this spec

- Reenviar o cancelar invitaciones.
- Reusar una cuenta existente al activar.
- Desvincular padres.
- Recuperación de contraseña.
- Expiración automática con scheduler.
- Auth previa al activar (el padre se registra deslogueado en `/activar`, ruta pública).

Cada uno de esos, si llega, va en su propia spec.
