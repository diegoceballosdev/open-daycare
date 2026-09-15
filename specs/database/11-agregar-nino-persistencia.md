# SPEC 11 — Agregar niño funcional: tablas `rooms` y `children` + persistencia

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 08, SPEC 09, SPEC 10
> **Date:** 2026-09-07
> **Objective:** Crear las tablas `rooms` y `children` en Supabase (con enums, RLS y seeds) y conectar el modal "Agregar niño" de `/ninos` para persistir niños reales con validación cliente y servidor.

## Scope

**In:**

- Migración: enum `child_status`, tablas `public.rooms` y `public.children` según la referencia `info-database`, RLS + policies para `authenticated`, trigger `set_updated_at` reutilizado de SPEC 09.
- Migración seed: 3 salas ("Soles", "Lunas", "Estrellas") en "Guardería Sala Soles" y 6 niños (los 6 primeros del mock) en la sala "Soles".
- Tipos TypeScript generados con `supabase gen types typescript`.
- `/ninos` y `/ninos/[id]` pasan a leer de la BD (se elimina el mock de `src/data/children.ts`).
- Modal `add-child-modal.tsx`: campo SALA como `<select>` con las salas de la BD (default "Soles"), guardado vía Server Action `addChild`, validaciones cliente + servidor.
- Validación de alergias por split por coma + trim en `allergy_tags` (text[]); `enrolled_at = hoy`; `medical_notes` opcional.

**Out of scope (para specs futuras):**

- Política de RLS restringida a staff (`is_staff()`) — las policies quedan para `authenticated`, el modelo de padres/roles llega con `parent_children`.
- Vincular padres (`parent_children`, SPEC 05): los niños creados quedan sin padres ("VINCULAR" inerte).
- Traducción español→inglés de alergias (peanut, lactose) — los tags se guardan tal como se escriben.
- Editar / eliminar / archivar niños.
- La lista de los otros 2 niños del mock (Lucas Romero, Olivia Vega) — no se siembran.

## Data model

**Migración `create_rooms_children_tables`** (enum + tablas + RLS + policies + trigger):

```sql
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
```

**Migración `seed_rooms_and_children`** (referencia por nombre, sin IDs fijos — patrón SPEC 09):

```sql
insert into public.rooms (daycare_id, name)
select d.id, r.name
from (values ('Soles'), ('Lunas'), ('Estrellas')) as r(name)
cross join public.daycares d
where d.name = 'Guardería Sala Soles';

insert into public.children (room_id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
select r.id, c.full_name, c.birth_date, c.enrolled_at, c.allergy_tags, c.medical_notes
from (values
  ('Mateo Fernández', date '2022-03-12', date '2025-02-01', array['Maní'],    'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.'),
  ('Sofía Méndez',    date '2023-06-14', date '2025-03-01', array[]::text[], null),
  ('Benjamín Ruiz',   date '2022-09-02', date '2025-01-01', array[]::text[], null),
  ('Valentina Soto',  date '2023-11-20', date '2025-04-01', array[]::text[], null),
  ('Tomás Díaz',      date '2022-01-08', date '2025-02-01', array['Lactosa'], 'Alergia a la lactosa. Evitar lácteos. Trae su propia leche.'),
  ('Emma Castro',     date '2023-07-25', date '2025-05-01', array[]::text[], null)
) as c(full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
join public.rooms r on r.name = 'Soles';
```

Los grants `anon`/`authenticated` ya existen vía `ALTER DEFAULT PRIVILEGES` de Supabase (verificado: `authenticated` tiene SELECT/INSERT hoy sobre `daycares`/`users`). No hacen falta `GRANT` explícitos; las policies RLS son la puerta.

## Implementation plan

Cada paso deja el sistema funcional:

