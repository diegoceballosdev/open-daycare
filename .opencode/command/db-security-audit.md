---
description: Audita y corrige la seguridad de Supabase (RLS, roles, policies y fugas de datos entre niños y padres) usando el agente db-security-auditor. Uso: /db-security-audit <tabla|spec|vacío>
agent: db-security-auditor
---

# /db-security-audit

Audita la seguridad de la base de datos Supabase y de su consumo desde el cliente: `$ARGUMENTS`

Interpreta el argumento como una tabla (`children`), una spec (`12` / `12-vincular-padre-email-activacion`) o vacío (auditoría completa de `public` + `src/`). Revisa RLS, roles, policies, funciones `SECURITY DEFINER`, grants, vistas, storage/realtime y el uso del cliente, con foco en prevenir fugas de datos entre niños y padres y entre daycares. Confirma el comportamiento real con pruebas de fuga read-only vía el MCP, clasifica los hallazgos por severidad, corrige con migraciones nuevas y verifica con `supabase db push --dry-run` y `get_advisors`. Aplica solo tras la confirmación del usuario. Sigue tu proceso completo.
