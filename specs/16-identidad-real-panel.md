# SPEC 16 — Identidad real del usuario logueado en el panel

> **Status:** Aprobado
> **Depends on:** SPEC 02, SPEC 11, SPEC 14, SPEC 15
> **Date:** 2026-09-15
> **Objective:** Reemplazar la identidad mock (`src/data/current-user.ts`) por los datos reales del usuario que inició sesión en el sidebar y la cabecera del feed, incluyendo avatar, rol, sala y el conteo real de niños.

## Scope

**In:**

- Helper server `getCurrentUser()` en `src/lib/current-user.ts`: lee el perfil con `getClaims()` + `users_select_self`, y resuelve el nombre de la sala (`rooms`) y del daycare (`daycares`).
- Helper de etiqueta de rol `roleLabel()`: `staff` → `Maestra · {sala}`, `admin` → `Administrador/a`, `parent` → `Familia`; si no hay sala, se muestra el nombre del daycare.
- `src/components/sidebar.tsx`: recibe la identidad por prop (nombre, rol, sala, avatar). Avatar = `avatar_url` si existe, o iniciales derivadas de `full_name` sobre el color de marca. Se eliminan los 4 usos de `currentUser` mock.
- `src/components/composer.tsx`: recibe las iniciales reales por prop.
- `src/components/feed-client.tsx`: cabecera real `GUARDERÍA · {sala}` + `Buenas, {nombre}`; subtítulo con **conteo real de niños del daycare** y **fecha actual** (usando `src/lib/date-format.ts`).
- `src/app/page.tsx`: usa `getCurrentUser()`, cuenta niños y calcula la fecha; pasa la identidad a `feed-client.tsx`.
- Páginas que renderizan el Sidebar (`src/app/ninos/page.tsx` vía `ninos-page-client.tsx` y `src/app/ninos/[id]/page.tsx`): `getCurrentUser()` + prop al Sidebar.
- Eliminar `src/data/current-user.ts`.

**Out of scope (para specs futuras):**

- Subir, cambiar o eliminar el avatar (`users.avatar_url` solo se lee).
- Editar el perfil y la pantalla `/mi-cuenta` (sigue siendo inerte).
- Preferencias de usuario (`notify_on_post`, `daily_summary_enabled`).
- Internacionalización o selector de idioma.
- Cambios de esquema, policies o migraciones: esta spec **no toca la base de datos**.

## Data model

No introduce tablas ni columnas; **no hay migraciones**. Solo se agregan estructuras TypeScript de lectura:

```ts
// src/lib/current-user.ts
export interface CurrentUserView {
  id: string;
  fullName: string;
  initials: string;
  role: "staff" | "parent" | "admin";
  roleLabel: string; // "Maestra · Soles" | "Administrador/a" | "Familia"
  roomName: string | null;
  daycareName: string;
  avatarUrl: string | null;
}
```

Fuente de datos: `public.users` (`full_name`, `role`, `room_id`, `daycare_id`, `avatar_url`) con `users_select_self`; `rooms` con `rooms_authenticated_select`; `daycares` con `daycares_authenticated_select`. El conteo de niños se resuelve por `children` filtrado por las salas del daycare (porque `children` no tiene `daycare_id` y su policy actual es `using (true)`).

## Implementation plan

Cada paso deja el sistema funcional.

