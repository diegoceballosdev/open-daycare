# SPEC 04 — Modal de Agregar niño

> **Status:** Approved
> **Depends on:** SPEC 02
> **Date:** 2026-09-05
> **Objective:** Replicar `references/pantallas/agregar-nino.dc.html` como un modal que se abre desde el botón "Agregar niño" en `/ninos`, con formulario validado (nombre, fecha, sala) y sin persistencia.

## Scope

**In:**

- Modal (overlay) en `/ninos` que se abre al hacer click en "Agregar niño" y se cierra con "Cancelar" o "Guardar".
- Formulario con los campos del mock: NOMBRE COMPLETO, FECHA DE NACIMIENTO (dd/mm/aaaa), SALA, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS.
- Validación: nombre requerido, fecha `dd/mm/aaaa` real y no futura, sala fija "Soles", alergias y notas opcionales.
- Mensajes de error bajo cada campo inválido (texto rojo) y borde del campo en rojo; "Guardar" bloqueado hasta que el formulario sea válido.
- Comportamiento: "Cancelar" cierra el modal siempre; "Guardar" cierra solo si la validación pasa.
- Cliente (`"use client"`) con estado local del formulario.

**Out of scope (para specs futuras):**

- Persistencia real: guardar añade el niño a una base de datos.
- Añadir el niño creado a la lista `/ninos` (mutar `children`).
- Editar o eliminar niños.
- Vincular padres.
- Ruta dedicada `/ninos/agregar`.
- Llamadas a API o backend.

## Data model

Esta feature no introduce nuevas estructuras de datos persistentes. Usa el tipo `Child` existente en `src/data/children.ts` como referencia de los campos, pero no muta el array `children`.

Los valores del formulario se mantienen en estado local del componente (strings). El campo "SALA" es fijo con el valor `"Soles"`, igual que el mock.

## Implementation plan

Cada paso deja la app funcional:

1. `src/app/ninos/page.tsx`: convertir el botón "Agregar niño" de un `<a href="#">` a un botón que abre el modal (estado `open`), marcando la página como `"use client"`.
2. Crear `src/components/add-child-modal.tsx` como componente cliente: overlay de fondo oscuro (semi-transparente) centrado, con la tarjeta del mock pixel-idéntica (cabecera Cancelar / "Agregar niño" / Guardar y los 5 campos).
3. En el mismo componente, agregar estado local para los campos y la lógica de validación:
   - `name`: requerido (no vacío).
   - `birthDate`: formato `dd/mm/aaaa` con día/mes/año reales y fecha no futura.
   - `room`: fijo "Soles".
   - `allergies` y `notes`: opcionales.
4. Mostrar errores bajo cada campo inválido (texto rojo) y borde del campo en rojo; "Guardar" deshabilitado hasta que el formulario sea válido.
5. Comportamiento de cierre: "Cancelar" cierra el modal siempre; "Guardar" cierra solo si la validación pasa (al hacer submit).
6. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual del modal contra el mock.

## Acceptance criteria

- [ ] Hacer click en "Agregar niño" en `/ninos` abre el modal superpuesto sobre la lista.
- [ ] El modal es pixel-idéntico al mock `agregar-nino.dc.html` (cabecera Cancelar / "Agregar niño" / Guardar, y campos NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA, ALERGIAS, NOTAS MÉDICAS).
- [ ] El campo SALA muestra "Soles" y no es editable.
- [ ] Dejar NOMBRE COMPLETO vacío muestra un error bajo el campo y bloquea "Guardar".
- [ ] FECHA DE NACIMIENTO con formato inválido (no `dd/mm/aaaa`) muestra error.
- [ ] FECHA DE NACIMIENTO con día/mes/año imposibles (ej. `31/02/2022`) muestra error.
- [ ] FECHA DE NACIMIENTO futura muestra error.
- [ ] FECHA DE NACIMIENTO válida (ej. `12/03/2022`) no muestra error.
- [ ] ALERGIAS y NOTAS MÉDICAS son opcionales y no disparan error.
- [ ] "Cancelar" cierra el modal siempre, sin validar.
- [ ] "Guardar" cierra el modal solo cuando el formulario es válido.
- [ ] Con el formulario inválido, "Guardar" está deshabilitado.
- [ ] No se persiste ni se añade el niño a la lista (el array `children` no cambia).
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisions

- **Tomadas:** modal solo en `/ninos` (sin ruta propia); validación únicamente cliente con estado local; sala fija "Soles" (igual al mock); "Guardar" solo cierra si valida; errores bajo el campo + borde rojo; sin persistencia (la BD es de un spec futuro); se reutilizan los tokens de color existentes en `globals.css`.
- **Descartadas:** añadir el niño a la lista en memoria (la mutación de datos se deja a la spec de persistencia); ruta `/ninos/agregar`; validación de alergias/notas; dropdown de sala editable.

## What is **not** in this spec

- Persistencia del niño creado en base de datos.
- Añadir el niño a la lista `/ninos`.
- Editar o eliminar niños.
- Vincular padres.
- Ruta dedicada `/ninos/agregar`.
- Llamadas a API o backend.

Cada uno de esos, si llega, va en su propia spec.
