# SPEC 07 — Tabla `daycares` en Supabase

> **Status:** Implementado
> **Depends on:** — (ninguna; primera spec de BD)
> **Date:** 2026-09-05
> **Objective:** Crear la primera tabla `daycares` en Supabase siguiendo la referencia de `info-database`, estableciendo el patrón de migraciones vía MCP y sembrando 3 guarderías, entre ellas "Guardería Sala Soles".

## Scope

**In:**

- Aplicar migraciones versionadas a Supabase vía MCP `apply_migration` (patrón documentado en AGENTS.md).
- Crear la tabla `public.daycares` con `id` (uuid PK), `name`, `address` y `created_at`.
- Activar Row Level Security en `daycares` sin policies (deny-all por defecto).
- Seed de 3 registros: "Guardería Sala Soles", "Guardería Arcoíris" y "Guardería Pequeños Pasos", con direcciones de ejemplo.
- Verificación con MCP: `list_tables`, `list_migrations`, `get_advisors` y query del seed.

**Out of scope (para specs futuras):**

- Policies de RLS (llegan con la spec de `users`/auth).
- Otras tablas (`users`, `rooms`, `children`, …) y enums — cada una con su spec/migración.
- Grants del Data API (`anon`/`authenticated`) para consumir la tabla desde el cliente.
- Instalación de `@supabase/supabase-js`, cliente y tipos generados.

## Data model

**Migración 1 — DDL** (aplica `create_daycares_table`):

```sql
create table public.daycares (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  address    text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

**Migración 2 — Seed** (aplica `seed_daycares`):

```sql
insert into public.daycares (name, address) values
  ('Guardería Sala Soles',    'Av. Siempre Viva 742, Buenos Aires'),
  ('Guardería Arcoíris',      'Calle Colores 123, Montevideo'),
  ('Guardería Pequeños Pasos','Av. del Progreso 456, Lima');
```

Convenciones de la referencia: PK `uuid` con `gen_random_uuid()`, campos en inglés, `created_at` timestamptz. Los nombres de guardería y direcciones son datos (español es válido).

## Implementation plan

Cada paso deja la BD en un estado funcional:

1. Aplicar la migración `create_daycares_table` con el MCP `apply_migration` (DDL + RLS).
2. Aplicar la migración `seed_daycares` con el MCP `apply_migration` (INSERTs).
3. Verificar con `list_tables` (public) que `daycares` existe con columnas `id`, `name`, `address`, `created_at` y PK `id`.
4. Verificar con `execute_sql` (`select name from public.daycares order by created_at`) que las 3 filas existen.
5. Verificar con `list_migrations` que ambas migraciones quedaron registradas.
6. Correr `get_advisors` (security) y confirmar que no hay issues nuevos.

## Acceptance criteria

- [x] `public.daycares` existe en Supabase con `id` (uuid PK), `name` (text not null), `address` (text nullable) y `created_at` (timestamptz).
- [x] El default de `id` es `gen_random_uuid()`.
- [x] `created_at` tiene default `now()`.
- [x] RLS está habilitado en `daycares` y sin policies (deny-all).
- [x] Existen exactamente 3 registros semilla: "Guardería Sala Soles", "Guardería Arcoíris" y "Guardería Pequeños Pasos", cada uno con su dirección.
- [x] "Guardería Sala Soles" está entre los registros creados.
- [x] `list_migrations` muestra `create_daycares_table` y `seed_daycares`.
- [x] `get_advisors` (security) no reporta issues nuevos sobre la tabla.
- [x] No se modificó ningún archivo del código Next.js.

## Decisions

- **Tomadas:** patrón de migraciones vía MCP `apply_migration` (no hay CLI instalado ni carpeta `supabase/`, y AGENTS.md ya documenta el MCP); DDL y seed en migraciones separadas (mantiene versiones legibles e independientes); RLS activada sin policies (práctica segura de Supabase; las policies llegan con el modelo de usuarios); `address` agregado como texto nullable (fuera de la referencia, pedido por el usuario); `id uuid gen_random_uuid()` según referencia (fragmentación irrelevante en tabla raíz de baja cardinalidad); seed sin IDs fijos (nada los referencia aún; no se hardcodean IDs entre migraciones); `created_at` con `default now()` (estándar Supabase; la referencia solo indica el tipo); spec solo-BD, sin tocar la app.
- **Descartadas:** setup CLI + carpeta `supabase/migrations/` como fuente de verdad en git (setup extra que no se necesita hoy); RLS diferida (inseguro si alguien expone la tabla antes); `updated_at` en `daycares` (la referencia no lo lista); seed con un solo registro o con IDs fijos; instalar el cliente Supabase y generar tipos (va con una spec de pantalla real).

## What is **not** in this spec

- Policies de RLS ni modelo de usuarios/auth.
- El resto de tablas y enums de la referencia.
- Consumo de la tabla desde la app (grants, cliente, tipos).
- Más registros semilla que los 3 definidos.

Cada uno de esos, si llega, va en su propia spec.
