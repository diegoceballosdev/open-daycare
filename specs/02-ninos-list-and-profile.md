# SPEC 02 — Niños: lista y perfil

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-04
> **Objective:** Replicar `references/pantallas/ninos.dc.html` (lista de niños) y `references/pantallas/perfil-nino.dc.html` (perfil individual) como rutas `/ninos` y `/ninos/[id]` con datos mock tipados, reutilizando componentes del SPEC 01 y sin autenticación.

## Scope

**In:**

- `src/app/ninos/page.tsx` — lista de niños pixel-idéntica al mock.
- `src/app/ninos/[id]/page.tsx` — perfil individual pixel-idéntico al mock.
- `src/data/children.ts` — datos mock tipados de los 8 niños del mock con padres vinculados.
- `src/components/child-card.tsx` — tarjeta de niño reutilizable en la lista.
- `src/components/child-search.tsx` — barra de búsqueda visual (inerte, sin lógica de filtrado).
- `src/components/child-profile.tsx` — componente del perfil (cabecera, alergias, info, padres).
- Nuevos iconos SVG inline en `src/components/icons.tsx` (alerta, flecha izquierda, check, chevron derecho, usuario con más).
- Nuevos tokens de color en `src/app/globals.css` (rosa, púrpura, verde, amarillo para avatares y badges).
- Nav del sidebar actualizado: "Niños" activo en ambas rutas.
- Responsive mínimo: sidebar se oculta por debajo de `lg` (1024px).

**Out of scope (para specs futuras):**

- Búsqueda funcional (el input es decorativo).
- CRUD de niños (agregar, editar, eliminar).
- Vinculación funcional de padres.
- Resumen del día funcional.
- Foto del niño (avatar con inicial, sin imagen real).
- Persistencia o base de datos.

## Data model

En `src/data/children.ts`:

```ts
export type ParentStatus = "active" | "pending";

export interface Parent {
  name: string;
  initials: string;
  relationship: string; // "Mamá", "Papá"
  avatarBackground: string;
  avatarForeground: string;
  status: ParentStatus;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
  room: string; // "Soles"
  birthDate: string; // "12 mar 2022"
  enrollmentDate: string; // "feb 2025"
  allergiesNote?: string; // texto libre, visible solo si existe
  parents: Parent[];
}

export const children: Child[] = [
  /* 8 niños del mock */
];
```

El badge en la lista se deriva de los datos:

- Si `allergiesNote` existe → texto corto de alergia (ej. "MANÍ", "LACTOSA").
- Si `parents.length === 0` → "VINCULAR".
- Si hay padres vinculados → flecha chevron.

## Implementation plan

Cada paso deja la app funcional:

1. `src/app/globals.css`: agregar tokens de color para rosa (`--color-pink`, `--color-pink-ink`, `--color-pink-soft`), púrpura (`--color-purple`, `--color-purple-ink`, `--color-purple-soft`), verde (`--color-green`, `--color-green-ink`, `--color-green-soft`), amarillo (`--color-yellow`, `--color-yellow-ink`, `--color-yellow-soft`) y warning (`--color-warning`) para la tarjeta de alergias.
2. `src/components/icons.tsx`: agregar `AlertIcon`, `BackIcon` (flecha izquierda), `CheckIcon`, `ChevronIcon`, `LinkParentIcon` (usuario con más), `CalendarIcon`, `RoomIcon`, `SummaryIcon`.
3. `src/data/children.ts`: tipos + array `children` con los 8 niños del mock (Mateo Fernández, Sofía Méndez, Benjamín Ruiz, Valentina Soto, Tomás Díaz, Emma Castro, Lucas Romero, Olivia Vega) con padres y alergias exactas.
4. `src/components/child-card.tsx`: tarjeta con avatar, nombre, "X años · Y padre(s) vinculado(s)", badge o flecha. Estilo hover con `border-color` y `translateY(-2px)` como el mock.
5. `src/components/child-search.tsx`: barra decorativa con ícono de lupa y placeholder "Buscar niño…".
6. `src/components/sidebar.tsx`: actualizar `navItems` para que "Niños" esté activo cuando la ruta contenga `/ninos`.
7. `src/app/ninos/page.tsx`: cabecera "GESTIÓN / Niños" + botón "Agregar niño" + búsqueda + label "SALA SOLES · N niños" + grid 2 columnas de `ChildCard`.
8. `src/components/child-profile.tsx`: cabecera (avatar grande, nombre, edad/sala, botón Editar), tarjeta de alergias (si existe), tarjeta de info (nacimiento, sala, ingreso), botón "Resumen del día", tarjeta de padres vinculados con badges ACTIVA/PENDIENTE y "Vincular otro padre".
9. `src/app/ninos/[id]/page.tsx`: usa `ChildProfile` + enlace "Volver a Niños". El `id` se resuelve desde `params` (async) buscando en `children`.
10. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual contra los mocks.

## Acceptance criteria

- [x] `/ninos` renderiza la lista con los 8 niños del mock, mismos nombres, edades y copy.
- [x] Grid de 2 columnas con tarjetas idénticas al mock (avatar, nombre, subtítulo, badge/flecha).
- [x] Barra de búsqueda decorativa con placeholder "Buscar niño…".
- [x] Cabecera con "GESTIÓN", "Niños" y botón "Agregar niño".
- [x] Label "SALA SOLES" con conteo "8 niños".
- [x] `/ninos/mateo-fernandez` (o id correspondiente) renderiza el perfil de Mateo Fernández idéntico al mock.
- [x] Perfil muestra: nombre, edad/sala, tarjeta de alergias (si existe), info (nacimiento, sala, ingreso), botón "Resumen del día", padres vinculados con badges de estado.
- [x] Enlace "Volver a Niños" funcional (`href="/ninos"`).
- [x] Nav del sidebar tiene "Niños" activo en ambas rutas.
- [x] Todos los botones/enlaces operacionales son inert (`href="#"`), excepto "Volver a Niños".
- [x] Datos mock renderizados desde `src/data/children.ts` tipado (no JSX hardcodeado).
- [x] A <1024px el sidebar se oculta y el contenido ocupa el ancho completo.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisions

- **Tomadas:** datos mock en módulo separado (`children.ts`); reutilizar sidebar, iconos existentes y tokens del SPEC 01; rutas `/ninos` y `/ninos/[id]`; badges de alergia y vinculación derivados de los datos; sin lógica de búsqueda ni CRUD.
- **Descartadas:** lógica de filtrado en búsqueda (decorativo por ahora); foto real del niño (avatar con inicial, igual al mock); rutas placeholder para agregar/editar/vincular (href inert).

## What is **not** in this spec

- Búsqueda funcional de niños.
- Crear, editar o eliminar niños.
- Vincular/desvincular padres funcionalmente.
- Resumen del día funcional.
- Autenticación, base de datos ni persistencia.
- Foto real del niño (solo avatar con inicial).
