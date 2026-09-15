---
description: Asegura y aplica las migraciones descritas en specs/database usando el agente db-migrator. Uso: /db-migrate <NN-slug|vacío>
agent: db-migrator
---

# /db-migrate

Asegura que existan y estén aplicadas las migraciones de la spec de base de datos: `$ARGUMENTS`

Localiza la spec en `specs/database/` (nombre completo, solo número o solo slug). Si no hay argumento, lista las specs disponibles en `specs/database/` y confirma con el usuario cuál(es) procesar. Extrae los cambios de esquema, detecta las migraciones faltantes, créalas en `supabase/migrations/`, verifica con `supabase db push --dry-run` y `get_advisors`, y aplica solo tras la confirmación del usuario. Sigue tu proceso completo.
