# SPEC 06 — Modal de Nueva publicación

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-05
> **Objective:** Replicar `references/pantallas/crear-publicacion.dc.html` como un modal que se abre desde "Nueva publicación" (sidebar) o el Composer del feed (`/`), con destinatarios y tipo seleccionables, textarea editable, fotos decorativas y sin persistencia.

## Scope

**In:**

- Modal (overlay) sobre el feed `/` que se abre desde el botón "Nueva publicación" del sidebar o el Composer "Compartí un momento…".
- Cabecera "Cancelar" (cierra) / "Nueva publicación" (Fredoka) / "Publicar" (accent, cierra). Réplica pixel-por-pixel del mock.
- Sección PARA: chips multi-select de los 3 niños hardcodeados (Mateo, Sofía, Benjamín) con iniciales y colores del mock + chip "Toda la sala" excluyente.
- Sección TIPO: 7 chips (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) single-select sin preselección (toggle).
- DESCRIPCIÓN: textarea controlado, vacío con placeholder "Contá cómo le fue hoy…".
- FOTOS: estática como el mock (1 miniatura decorativa con ícono de imagen + tile punteado "Agregar"), sin acciones.
- Cliente (`"use client"`) con estado local; estado de apertura en `src/app/page.tsx`.
- El feed no cambia de contenido; nada se persiste.

**Out of scope (para specs futuras):**

- Persistencia / creación real de la publicación en el feed.
- Subida de fotos reales ni file picker.
- Validación del formulario ni estados de error.
- Lista de destinatarios dinámica (los 12 niños reales de la sala).
- Ruta propia `/publicar`; detalle de publicación ni pantalla de foto.

## Data model

No introduce estructuras de datos persistentes. Solo estado local del modal:

```ts
type KidChip = {
  id: string;
  firstName: string; // "Mateo", "Sofía", "Benjamín"
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
};
type PostType =
  | "Comida"
  | "Siesta"
  | "Actividad"
  | "Logro"
  | "Ánimo"
  | "Foto"
  | "Anuncio";
// selectedKids: Set<string>  // ids activos, vacío al inicio
// wholeRoom: boolean         // "Toda la sala", false al inicio
// selectedType: PostType | null  // null al inicio
// description: string        // "" al inicio
```

## Implementation plan

Cada paso deja la app funcional:

1. Crear `src/components/new-post-modal.tsx` como componente cliente: overlay `fixed inset-0 z-50 ... bg-black/45` (patrón de SPEC 04/05) con la tarjeta del mock (max-w 580) pixel-idéntica: cabecera, PARA, TIPO, DESCRIPCIÓN y FOTOS, usando tokens existentes e iconos de `icons.tsx` (`ImageIcon`, `PlusIcon`).
2. En el mismo componente: estado local `selectedKids`, `wholeRoom`, `selectedType`, `description`. Lógica PARA: click en niño agrega/quita id y pone `wholeRoom=false`; click en "Toda la sala" la activa y vacía `selectedKids`. Lógica TIPO: toggle single (click en el activo lo deselecciona). Textarea controlado.
3. Cierre: "Cancelar", "Publicar" y click en el backdrop llaman a `onClose` siempre (sin validación).
4. `src/app/page.tsx`: marcar `"use client"`, agregar `useState(open)`, renderizar `<NewPostModal open onClose>`, y pasar `onOpen` a Sidebar y Composer.
5. `src/components/sidebar.tsx`: prop opcional `onNewPost?: () => void`; "Nueva publicación" pasa de `<a href="#">` a `<button>` que la invoca (sin efecto si no se pasa, como en `/ninos`).
6. `src/components/composer.tsx`: pasa a cliente, prop `onOpen`, se vuelve `<button>` que la invoca.
7. Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` y comparación visual del modal contra el mock.

## Acceptance criteria

- [x] Click en "Nueva publicación" del sidebar en `/` abre el modal superpuesto.
- [x] Click en el Composer "Compartí un momento…" en `/` abre el modal.
- [x] El modal replica el mock `crear-publicacion.dc.html` (cabecera, PARA, TIPO, DESCRIPCIÓN, FOTOS).
- [x] Al abrir, ningún chip PARA está seleccionado y "Toda la sala" desactivado.
- [x] Click en un niño lo activa; click de nuevo lo desactiva; varios pueden estar activos a la vez.
- [x] Click en "Toda la sala" la activa y deselecciona todos los niños.
- [x] Click en un niño mientras "Toda la sala" está activa la deselecciona y deja solo ese niño.
- [x] Al abrir, ningún chip TIPO está seleccionado (todos en estilo suave).
- [x] Click en un tipo lo activa (relleno) y desactiva el anterior; click en el activo lo deselecciona.
- [x] El textarea arranca vacío con placeholder "Contá cómo le fue hoy…" y es editable.
- [x] FOTOS es estática: miniatura con ícono de imagen + tile punteado "Agregar", sin acción.
- [x] "Cancelar", "Publicar" y el click fuera de la tarjeta cierran el modal siempre.
- [x] No se crea ni persiste ninguna publicación; el feed no cambia.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisions

- **Tomadas:** modal desde el feed (patrón SPEC 04/05) en lugar de ruta propia o página con sidebar; se abre desde sidebar y Composer; chips de PARA hardcodeados (réplica exacta, desacoplada de `children.ts`); "Toda la sala" excluyente; TIPO single-select sin preselección (el doble relleno del mock —Comida y Actividad— se resuelve como single-select, sin preselección); textarea vacío con placeholder; FOTOS estáticas; sin validación ("Publicar" siempre cierra); se reutilizan tokens y `ImageIcon`/`PlusIcon`.
- **Descartadas:** ruta propia `/publicar`; prellenar el textarea con el texto del mock; miniaturas añadibles en memoria; derivar chips de `children.ts`; validación ni estados de error.

## Risks

| Riesgo                                     | Mitigación                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Modal más alto que el viewport             | Overlay con `overflow-y-auto` y `items-start` (patrón ya usado en SPEC 04/05) |
| El mock muestra 2 tipos con relleno oscuro | Documentado: se adopta single-select sin preselección                         |
| `page.tsx` pasa a "use client"             | Sin impacto: los datos (posts, children) son módulos estáticos importados     |

## What is **not** in this spec

- Persistencia / creación real de la publicación en el feed.
- Subida de fotos ni file picker reales.
- Validación del formulario ni estados de error.
- Destinatarios dinámicos (la lista real de la sala).
- Ruta propia `/publicar`, detalle de publicación ni pantalla de foto.

Cada uno de esos, si llega, va en su propia spec.
