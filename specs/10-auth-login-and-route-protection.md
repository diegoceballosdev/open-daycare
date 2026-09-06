# SPEC 10 — Login real con Supabase y protección de rutas

> **Status:** Implementado
> **Depends on:** SPEC 03, SPEC 09
> **Date:** 2026-09-05
> **Objective:** Conectar el login de `/ingresar` a Supabase (email+password) y proteger las rutas de la app, redirigiendo según haya o no sesión.

## Scope

**In:**

- `src/app/auth/actions.ts` — server actions `login` (`signInWithPassword`) y `logout` (`signOut`).
- `src/app/ingresar/login-form.tsx` — formulario cliente con `useActionState`, error inline y estado de envío.
- `src/app/ingresar/page.tsx` — formulario real (inputs con `name`, botón `submit`), prefill `staff@opendaycare.com`.
- `src/utils/supabase/proxy.ts` — protección de rutas con `getClaims()`: sin sesión → `/ingresar`; con sesión en `/ingresar` o `/activar` → `/`.
- `src/components/sidebar.tsx` — logout funcional (bloques desktop y mobile).

**Out of scope (para specs futuras):**

- Activación/registro real (`/activar` sigue inerte y pública).
- Recuperación de contraseña.
- RLS policies ni lectura de `public.users` (los datos mock se mantienen).
- Feed de familia ni redirect por role.
- Tipos generados de Supabase.

## Data model

Esta feature no introduce estructuras de datos nuevas. Reutiliza `createClient()` de `src/utils/supabase/server.ts` y el usuario seed `staff@opendaycare.com` de SPEC 09.

## Implementation plan

Cada paso deja la app funcional:

1. `src/app/auth/actions.ts`: `login(prevState, formData)` → `signInWithPassword`; si hay error, retorna `{ error: "Email o contraseña incorrectos." }`; si no, `revalidatePath('/', 'layout')` + `redirect('/')`. `logout()` → `getClaims()` para verificar, `signOut()`, `revalidatePath` + `redirect('/ingresar')`.
2. `src/app/ingresar/login-form.tsx` + editar `page.tsx`: sustituir el Link por `<form action={formAction}>`, prefill `staff@opendaycare.com`, error inline bajo el formulario, botón con estado "Ingresando…". Verificación: login con staff → `/`.
3. `src/utils/supabase/proxy.ts`: tras `getClaims()`, si ruta protegida y sin claims → redirect `/ingresar`; si ruta pública (`/ingresar` o `/activar`) y con claims → redirect `/`; copiar cookies de `supabaseResponse` a la respuesta de redirect. Verificación: sin sesión `/` → `/ingresar`.
4. `src/components/sidebar.tsx`: reemplazar el `<a href="#">` de logout por `<form action={logout}>` con botón (desktop y mobile). Verificación: logout → `/ingresar`.
5. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`, flujo manual completo y comparación visual contra `references/pantallas/login.dc.html`.

## Acceptance criteria

- [x] Sin sesión, visitar `/`, `/ninos` o `/ninos/[id]` redirige a `/ingresar`.
- [x] Con sesión, visitar `/ingresar` o `/activar` redirige a `/`.
- [x] Login con `staff@opendaycare.com` / `Staff123!` inicia sesión y aterriza en `/`.
- [x] Credenciales inválidas muestran "Email o contraseña incorrectos." sin cambiar de página.
- [x] El botón muestra estado de envío mientras el login corre.
- [x] `/ingresar` mantiene la paridad visual con `login.dc.html` (salvo prefill staff y botón de submit real).
- [x] Cerrar sesión (desktop y mobile) redirige a `/ingresar`.
- [x] Tras logout, `/` vuelve a redirigir a `/ingresar`.
- [x] `/activar` permanece pública e inerte, sin cambios.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisions

- **Tomadas:** login por Server Action con `signInWithPassword` (no necesita route handler PKCE, solo aplica a OAuth/magic link/signup); protección de rutas en el proxy con `getClaims()` (patrón AGENTS.md y docs de Supabase); públicas `/ingresar` y `/activar`; usuarios logueados fuera de las públicas; post-login siempre a `/`; logout por Server Action desde el sidebar; prefill `staff@opendaycare.com` (usuario seed real); error inline en español.
- **Descartadas:** route handlers de intercambio de código PKCE (no aplica a password); guard en cada Server Component (las páginas son client components, el proxy cubre); mostrar el usuario real (requiere RLS → otra spec); redirect por role (feed familia no existe); `getSession()` para autorización (prohibido por AGENTS.md).

## Risks

| Riesgo                                                                      | Mitigación                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Al redirigir en el proxy se pierden cookies de sesión refrescadas           | Copiar cookies de `supabaseResponse` a la respuesta de `NextResponse.redirect`                    |
| `getClaims()` no detecta logout server-side                                 | El redirect es optimista; para datos sensibles se usaría `getUser()` (fuera de scope, datos mock) |
| El prefill `staff@opendaycare.com` depende de que exista el seed de SPEC 09 | Documentado; si se borra, se re-siembra                                                           |

## What is **not** in this spec

- Activación/registro real de cuentas.
- Recuperación de contraseña.
- RLS policies ni consumo de `public.users`.
- Feed de familia ni redirect por role.
- Tipos generados de Supabase.

Cada uno de esos, si llega, va en su propia spec.
