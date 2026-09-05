# SPEC 03 — Login y activación de cuenta

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-05
> **Objective:** Replicar `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` como rutas `/ingresar` y `/activar`, sin la opción Personal/Familia del login, con datos mock tipados y sin autenticación.

## Scope

**In:**

- `src/app/ingresar/page.tsx` — login sin el selector Personal/Familia, pixel-idéntico al mock.
- `src/app/activar/page.tsx` — activación de cuenta pixel-idéntica al mock.
- `src/data/invitation.ts` — datos mock tipados de la invitación (Mateo, código, email).
- Nuevos tokens en `src/app/globals.css` para estas pantallas (fondo `#FBF4EC`, bordes `#EADFD0`, gradiente salmón, consentimiento).
- Iconos reutilizados de `src/components/icons.tsx` (`SunIcon`).
- Enlaces reales: "Iniciar sesión" → `/`; "Activá tu cuenta" → `/activar`; "Iniciar sesión" (en activar) → `/ingresar`.
- Enlaces inertes (`href="#"`): "¿Olvidaste tu contraseña?" y "Activar mi cuenta".
- Responsive: el panel izquierdo del login se oculta por debajo de `lg` (1024px).

**Out of scope (para specs futuras):**

- Autenticación funcional (validación, sesiones, errores de login).
- Envío real de formularios (los inputs son decorativos).
- Pantalla familia-feed (destino de "Activar mi cuenta", no existe aún).
- Recuperación de contraseña.
- Registro o alta de cuentas.
- Persistencia o base de datos.

## Data model

En `src/data/invitation.ts`:

```ts
export interface Invitation {
  childInitials: string; // "M"
  childName: string; // "Mateo · Sala Soles"
  code: string; // "7K4P9"
  email: string; // "lucia.fernandez@gmail.com"
}

export const invitation: Invitation = {
  childInitials: "M",
  childName: "Mateo · Sala Soles",
  code: "7K4P9",
  email: "lucia.fernandez@gmail.com",
};
```

El login no introduce data model: el email prefilled (`caro@opendaycare.com`) es copy de la página.

## Implementation plan

Cada paso deja la app funcional:

1. `src/app/globals.css`: tokens `--color-auth-bg` (`#fbf4ec`), `--color-field-border` (`#eadfd0`), `--color-peach-light` (`#f6a98e`), `--color-peach` (`#f2937a`), `--color-peach-deep` (`#ec7e62`), `--color-consent-bg` (`#fbf1d6`), `--color-consent-ink` (`#8a7234`), `--color-consent-check` (`#5fb97e`).
2. `src/data/invitation.ts`: interface + objeto `invitation`.
3. `src/app/ingresar/page.tsx`: grid 2 columnas con panel gradiente (logo OpenDayCare, tagline, párrafo, footer "🌿 Guardería Sala Soles", círculos decorativos, `hidden lg:flex`) y columna del formulario (EMAIL prefilled, CONTRASEÑA placeholder, enlaces inertes y botón → `/`).
4. `src/app/activar/page.tsx`: centrado max-w 440 (logo SunIcon, "Bienvenida a OpenDayCare", tarjeta de invitación con datos de `invitation`, inputs código/email/contraseña con valores del mock, consentimiento checkeado, botón inert y enlace → `/ingresar`).
5. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual contra ambos mocks.

## Acceptance criteria

- [x] `/ingresar` se ve idéntico al mock a ≥1200px, sin el selector Personal/Familia.
- [x] Panel izquierdo del login oculto a <1024px (formulario a ancho completo).
- [x] Email prefilled `caro@opendaycare.com` y contraseña con placeholder `••••••••`.
- [x] "Iniciar sesión" enlaza a `/`.
- [x] "¿Olvidaste tu contraseña?" es inerte (`#`).
- [x] "Activá tu cuenta" enlaza a `/activar`.
- [x] `/activar` se ve idéntico al mock: tarjeta "Mateo · Sala Soles", código `7K4P9`, email `lucia.fernandez@gmail.com`, consentimiento checkeado.
- [x] Los datos de la invitación se renderizan desde `src/data/invitation.ts` tipado (no JSX hardcodeado).
- [x] "Activar mi cuenta" es inerte (`#`).
- [x] "Iniciar sesión" (en activar) enlaza a `/ingresar`.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] Sin autenticación, sin envío de formularios, sin BD.

## Decisions

- **Tomadas:** rutas `/ingresar` y `/activar`; quitar el selector Personal/Familia (pedido del usuario); "Iniciar sesión" → `/` (rol staff por defecto, feed ya implementado); "Activar mi cuenta" inerte porque familia-feed es de otra spec; datos de invitación en módulo tipado; panel izquierdo oculto <1024px (mismo patrón que el sidebar); formularios decorativos sin estado ni submit.
- **Descartadas:** mantener el selector de rol; ruta placeholder `/familia`; apilar columnas en mobile; hardcodear la invitación inline en la página.

## Risks

| Riesgo                                                | Mitigación                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| El fondo `#FBF4EC` difiere del cream global `#F6ECDF` | Las páginas setean `--color-auth-bg` localmente sobre el body |
| El mock trae la contraseña prefilled ("contraseña")   | Se replica el valor para paridad visual, documentado aquí     |

## What is **not** in this spec

- Autenticación funcional ni gestión de sesiones.
- Envío real de los formularios de login/activación.
- Pantalla familia-feed.
- Recuperación de contraseña.
- Registro de cuentas.
- Base de datos ni persistencia.
