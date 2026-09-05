<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- Package manager is **npm** (`package-lock.json`).
- `npm run dev` / `npm run build` / `npm run start`
- Lint: `npm run lint` (ESLint CLI, **not** `next lint`)
- Typecheck: `npx tsc --noEmit` (no `typecheck` script)
- No test runner is configured yet

## Layout

- Next.js 16 App Router under `src/app/` (proyecto con carpeta `src/`). Pages Router is unused.
- `src/` agrupa el código de la app al mismo nivel: `app/` (solo routing de páginas), `components/`, `data/`, etc.
- Import alias `@/*` maps to `./src/*`.
- `CLAUDE.md` only contains `@AGENTS.md` — put guidance here.

## Next.js / Tailwind quirks

- Request interception is `src/proxy.ts`, **not** `middleware.ts`. Export `proxy` (or default).
- Type routes with global `PageProps<'/path'>` / `LayoutProps<'/path'>` (no import). `params` and `searchParams` are async.
- Tailwind v4: no `tailwind.config.*`. Tokens live in `src/app/globals.css` (`@import "tailwindcss"` + `@theme inline`). PostCSS plugin is `@tailwindcss/postcss`.
- `next-env.d.ts` is generated and gitignored — do not commit or hand-edit it.

## Product context

- Still the create-next-app starter. Real UI lives in `references/pantallas/` (HTML mocks, Spanish copy) and `references/screenshots/`. Match those, do not invent a parallel design.
- UI copy in mocks is Spanish.

## Workflow

- Large features: `spec` skill first, then `spec-impl` only when status is Approved / Aprobado. Specs go in `specs/NN-slug.md` (folder may not exist yet).
- Playwright MCP screenshots and related artifacts go in `.playwright-mcp/` (gitignored). Do not write them elsewhere.
- Use the Context7 MCP for current Next.js / React / Tailwind docs even when you think you know the API.

## Agents

- SPEC-VERIFIER: agent especializado en verificar especificaciones. Uso: `/spec-verify <NN-slug>` (acepta nombre completo, solo número o solo slug). Verifica cada check con evidencia, corrige el código si falla, valida recomendaciones Next.js con Context7, hace verificación visual con Playwright contra `references/pantallas/` y marca los checkboxes en el propio spec. Definido en `.opencode/agent/spec-verifier.md` y `.opencode/command/spec-verify.md`. No hace `git commit` ni `git push`; responde en el idioma del prompt (español por defecto).

## MCPs

- Playwright Screenshots y cualquier cos relacionada a Playwright tienen que estar en la carpeta .playwritht-mcp
- CONTEXT7: usaremos este MCP para traer documentacion actualizada del framework.
- SUPABASE: MCP oficial de Supabase conectado al proyecto. Ver sección `Supabase`.

## Supabase

- El proyecto usa Supabase como backend. Credenciales en `.env` (ver `.env.template`):
  - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable, para el cliente).
  - `SUPABASE_DB_PASSWORD` (para la CLI). Nunca exponer la `service_role` en el cliente.
- El esquema de referencia de la base de datos está en la referencia `docs` (`../info-database`): tablas, columnas y relaciones. **No está implementado** en la base de datos todavía.
- La CLI de Supabase está instalada (vía Scoop) y el proyecto está linkeado (`supabase link`). `supabase/migrations/` es la **única fuente de verdad** para cambios de esquema.
- Flujo obligatorio para TODO cambio de esquema/RLS/políticas:
  1. Generar la migración local: `supabase migration new <nombre>` (SQL imperativo) o `supabase db diff -f <nombre>` (diff automático).
  2. Revisar/editar el archivo generado en `supabase/migrations/`.
  3. Aplicar con `supabase db push` (verificar primero con `--dry-run`).
  - El archivo de migración es la fuente de verdad y viaja en git. El MCP `apply_migration` queda **fuera del flujo para DDL**.
- Uso del MCP de Supabase (solo consultas read-only y diagnóstico):
  - `list_tables` para revisar el esquema actual antes de cualquier cambio.
  - `execute_sql` para consultas read-only e iterar sin escribir historial de migraciones.
  - `get_advisors` (seguridad/rendimiento) y `query_logs` (logs) para diagnóstico.
  - `search_docs` para documentación actual (verificar contra changelog antes de implementar, Supabase cambia seguido).
- CLI: `supabase migration list` / `supabase db push --dry-run` para verificar sync; `supabase db query` requiere v2.79+ y `supabase db advisors` v2.81.3+; si fallan, usar el MCP como fallback.
- Seguridad: RLS activo en toda tabla expuesta, nunca usar `user_metadata` para autorización, vistas con `security_invoker`.

## SKILLS INSTALADAS

- **supabase** (`.agents/skills/supabase/`): cargar SIEMPRE para cualquier tarea que toque Supabase (Database, Auth, Edge Functions, Realtime, Storage, RLS, migraciones, logs, debugging de errores).
- **supabase-postgres-best-practices** (`.agents/skills/supabase-postgres-best-practices/`): cargar ANTES de escribir o modificar cualquier cosa en Postgres (crear/alterar tablas y columnas, esquemas, migraciones, RLS, índices, triggers) y para diagnosticar queries lentas o problemas de rendimiento.

## SPEC DRIVEN DEVELOPMENT - SKILLS

- /spec usaremos esta skill para crear las especificaciones
- /spec-impl usaremos esta skill para implementar las especificaciones
- /spec-verify usaremos este comando (agente **spec-verifier**) para verificar los criterios de aceptación de una spec.

## Reglas de codigo

- Usar codigo limpio.
- Nombres de variables y funciones en ingles.
- Comentarios en español.
