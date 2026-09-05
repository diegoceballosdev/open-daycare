# SPEC 08 — CLI de Supabase y migraciones como fuente de verdad en git

> **Status:** Aprobado
> **Depends on:** SPEC 07
> **Date:** 2026-09-05
> **Objective:** Instalar la CLI de Supabase, inicializar el proyecto local y adoptar `supabase/migrations/` como única fuente de verdad para cambios de esquema, registrando las migraciones de SPEC 07 como archivos físicos trackeados por git.

## Scope

**In:**

- Instalar la CLI de Supabase vía Scoop (`scoop bucket add supabase` + `scoop install supabase`).
- `supabase init` en la raíz del repo → crea `supabase/config.toml`, `supabase/.gitignore` y `supabase/migrations/`.
- `supabase login` (paso interactivo que completa el usuario en el navegador) y `supabase link --project-ref mcilycrcsfmbepzcxsxa` usando la DB password de `.env` (`SUPABASE_DB_PASSWORD`).
- Crear los archivos físicos de migración con los **mismos timestamps** del historial remoto: `20260905214416_create_daycares_table.sql` y `20260905214522_seed_daycares.sql`, con el SQL idéntico al ya aplicado (SPEC 07).
- Verificar con `supabase migration list` y `supabase db push --dry-run` que local y remoto quedan en sync, sin migraciones pendientes.
- Actualizar `AGENTS.md`: todo cambio futuro de esquema/RLS/políticas debe generar un archivo de migración local (`supabase migration new <nombre>` o `supabase db diff -f <nombre>`), el archivo es la fuente de verdad y el MCP `apply_migration` queda fuera del flujo para DDL.

**Out of scope (para specs futuras):**

- Levantar el stack local (`supabase start` / `supabase db reset`, requiere Docker).
- Git hooks ni CI que automaticen el enforcement del flujo.
- `supabase gen types` ni cliente `@supabase/supabase-js`.
- Otras tablas/policies de la referencia `info-database`.

## Data model

No introduce nuevas estructuras en la BD. Introduce archivos físicos en el repo:

- `supabase/config.toml` (commiteable, sin secretos).
- `supabase/.gitignore`.
- `supabase/migrations/20260905214416_create_daycares_table.sql`:

```sql
create table public.daycares (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  address    text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

- `supabase/migrations/20260905214522_seed_daycares.sql`:

```sql
insert into public.daycares (name, address) values
  ('Guardería Sala Soles',    'Av. Siempre Viva 742, Buenos Aires'),
  ('Guardería Arcoíris',      'Calle Colores 123, Montevideo'),
  ('Guardería Pequeños Pasos','Av. del Progreso 456, Lima');
```

Los timestamps coinciden con `supabase_migrations.schema_migrations` en remoto, por lo que `db push` los reconoce como ya aplicados.

## Implementation plan

Cada paso deja el sistema funcional:

1. Instalar la CLI: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` y `scoop install supabase`. Verificar con `supabase --version`.
2. `supabase init` en la raíz del repo (crea `supabase/` con `config.toml` y `migrations/`). Sin impacto en la app Next.js.
3. `supabase login` — paso interactivo: el agente avisa al usuario para completarlo en el navegador.
4. `supabase link --project-ref mcilycrcsfmbepzcxsxa` — DB password desde `SUPABASE_DB_PASSWORD`.
5. Crear `supabase/migrations/20260905214416_create_daycares_table.sql` y `20260905214522_seed_daycares.sql` con el SQL ya aplicado (SPEC 07). Nota: `migration new` antepone el timestamp actual, por eso la adopción se hace escribiendo los archivos con nombre exacto.
6. Verificar sync: `supabase migration list` (local = remoto) y `supabase db push --dry-run` (sin pendientes).
7. Actualizar `AGENTS.md`: reemplazar el patrón MCP de DDL por el flujo CLI; mantener MCP `execute_sql`/`list_tables`/`get_advisors` para consultas read-only y diagnóstico.
8. Verificación final: `git status` muestra la carpeta `supabase/` lista para commitear, `npm run lint` y `npx tsc --noEmit` pasan, y `get_advisors` (security) sin issues.

## Acceptance criteria

- [ ] `supabase --version` devuelve una v2.x instalada vía Scoop.
- [ ] Existe `supabase/config.toml` (sin secretos) y `supabase/migrations/` en el repo.
- [ ] `supabase login` quedó autenticado (usuario completó el flujo del navegador).
- [ ] `supabase link --project-ref mcilycrcsfmbepzcxsxa` quedó vinculado.
- [ ] Existen los dos archivos de migración con el SQL idéntico al registrado en `supabase_migrations.schema_migrations`.
- [ ] `supabase migration list` muestra local y remoto en sync.
- [ ] `supabase db push --dry-run` reporta sin migraciones pendientes.
- [ ] Los 3 registros de `daycares` se conservan en remoto (nada destructivo).
- [ ] `AGENTS.md` documenta el flujo obligatorio: `supabase migration new <nombre>` (o `db diff`) para todo cambio de esquema/RLS/políticas, archivo como fuente de verdad.
- [ ] `npm run lint` y `npx tsc --noEmit` siguen pasando.
- [ ] `get_advisors` (security) sin issues nuevos.

## Decisions

- **Tomadas:** CLI vía Scoop (método oficial en Windows, Scoop ya instalado); adopción del historial con archivos de **mismos timestamps** que el remoto (sync automático, no destructivo, fiel a SPEC 07) en lugar de `db pull` (baseline con ruido de grants/extensiones); solo `init` + `link` + archivos + `AGENTS.md`, sin stack local Docker; login interactivo delegado al usuario en el paso 3; migraciones imperativas (`migration new`) como estándar en vez de esquemas declarativos (`schemas/`); MCP `apply_migration` se retira para DDL.
- **Descartadas:** `db pull` como baseline; `supabase start`/`db reset` en esta spec; hooks/CI de enforcement; esquemas declarativos; `supabase migration repair` (innecesario: los timestamps ya coinciden con el historial remoto).

## Risks

| Riesgo                                                                  | Mitigación                                                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `supabase link` pide la DB password interactivamente                    | Proveerla desde `SUPABASE_DB_PASSWORD`; si falla, pedirla al usuario                                            |
| La CLI no reconoce las migraciones por diferencia de formato de versión | La CLI usa la misma tabla `supabase_migrations.schema_migrations`; si desincroniza, `supabase migration repair` |
| Secretos filtrados en `config.toml`                                     | Usar `env()` para valores sensibles y revisar el diff antes de commitear                                        |
| El bucket de Scoop no está agregado                                     | Agregar el bucket antes de `scoop install`                                                                      |

## What is **not** in this spec

- Levantar el stack local (Docker) ni `supabase db reset`.
- Hooks de git / CI que automaticen el enforcement.
- Tipos generados ni cliente `supabase-js`.
- Más tablas ni policies de la referencia.
- Deploys multi-ambiente.

Cada uno de esos, si llega, va en su propia spec.