1. Migraciones: `supabase migration new create_rooms_children_tables` y `... seed_rooms_children` → escribir el SQL anterior, `supabase db push --dry-run`, luego `supabase db push`. Verificar con MCP `list_tables`, `execute_sql` y `list_migrations`.
2. `supabase gen types typescript --linked > src/lib/database.types.ts` (crear `src/lib/`). Verificar `npx tsc --noEmit`.
3. `src/lib/child-validation.ts`: extraer `isValidBirthDate` (dd/mm/aaaa real, no futura) a un módulo compartido cliente/servidor.
4. `src/app/ninos/actions.ts` — Server Action `addChild(prevState, formData)`: valida en servidor (nombre, fecha, sala), inserta en `children` con `enrolled_at = hoy`, `allergy_tags` = split por coma + trim (vacío si no hay), `medical_notes` opcional, `status active`, `photo_consent true`; `revalidatePath('/ninos')`; retorna `{ error }` o `{ success }`.
5. `src/app/ninos/page.tsx` → Server Component: `createClient()` + query `children` con join a `rooms`; renderiza un nuevo wrapper cliente `src/components/ninos-page-client.tsx` (dueño del estado del modal, botón "Agregar niño" y la lista). Se elimina el import del mock.
6. `src/components/add-child-modal.tsx`: recibe `rooms` como prop; SALA = `<select>` con las 3 salas (default "Soles", requerido); submit vía `useActionState` con `addChild` (patrón de `login-form.tsx`); en error muestra mensaje inline y no cierra; en éxito cierra + `router.refresh()`. Usa `child-validation.ts`.
7. `src/components/child-card.tsx` y `child-profile.tsx`: adaptar a los tipos de BD (edad calculada desde `birth_date`, badge de alergia = primer tag en mayúscula, 0 padres → "VINCULAR"). Borrar `src/data/children.ts`.
8. `src/app/ninos/[id]/page.tsx`: Server Component que busca el niño por id (join sala) y renderiza `ChildProfile`; si no existe, redirige a `/ninos`. `params` async.
9. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`, MCP (advisors), flujo manual y comparación visual contra `agregar-nino.dc.html` y `ninos.dc.html`.

## Acceptance criteria

- [x] `public.child_status` existe con `active`/`archived`.
- [x] `public.rooms` existe con `id`, `daycare_id` (FK→daycares), `name`, `created_at`, RLS activo y policy `select` para `authenticated`.
- [x] `public.children` existe con todos los campos de la referencia (`room_id` FK nullable, `full_name`, `birth_date`, `enrolled_at`, `medical_notes` nullable, `allergy_tags` text[] default `'{}'`, `photo_consent` default `true`, `status` default `active`, timestamps), RLS activo y policies `select`/`insert` para `authenticated`.
- [x] Trigger `children_set_updated_at` existe (reusa `set_updated_at` de SPEC 09).
- [x] Existen exactamente 3 salas en "Guardería Sala Soles": Soles, Lunas y Estrellas.
- [x] Existen exactamente 6 niños en la sala Soles (Mateo, Sofía, Benjamín, Valentina, Tomás con LACTOSA, Emma), con fechas de nacimiento y notas correctas.
- [x] No hay grants explícitos hardcodeados; `authenticated` puede leer `rooms`/`children` e insertar en `children` (verificado con `has_table_privilege` o policies).
- [x] `src/lib/database.types.ts` existe y `npx tsc --noEmit` pasa.
- [x] `/ninos` muestra los 6 niños desde la BD (sin datos mock).
- [x] El modal carga las 3 salas en el `<select>` SALA con "Soles" seleccionada por defecto.
- [x] Validación (cliente y servidor): nombre requerido; fecha `dd/mm/aaaa` real y no futura; sala requerida; alergias y notas opcionales.
- [x] Guardar persiste una fila en `children` con `enrolled_at = hoy`, `allergy_tags` separados por coma y trim, `medical_notes` opcional.
- [x] Tras guardar, el modal se cierra, el nuevo niño aparece en la lista y persiste al recargar la página.
- [x] Un error de BD/migración muestra mensaje inline en el modal y este permanece abierto.
- [x] `/ninos/[id]` del niño recién creado muestra su perfil desde la BD.
- [x] `supabase migration list` en sync y `db push --dry-run` sin pendientes.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] `get_advisors` (security) sin issues nuevos.

## Decisions

- **Tomadas:** tablas y enums según referencia `info-database`; `set_updated_at` reutilizado de SPEC 09; RLS con policies solo `authenticated` (SELECT rooms, SELECT+INSERT children) porque el seed único es staff y el modelo de roles/padres llega después; grants por default privileges de Supabase (verificado), sin `GRANT` explícitos; seed por nombre sin hardcodear IDs (patrón SPEC 09); 3 salas (Soles, Lunas, Estrellas) y 6 niños del mock en "Soles"; `allergy_tags` con split por coma + trim sin traducir (la traducción es otra spec); `enrolled_at = hoy` (el formulario no tiene el campo); tipos generados con `supabase gen types`; escrituras por Server Action `addChild` y lecturas por Server Components; el mock `children.ts` se elimina.
- **Descartadas:** policy restrictiva `is_staff()` (más seguridad pero capa nueva; las policies de rol llegan con el modelo de padres); sembrar los 8 niños del mock (el usuario pidió 6); mantener la lista en mock (el alta persistida no aparecería); insert directo desde el cliente (sin validación server-side); SALA fija "Soles" (contradice la tabla `rooms`); `enrolled_at` como campo extra del modal (se aleja del mock); traducir alergias a inglés en esta spec.

## Risks

| Riesgo                                                             | Mitigación                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `supabase gen types` falla si la CLI no está linkeada              | Fallback: tipos manuales en `src/lib/` con la forma Row/Insert; el diff del archivo generado es descartable     |
| Al borrar el mock, otras rutas importan `children`                 | `grep` de imports de `src/data/children` antes de borrar; adaptar `ChildCard`/`ChildProfile`                    |
| El nuevo niño no aparece tras guardar (caché del router)           | `revalidatePath('/ninos')` en la acción + `router.refresh()` en el modal tras éxito                             |
| `public.users` sigue en deny-all y el cliente no puede leer el rol | Las queries de la página usan `rooms`/`children` (con policies), no `users`; el rol no se necesita en esta spec |

## What is **not** in this spec

- Policies de RLS por rol ni `is_staff()`.
- Vincular/desvincular padres (`parent_children`).
- Editar, eliminar o archivar niños.
- Traducción español→inglés de los tags de alergia.
- Lista de los 8 niños mock completos (solo 6 sembrados).

Cada uno de esos, si llega, va en su propia spec.
