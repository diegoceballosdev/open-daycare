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

- Next.js 16 App Router at repo-root `app/` (no `src/`). Pages Router is unused.
- Import alias `@/*` maps to the repo root (`./*`), not `src/`.
- `CLAUDE.md` only contains `@AGENTS.md` — put guidance here.

## Next.js / Tailwind quirks

- Request interception is `proxy.ts` at the project root, **not** `middleware.ts`. Export `proxy` (or default).
- Type routes with global `PageProps<'/path'>` / `LayoutProps<'/path'>` (no import). `params` and `searchParams` are async.
- Tailwind v4: no `tailwind.config.*`. Tokens live in `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). PostCSS plugin is `@tailwindcss/postcss`.
- `next-env.d.ts` is generated and gitignored — do not commit or hand-edit it.

## Product context

- Still the create-next-app starter. Real UI lives in `references/pantallas/` (HTML mocks, Spanish copy) and `references/screenshots/`. Match those, do not invent a parallel design.
- UI copy in mocks is Spanish.

## Workflow

- Large features: `spec` skill first, then `spec-impl` only when status is Approved / Aprobado. Specs go in `specs/NN-slug.md` (folder may not exist yet).
- Playwright MCP screenshots and related artifacts go in `.playwright-mcp/` (gitignored). Do not write them elsewhere.
- Use the Context7 MCP for current Next.js / React / Tailwind docs even when you think you know the API.

## MCPs

- Playwright Screenshots y cualquier cos relacionada a Playwright tienen que estar en la carpeta .playwritht-mcp
- CONTEXT7: usaremos este MCP para traer documentacion actualizada del framework.

## SPEC DRIVEN DEVELOPMENT - SKILLS

- /spec usaremos esta skill para crear las especificaciones
- /spec-impl usaremos esta skill para implementar las especificaciones

## Reglas de codigo

- Usar codigo limpio.
- Nombres de variables y funciones en ingles.
- Comentarios en español.
