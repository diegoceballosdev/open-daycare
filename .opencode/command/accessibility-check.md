---
description: Audita y corrige la accesibilidad de los archivos indicados con el agente accessibility-checker (WCAG 2.2 AA). Uso: /accessibility-check <archivo|glob>
agent: accessibility-checker
model: opencode-go/deepseek-v4-flash-vision-exp
---

# /accessibility-check

Audita la accesibilidad de: `$ARGUMENTS`

Resuelve los archivos indicados (rutas, carpetas o globs), revísalos con el checklist WCAG 2.2 AA, valida cada regla contra la documentación oficial (Context7), verifica de forma dinámica con Playwright (árbol de accesibilidad, teclado, foco y contraste), aplica las correcciones y verifica con `npm run lint` y `npx tsc --noEmit`. Sigue tu proceso completo.
