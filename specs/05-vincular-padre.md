# SPEC 05 — Modal de Vincular padre

> **Status:** Implemented
> **Depends on:** SPEC 02, SPEC 04  
> **Date:** 2026-09-05
> **Objective:** Replicar `references/pantallas/vincular-padre.dc.html` como un modal que se abre desde "Vincular otro padre" en el perfil del niño (`/ninos/[id]`), con parentesco seleccionable y sin persistencia.

## Scope

**In:**

- Modal (overlay) en el perfil del niño que se abre al hacer click en "Vincular otro padre" y se cierra con la X o "Enviar invitación".
- Cabecera con "Vincular padre" y el nombre del niño ("a Mateo Fernández") renderizado desde `child.name`.
- Info box azul con el mensaje del correo de activación.
- Campos: NOMBRE DEL PADRE/MADRE (texto) y EMAIL (email), decorativos con estado local.
- PARENTESCO: pills Mamá / Papá / Tutor/a, seleccionables (uno activo; Mamá por defecto, como el mock).
- Caja de CÓDIGO DE INVITACIÓN con el código `7K4P9`, estilo dashed amarillo y "Vence en 7 días".
- Botón "Enviar invitación" (gradiente salmón con ícono de avión) que cierra el modal, sin validación.
- Cliente (`"use client"`) con estado local.

**Out of scope (para specs futuras):**

- Persistencia real ni base de datos (el correo, el código y la vinculación real).
- Envío real del correo con el código de activación.
- Validación del formulario (nombre/email) ni estados de error.
- Modificar el array `parents` del niño ni la lista de padres vinculados.
- Flujo de activación de cuenta del padre (ya cubierto en SPEC 03).

## Data model

Esta feature no introduce nuevas estructuras de datos persistentes. Usa el `child` recibido como prop del perfil para el nombre en la cabecera.

Los valores del formulario y el parentesco seleccionado se mantienen en estado local del componente:

```ts
// Estado local del modal
type Relationship = "Mamá" | "Papá" | "Tutor/a";
// name: string
// email: string
// relationship: Relationship  // "Mamá" por defecto
```

El código de invitación `7K4P9` y el texto "Vence en 7 días" están hardcodeados (solo visual, sin BD).

## Implementation plan

Cada paso deja la app funcional:

1. Crear `src/components/link-parent-modal.tsx` como componente cliente: overlay de fondo oscuro semi-transparente centrado, con la tarjeta del mock pixel-idéntica (cabecera "Vincular padre" / "a {child.name}" + X de cierre, info box azul, campos NOMBRE y EMAIL, pills de parentesco, caja del código y botón "Enviar invitación").
2. En el mismo componente, agregar estado local para `name`, `email` y `relationship` (default `"Mamá"`), con selección de pills que activa uno y desactiva los demás.
3. Comportamiento de cierre: la X cierra el modal siempre; "Enviar invitación" cierra el modal siempre (sin validación).
4. Convertir "Vincular otro padre" en `src/components/child-profile.tsx` de un `<a href="#">` a un botón que abre el modal. Como el perfil es servidor, envolver el modal y su estado en un componente cliente (`src/components/child-profile.tsx` se marca `"use client"` o se extrae un wrapper cliente) que recibe `child` y controla `open`/`onClose`.
5. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual del modal contra el mock.

## Acceptance criteria

- [x] Hacer click en "Vincular otro padre" en el perfil de un niño abre el modal superpuesto.
- [x] El modal es pixel-idéntico al mock `vincular-padre.dc.html`.
- [x] La cabecera muestra "Vincular padre" y "a {nombre del niño}" (ej. "a Mateo Fernández") tomado de `child.name`.
- [x] La X cierra el modal siempre.
- [x] "Enviar invitación" cierra el modal siempre, sin validar.
- [x] El campo NOMBRE DEL PADRE/MADRE es un input de texto con placeholder "Ej. Diego Fernández".
- [x] El campo EMAIL es un input de email con placeholder "correo@ejemplo.com".
- [x] Los pills Mamá / Papá / Tutor/a son seleccionables: click en uno lo activa y desactiva los otros.
- [x] Mamá viene seleccionado por defecto al abrir el modal (como el mock).
- [x] La caja de CÓDIGO DE INVITACIÓN muestra el código `7K4P9` y "Vence en 7 días".
- [x] No se persiste ni se modifica el array `parents` (la lista de padres vinculados no cambia).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisions

- **Tomadas:** modal solo en el perfil del niño (sin ruta propia); se abre desde "Vincular otro padre"; parentesco seleccionable (uno activo, Mamá por defecto); sin validación del formulario (campos decorativos, "Enviar invitación" siempre cierra); código `7K4P9` hardcodeado en el modal; se reutilizan tokens de color existentes en `globals.css` (auth-bg, field-border, announcement, consent, peach, line) y los iconos de `icons.tsx`.
- **Descartadas:** validación de nombre/email con errores (el mock no muestra estados de error, a diferencia de SPEC 04); reutilizar `src/data/invitation.ts` para el código (se hardcodea por simplicidad visual); modificar la lista de padres vinculados.

## Risks

| Riesgo                                                         | Mitigación                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| El perfil es un componente servidor y el modal necesita estado | El estado y la apertura del modal viven en un componente cliente que recibe `child`                 |
| Colores azul/amarillo del modal difieren del theme             | Se reutilizan `--color-announcement-soft`, `--color-consent-bg`, `--color-consent-ink` ya definidos |

## What is **not** in this spec

- Persistencia del padre vinculado en base de datos.
- Envío real del correo con el código de activación.
- Validación del formulario ni estados de error.
- Modificar la lista de padres vinculados del niño.
- Flujo de activación de la cuenta del padre.

Cada uno de esos, si llega, va en su propia spec.
