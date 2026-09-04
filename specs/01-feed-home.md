# Spec 01 — Home: feed de publicaciones

**State:** Approved
**Date:** 2026-09-04
**Depends on:** ninguno

**Objetivo:** Replicar `references/pantallas/feed.dc.html` como la pantalla Home (`/`) de la app, con el mismo estilo visual, datos mock tipados y sin autenticación ni base de datos.

## Scope — Incluido

- `src/app/page.tsx` como feed (Home) pixel-idéntico al mock.
- Sidebar: logo OpenDayCare / Sala Soles, botón "Nueva publicación", nav (Feed activo, Niños, Avisos, Mi cuenta), bloque de usuario "Caro Giménez · Maestra · Soles" y botón cerrar sesión — todo inert (`href="#"`).
- Cabecera: "GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun".
- Composer "Compartí un momento…" (inert).
- Divider "PUBLICADO HOY" y los 3 posts del mock (logro, actividad con placeholder de foto, anuncio) con textos, badges, contadores (3/1, 5/2, 8/0) y "Editar" exactos.
- Data mock tipada en `src/data/posts.ts` (render desde datos, no JSX hardcodeado por post).
- Fuentes Fredoka + Nunito vía `next/font/google` reemplazando Geist.
- Paleta como tokens en `@theme` de `src/app/globals.css`.
- Iconos SVG inline replicando los del mock.
- Responsive mínimo: sidebar se oculta por debajo de `lg` (1024px), contenido a ancho completo.

## Scope — Excluido (specs futuras)

- Autenticación / login funcional.
- Base de datos ni persistencia.
- Rutas Niños, Avisos, Mi cuenta, Nueva publicación, Detalle de publicación, Foto, Login.
- Crear/editar publicaciones de verdad, ni fotos reales (se mantiene el placeholder del mock).

## Data model

En `src/data/posts.ts`:

- `type PostType = "achievement" | "activity" | "announcement"` (nombres en inglés; la etiqueta visual queda en español vía map)
- `interface Author { name: string; initials: string; avatarBackground: string; avatarForeground: string }`
- `interface Post { id: string; type: PostType; author: Author; time: string; audienceLabel: string; body: string; photo?: { label: string }; likes: number; comments: number }`
- `interface CurrentUser { name: string; initials: string; role: string; classroom: string }`
- `currentUser: CurrentUser` (Caro Giménez, "C", "Maestra · Soles", "Sala Soles") y `posts: Post[]` con los 3 posts del mock.

El tema del badge por tipo (fondo, punto y etiqueta visual LOGRO/ACTIVIDAD/ANUNCIO) vive en un map dentro del componente `post-card`: la clave es el valor inglés (`PostType`) y la etiqueta mostrada es el texto en español. No se guardan textos en español en los datos.

## Implementation plan

Cada paso deja la app funcional:

1. `src/app/globals.css`: tokens de paleta en `@theme`, `body` con fondo `#F6ECDF`, color `#3F362E` y font Nunito; quitar el bloque dark/Geist.
2. `src/app/layout.tsx`: reemplazar Geist por Fredoka + Nunito con `next/font/google`, `lang="es"`, metadata "OpenDayCare".
3. `src/data/posts.ts`: tipos + `currentUser` + 3 posts con el contenido exacto del mock.
4. `src/components/icons.tsx`: SVGs inline (home, users, bell, user, logout, plus, camera, heart, message, megaphone).
5. `src/components/sidebar.tsx`: marca, botón "Nueva publicación", nav, bloque usuario, logout.
6. `src/components/post-card.tsx`: avatar, nombre, "publicado por vos", badge por tipo, audiencia, cuerpo, placeholder de foto, likes/comentarios, "Editar".
7. `src/components/composer.tsx`: tarjeta "Compartí un momento…".
8. `src/app/page.tsx`: compone Sidebar + Main (cabecera, composer, divider "PUBLICADO HOY", posts desde `posts`).
9. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual contra `references/pantallas/feed.dc.html`.

## Acceptance criteria

- [x] `/` se ve idéntico al mock a ≥1200px (colores, fuentes, espaciados y copy).
- [x] Sidebar completo con los 4 items de nav, bloque usuario y logout, todo inert.
- [x] Cabecera con "GUARDERÍA · SALA SOLES", "Buenas, Caro" y "12 niños · martes 17 jun".
- [x] Los 3 posts renderizan copy, badges y contadores exactos del mock (3/1, 5/2, 8/0).
- [x] Los posts se renderizan desde `src/data/posts.ts` tipado.
- [x] Fredoka en títulos y Nunito en cuerpo; sin Geist.
- [x] Paleta definida como tokens en `@theme` y usada por los componentes.
- [x] A <1024px el sidebar se oculta y el contenido ocupa el ancho completo.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] Sin auth, sin BD, sin navegación real (enlaces inertes).

## Decisions

- **Tomadas:** solo Home como alcance; componentes reutilizables; data mock tipada en módulo aparte; enlaces inertes; Fredoka + Nunito; SVG inline; tokens de color en `@theme`; responsive mínimo (ocultar sidebar).
- **Descartadas:** rutas placeholder (sin valor aún); lucide-react (dependencia extra y no idéntico al mock); mantener Geist; página monolítica.

## Risks

- Paridad pixel-exacta con el mock requiere revisión visual (comparar con la plantilla en el navegador).
- El collapse responsive no existe en el mock — mantener desktop-first y el colapso lo más simple posible.
