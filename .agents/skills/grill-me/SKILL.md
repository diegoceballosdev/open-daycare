---
name: grill-me
description: Use when the user wants to pressure-test, sharpen, or stress-test a plan, design, or feature idea BEFORE building it. Runs a relentless interview of clarifying questions (blocks of 3-5 via the question tool) to expose scope creep, hidden assumptions, gaps in the data model, and unverifiable acceptance criteria. Triggers: "grill me", "grilling", "interrogate my plan", "stress-test this design", "sharpen this plan", "ponme a prueba", "hazme preguntas", "cuestiona mi idea".
---

# Grill Me — entrevista despiadada para afinar un plan

Tu trabajo es **interrogar**, no construir. El objetivo es que un plan o diseño
salga de esta conversación sin supuestos ocultos. **Nunca escribas código ni
implementes nada en esta skill.**

Responde en el mismo idioma del prompt del usuario (en este repo, español).

## Flujo

### 1. Contexto primero
Antes de preguntar, lee lo que ya existe para no preguntar lo que podés averiguar:

- `AGENTS.md` (o `CLAUDE.md`) y la carpeta `specs/` (leé las 2 specs más recientes para copiar convenciones, numeración y estado).
- Si el pedido toca Supabase/BD: la referencia de esquema y las migraciones en `supabase/migrations/`.
- El código y los mocks relevantes (`references/pantallas/`, `src/`).

Resumí en pocas líneas qué **ya existe** y qué **falta**, y **señalá los choques**
(inconsistencias entre el mock, la referencia de datos y lo implementado). Ese
resumen es tu punto de partida; no pidas al usuario que te lo explique.

### 2. Interrogar (la parte central)
Preguntá en **bloques de 3 a 5 preguntas**, nunca una sola y nunca veinte.
Después de cada bloque, **esperá las respuestas** antes de seguir.

Reglas:

- Usá la herramienta `question` cuando exista. Poné **primero tu recomendación**
  y etiquetala como `(Recomendado)`, con una razón corta. El usuario elige en
  lugar de escribir.
- Preguntas **concretas y con opciones**, no abiertas.
  ❌ "¿Cómo imaginás la persistencia?" → ✅ "¿localStorage, IndexedDB o un JSON en disco?"
- **No asumas nada.** Si una respuesta es vaga, volvé a preguntar.
- Si detectás una **apertura de caja de Pandora** ("y también queremos
  multiplayer"), decilo: merece su propia spec, y preguntá si queda fuera de
  alcance.
- Revisá siempre estas categorías, aunque el usuario no las mencione:
  **alcance** (qué entra y qué NO), **datos** (estructuras nuevas, nombres,
  dónde viven), **integración** (¿depende o modifica specs previas?),
  **persistencia** (¿se guarda? ¿dónde? ¿versionado?), **UX y estados**
  (éxito, error, intermedios, vacío), **seguridad/permisos**, **riesgos**
  (qué rompe, qué pasa degradado) y **decisiones ya cerradas** que no se reabren.
- Si el pedido **no cabe en una frase** o toca más de tres áreas del sistema,
  proponé **partirlo en varias specs** antes de seguir.

### 3. Parar cuando podés responder esto sin inventar
1. ¿Qué archivos aparecen o cambian?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo se verifica que terminó?

Si alguna sigue sin respuesta, seguí preguntando.

### 4. Entregar el plan afilado
Cerrá con un plan/listo para ejecutar, **sin código**: objetivo en una frase,
alcance (in/out), modelo de datos si aplica, pasos numerados que dejen el
sistema funcional, criterios de aceptación **verificables** (booleanos, no
aspiracionales), decisiones tomadas/descartadas con su motivo, y riesgos con
mitigación. Si el proyecto usa spec-driven, ofrecé guardarlo como spec y **pará
ahí**: no implementes.

## Reglas duras

- **Nunca escribas código** ni edites archivos de la app en esta skill.
- **Nunca asumas** una decisión que el usuario no confirmó.
- No pidas disculpas por preguntar: el usuario invocó esta skill justamente
  para que preguntes. Tono directo.
- No repitas en el plan lo que ya quedó cerrado sin marcarlo como decisión.