1. `src/lib/current-user.ts`: `getCurrentUser()` (server-only) que devuelve `CurrentUserView | null`; deriva `initials` de `full_name`; resuelve `roomName`/`daycareName`; calcula `roleLabel`.
2. `src/lib/role-labels.ts` (o dentro de `current-user.ts`): `roleLabel(role, roomName, daycareName)`.
3. `src/components/sidebar.tsx`: nuevo prop `currentUser: CurrentUserView` (reemplaza el import mock); avatar con `avatarUrl` o iniciales; nombre, `roleLabel` y sala; ajustar `DesktopSidebarContent` y `MobileSidebarContent`.
4. `src/components/composer.tsx`: prop `initials` (o `currentUser`) en lugar del mock.
5. `src/components/feed-client.tsx`: nuevo prop `currentUser` + `childCount`; cabecera `GUARDERÍA · {roomName ?? daycareName}` y `Buenas, {firstName}`; subtítulo `{childCount} niños · {fecha}`.
6. `src/lib/date-format.ts`: agregar `formatLongDate()` (p. ej. "martes 15 sep") o reutilizar `formatDayLabel` si aplica; usar `APP_TIME_ZONE` para evitar desajustes de hidratación.
7. `src/app/page.tsx`: `getCurrentUser()`; si es `null`, redirigir a `/ingresar`; contar niños del daycare (`children` `count: 'exact'` con join a `rooms` del daycare); pasar identidad y `childCount` a `feed-client.tsx`.
8. `src/components/ninos-page-client.tsx` y `src/app/ninos/[id]/page.tsx`: `getCurrentUser()` en el server y prop `currentUser` al Sidebar.
9. Eliminar `src/data/current-user.ts`.
10. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`; verificación visual con Playwright contra `references/pantallas/feed.dc.html` y `references/screenshots/` logueando como `staff`, `admin` y `parent`.

## Acceptance criteria

- [ ] El sidebar muestra nombre, rol y sala reales del usuario logueado (nunca "Caro Giménez" ni "Sala Soles" hardcodeados).
- [ ] La cabecera del feed muestra `Buenas, {nombre real}` y `GUARDERÍA · {sala real}`.
- [ ] El subtítulo muestra el conteo real de niños del daycare y la fecha actual.
- [ ] El avatar usa `avatar_url` si existe; si no, las iniciales del `full_name`.
- [ ] Un `staff` con sala muestra `Maestra · {sala}`; un `admin` muestra `Administrador/a`; un `parent` (sin sala) muestra `Familia` y el nombre del daycare.
- [ ] La identidad real se ve en `/`, `/ninos` y `/ninos/[id]`.
- [ ] El conteo de niños corresponde al daycare del usuario (no al total de la base).
- [ ] `src/data/current-user.ts` ya no existe y ningún archivo lo importa.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [ ] No se modificó ningún esquema, policy ni migración.

## Decisions

- **Tomadas:** helper server `getCurrentUser()` + prop desde cada page (cambios acotados a las 3 páginas que renderizan el Sidebar, sin refactor de layout); etiqueta de rol por rol + sala real con fallback al nombre del daycare; avatar con fallback a iniciales; se incluye el conteo real de niños y la fecha en el subtítulo del feed; **sin cambios de BD** porque las policies existentes ya permiten leer el propio perfil, salas, daycare y niños.
- **Descartadas:** route group `(app)` con layout que comparte la identidad (refactor mayor); seguir usando props sueltos sin helper (duplicación); mostrar el rol crudo (`staff`/`admin`/`parent`) en inglés; subir/editar avatar o editar perfil (otra spec).

## Risks

| Riesgo                                                                    | Mitigación                                                                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `children_authenticated_select` es `using (true)` (no filtra por daycare) | El conteo filtra por las salas del daycare del usuario; documentado aquí, no se cambia la policy en esta spec               |
| Desajuste de fecha entre servidor y cliente (hidratación)                 | Calcular la fecha en servidor con `APP_TIME_ZONE` y pasarla como prop; no usar `new Date()` en el cliente para el subtítulo |
| Un `parent` sin `room_id` no tiene sala                                   | Fallback a `Familia` + nombre del daycare                                                                                   |
| `getCurrentUser()` devuelve `null` por sesión vencida                     | Redirigir a `/ingresar` desde la page antes de renderizar                                                                   |
| Duplicar el fetch del perfil en varias pages                              | Centralizar todo en `getCurrentUser()`; cada page hace una sola llamada                                                     |
| El seed visual espera "12 niños" y el conteo real difiere                 | Es el objetivo de la spec: mostrar el dato real; la paridad visual con el mock se acepta con esa diferencia                 |

## What is **not** in this spec

- Subir, cambiar o eliminar el avatar; editar perfil; `/mi-cuenta`.
- Preferencias de usuario y notificaciones.
- Internacionalización.
- Cualquier cambio de base de datos.

Cada uno de esos, si llega, va en su propia spec.
