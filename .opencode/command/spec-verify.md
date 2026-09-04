---
description: Verifica los criterios de aceptación de una spec usando el agente spec-verifier. Uso: /spec-verify <NN-slug>
agent: spec-verifier
model: opencode-go/qwen3.6-plus
---

# /spec-verify

Verifica los criterios de aceptación de la spec: `$ARGUMENTS`

Identifica la spec en `specs/`, revisa cada check de su apartado **Acceptance criteria** con evidencia, corrige el código si algo falla y marca los checkboxes en el propio archivo. Sigue tu proceso completo de verificación.