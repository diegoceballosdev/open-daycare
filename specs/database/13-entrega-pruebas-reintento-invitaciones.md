# SPEC 13 — Entrega de invitaciones al correo de pruebas y reintentos sin duplicados

> **Status:** Implementado
> **Depends on:** SPEC 12
> **Date:** 2026-09-14
> **Objective:** Corregir el envío de invitaciones para entregar siempre el correo al propietario de Resend, generar enlaces válidos en local y Vercel y reutilizar invitaciones pendientes al reintentar. Además, dejar funcionando de punta a punta el registro por invitación: enlace con código y email, validación server-side, campos bloqueados y activación sin confirmación de email de Supabase.

## Why this spec exists

Resend solo permite enviar desde `onboarding@resend.dev` al correo propietario de la cuenta mientras no exista un dominio verificado. La invitación debe seguir perteneciendo al email ingresado para el padre, aunque el mensaje se entregue físicamente a un único correo de pruebas durante todo el curso.

El flujo actual también inserta una nueva invitación antes de cada intento de envío. Si Resend rechaza el mensaje y el usuario reintenta, se acumulan invitaciones pendientes con códigos diferentes.

## Scope

**In:**

- Agregar `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` a la configuración documentada en `.env.template`.
- Usar siempre `CONTACT_TO_EMAIL` como destinatario físico de los correos de invitación, tanto en desarrollo local como en Vercel.
- Mantener el email ingresado en el modal como `public.invitations.email` y como credencial requerida durante la activación.
- Usar `CONTACT_FROM_EMAIL` como dirección del remitente con el nombre visible `OpenDayCare`.
- Construir el enlace `/activar?code=<código>&email=<email>` desde `APP_URL` para que funcione en local y en el deployment de Vercel.
- Validar `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` antes de insertar o actualizar una invitación.
- Reutilizar la invitación propia más reciente para el mismo niño y email cuando siga `pending` y no haya vencido.
- Actualizar `full_name` y `relationship` con los valores actuales del formulario al reutilizar una invitación.
- Conservar el código y `expires_at` originales al reintentar.
- Agregar acceso mínimo de lectura y actualización sobre invitaciones propias para soportar el reintento.
- Mostrar en la confirmación el email previsto del padre y el correo de pruebas que recibió físicamente el mensaje.
- Indicar en el correo para qué email de padre se creó la invitación.
- Registrar de forma segura los errores devueltos por Resend.
- Validar la invitación en el servidor al renderizar `/activar`, normalizando código (mayúsculas) y email (minúsculas).
- Precargar código y email en `/activar` como campos de solo lectura y mostrar estados explícitos de error (sin parámetros, formato de código, invitación inexistente/vencida/usada).
- Endurecer `activate_invitation` para verificar que el usuario creado corresponde al email invitado y permitir su ejecución tanto como `anon` como `authenticated`.
- Desactivar la confirmación de email de Supabase Auth (`mailer_autoconfirm = true`) para que el alta de cuenta no dependa del SMTP por defecto, que solo puede entregar al propietario de Resend.
- Verificar el flujo completo en local y en Vercel.

**Out of scope (para specs futuras):**

- Comprar, configurar o verificar un dominio personalizado.
- Enviar físicamente la invitación al email ingresado para el padre.
- Configurar un buzón de correo personalizado.
- Agregar `CONTACT_REPLY_TO_EMAIL` o comportamiento de respuesta.
- Reenviar invitaciones vencidas, aceptadas o canceladas.
- Cancelar invitaciones desde la interfaz.
- Eliminar o normalizar las invitaciones duplicadas creadas antes de esta spec.
- Webhooks de Resend para estados `delivered`, `bounced` o `complained`.
- Garantizar que las URLs de deployments Preview de Vercel se seleccionen automáticamente.

## Data model

Esta feature no agrega columnas ni tablas. Reutiliza `public.invitations` de SPEC 12 y agrega policies, privilegios de columna e índice mediante una migración `allow_invitation_retries`, y una segunda migración `secure_invitation_activation` que endurece `activate_invitation` y ajusta sus permisos.

**Policy de lectura:**

```sql
create policy "invitations_own_select"
  on public.invitations for select to authenticated
  using ((select auth.uid()) = invited_by);
```

**Policy de actualización:**

```sql
create policy "invitations_own_pending_update"
  on public.invitations for update to authenticated
  using (
    (select auth.uid()) = invited_by
    and status = 'pending'
    and expires_at > now()
  )
  with check (
    (select auth.uid()) = invited_by
    and status = 'pending'
    and expires_at > now()
  );
```

El rol `authenticated` no tendrá permiso general de actualización sobre `public.invitations`. Solo podrá modificar las columnas requeridas por el reintento:

```sql
revoke update on public.invitations from authenticated;
grant update (full_name, relationship) on public.invitations to authenticated;
```

La búsqueda de reintentos tendrá un índice parcial que coincida con su filtro estable:

```sql
create index invitations_pending_retry_idx
  on public.invitations (invited_by, child_id, lower(email), created_at desc)
  where status = 'pending';
```

La vigencia se evalúa en la consulta mediante `expires_at > now()` y no forma parte del predicado del índice.

**Configuración de runtime:**

```env
RESEND_API_KEY=re_xxxxxxxxxx
CONTACT_TO_EMAIL=diegoceballosdev@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
APP_URL=http://localhost:3000
```

En Vercel, `APP_URL` tendrá la URL estable asignada al proyecto, por ejemplo `https://open-daycare.vercel.app`. Las cuatro variables serán server-only y no usarán el prefijo `NEXT_PUBLIC_`.

**Endurecimiento de `activate_invitation` (migración `secure_invitation_activation`):**

La función RPC de activación se reemplaza con las siguientes garantías:

- Normaliza el código con `upper(trim(p_code))` y el email con `lower(trim(p_email))`.
- Bloquea la fila de la invitación con `for update` para serializar la activación.
- Verifica que `auth.users` contenga un usuario con `id = p_new_user_id` **y** cuyo email coincida con el email de la invitación; si no, rechaza ("La cuenta no corresponde al email invitado").
- Si hay una sesión activa (`auth.uid()` no nulo), exige que corresponda al usuario creado.
- Usa `set search_path = ''` y referencias calificadas (`public.*`, `auth.users`).

Permisos:

```sql
revoke execute on function public.activate_invitation(text, text, uuid) from public;
grant execute on function public.activate_invitation(text, text, uuid) to anon, authenticated;
```

Se otorga a `authenticated` porque, con la confirmación de email desactivada, `signUp` puede crear una sesión antes de llamar a la RPC.

**Configuración de Supabase Auth:**

Se desactiva la confirmación de email a nivel de proyecto (`mailer_autoconfirm = true`) vía el Management API. El SMTP por defecto de Supabase (`onboarding@resend.dev`) solo puede enviar a los miembros de la organización, por lo que un `signUp` con cualquier otro email fallaba con `400 email_address_invalid`. Con la confirmación desactivada, el alta se crea confirmada y sin depender del envío del correo de Auth.

El estado exitoso de `sendInvitation` expondrá ambos destinos necesarios para la confirmación:

```ts
type SendInvitationState = {
  error?: string;
  success?: boolean;
  code?: string;
  email?: string;
  deliveryEmail?: string;
};
```

`email` representa al padre invitado y `deliveryEmail` representa el buzón de pruebas configurado en `CONTACT_TO_EMAIL`.

## Implementation plan

Cada paso deja la app funcional:

1. Crear con `supabase migration new allow_invitation_retries` una migración que agregue `invitations_own_select`, `invitations_own_pending_update`, los privilegios limitados de columna y `invitations_pending_retry_idx`; revisar el SQL y ejecutar `supabase db push --dry-run` antes de `supabase db push`.
2. Regenerar `src/lib/database.types.ts` con `supabase gen types typescript --linked` y verificar que `npx tsc --noEmit` continúe pasando.
3. Documentar en `.env.template` `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL`, sin incluir credenciales reales ni eliminar `RESEND_API_KEY`.
4. Actualizar `sendInvitation` en `src/app/ninos/[id]/actions.ts` para validar las cuatro variables antes de cualquier escritura y devolver un error de configuración específico si falta una.
5. Antes de generar un código, buscar la invitación propia más reciente que coincida con `child_id`, email normalizado, `status = pending` y `expires_at > now()`; si existe, actualizar solamente `full_name` y `relationship`, y reutilizar su `id`, código y vencimiento.
6. Mantener el alta actual cuando no exista una invitación reutilizable; recuperar el `id` insertado bajo la nueva policy de lectura y conservar la generación de código único.
7. Enviar con Resend usando `OpenDayCare <${CONTACT_FROM_EMAIL}>`, `CONTACT_TO_EMAIL` como `to`, y `APP_URL` como origen de la URL de activación; mantener el email ingresado únicamente como identidad de la invitación.
8. Registrar los fallos de Resend con `name`, `message` y código HTTP disponible; no registrar API keys, cuerpos completos, contenido del correo ni direcciones adicionales que no sean necesarias para diagnosticar.
9. Ampliar `src/emails/invitation-email.tsx` con `intendedEmail` y mostrar una aclaración de que el código corresponde a ese email; el botón seguirá apuntando a `${APP_URL}/activar?code=${code}`.
10. Ampliar `SendInvitationState` y `src/components/link-parent-modal.tsx` para que el éxito muestre el email previsto, el destino físico de pruebas y el mismo código reutilizado cuando corresponda.
11. Configurar `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` en los entornos Development, Preview y Production de Vercel; usar la URL estable `*.vercel.app` como `APP_URL` fuera de local.
12. Ejecutar la verificación automática y manual definida en los criterios de aceptación, incluyendo un fallo controlado de Resend seguido de un reintento exitoso.
13. Ampliar el enlace del correo en `src/emails/invitation-email.tsx` para incluir `code` y `email` codificados vía `URL.searchParams`, y validar la invitación en el servidor dentro de `src/app/activar/page.tsx` (normalizando código a mayúsculas y email a minúsculas).
14. Precargar código y email como campos `readOnly` en `src/app/activar/activate-form.tsx`, mostrar estados explícitos de error y mostrar el formulario de contraseña solo cuando la invitación es válida. Mantener la validación completa en `src/app/activar/actions.ts` (formato de código, email y diferenciación de error de RPC), ejecutada antes que la validación de contraseñas.
15. Crear con `supabase migration new secure_invitation_activation` la migración que endurece `activate_invitation` y ajusta sus permisos a `anon` y `authenticated`; revisar el SQL y ejecutar `supabase db push --dry-run` antes de `supabase db push`. Desactivar la confirmación de email de Supabase Auth (`mailer_autoconfirm = true`) y verificar el flujo de activación completo en local.

## Acceptance criteria

- [x] `.env.template` documenta `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` sin valores secretos reales.
- [x] Si falta cualquiera de las cuatro variables requeridas, el modal muestra un error de configuración y no se inserta ni actualiza una invitación.
- [x] `CONTACT_TO_EMAIL` es siempre el destinatario enviado a Resend, sin depender de `NODE_ENV`.
- [x] `CONTACT_FROM_EMAIL` se usa como dirección del remitente bajo el nombre visible `OpenDayCare`.
- [x] El email ingresado en el modal se guarda en `public.invitations.email` y no se reemplaza por `CONTACT_TO_EMAIL`.
- [x] El enlace del correo usa `APP_URL` y no contiene `http://localhost:3000` cuando la variable apunta a Vercel.
- [x] La plantilla identifica explícitamente el email del padre al que pertenece el código.
- [x] La primera solicitud válida sin invitación reutilizable crea una fila `pending` con código único y vencimiento de siete días.
- [x] Un nuevo intento del mismo usuario para el mismo niño y email reutiliza la invitación pendiente y vigente más reciente.
- [x] El reintento conserva exactamente el mismo `id`, código y `expires_at`.
- [x] El reintento actualiza `full_name` y `relationship` con los valores actuales del formulario.
- [x] Un reintento no aumenta la cantidad de invitaciones pendientes para esa combinación de usuario, niño y email.
- [x] Una invitación vencida, aceptada o cancelada no se reutiliza.
- [x] `authenticated` solo puede seleccionar invitaciones cuyo `invited_by` coincide con `auth.uid()`.
- [x] `authenticated` solo puede actualizar `full_name` y `relationship` de invitaciones propias, pendientes y vigentes.
- [x] `authenticated` no puede modificar mediante `UPDATE` el email, niño, creador, código, estado, vencimiento ni timestamps de una invitación.
- [x] La confirmación del modal muestra por separado el email previsto del padre y `CONTACT_TO_EMAIL` como destino físico de pruebas.
- [x] La activación continúa requiriendo el código y el email original almacenado para el padre; `CONTACT_TO_EMAIL` no sirve como reemplazo salvo que coincida con aquel email.
- [x] Un error de Resend deja la invitación en estado `pending` para que pueda reutilizarse en el siguiente intento.
- [x] Los logs del servidor incluyen `name`, `message` y código HTTP disponible del error de Resend sin incluir `RESEND_API_KEY`.
- [x] En desarrollo local, el propietario de Resend recibe el correo y el enlace abre `/activar` en la instancia local configurada.
- [ ] En Vercel, el propietario de Resend recibe el correo y el enlace abre `/activar` en la URL estable configurada.
- [x] El flujo invitación → recepción en correo de pruebas → activación con email original → vínculo del padre funciona de extremo a extremo.
- [x] `supabase migration list` queda sincronizado y `supabase db push --dry-run` no muestra migraciones pendientes después de aplicar el cambio.
- [x] Los advisors de seguridad y rendimiento de Supabase no reportan issues nuevos causados por esta spec.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.
- [x] Un código alterado (formato o combinación código+email incorrecta) muestra un error explícito en `/activar` y no permite crear la cuenta.
- [x] `/activar` sin parámetros muestra un mensaje pidiendo abrir el enlace recibido por correo.
- [x] El código y el email se precargan en `/activar` como campos de solo lectura y no pueden modificarse desde la interfaz.
- [x] `activate_invitation` verifica que el usuario creado corresponde al email de la invitación y es ejecutable como `anon` y `authenticated`.
- [x] El alta de cuenta por invitación funciona sin depender del correo de confirmación de Supabase Auth (`mailer_autoconfirm = true`).

## Decisions

- **Tomada:** `CONTACT_TO_EMAIL` recibe físicamente todas las invitaciones en local y Vercel. Es la única modalidad compatible con `onboarding@resend.dev` sin comprar ni verificar un dominio.
- **Tomada:** el email ingresado sigue siendo la identidad del padre y la credencial de activación. Cambiarlo por el email de pruebas rompería la asociación de la cuenta.
- **Tomada:** `CONTACT_FROM_EMAIL` contiene solo la dirección. El código agrega el nombre visible `OpenDayCare`.
- **Tomada:** `APP_URL` es explícita y server-only. Permite usar `localhost` localmente y la URL estable de Vercel en deployments.
- **Tomada:** el reintento reutiliza una invitación propia, pendiente y vigente. Evita acumular códigos válidos cuando falla el proveedor de correo.
- **Tomada:** el reintento actualiza nombre y parentesco, pero conserva código y vencimiento. Los datos corregibles reflejan el formulario actual sin extender indefinidamente la vigencia.
- **Tomada:** la lectura se restringe con `invited_by = auth.uid()` y la actualización se limita además por estado, vigencia y privilegios de columna. Se evita una policy amplia sobre todas las invitaciones y columnas.
- **Tomada:** la invitación permanece `pending` cuando Resend falla. El próximo intento puede reutilizarla.
- **Tomada:** el modal muestra ambos emails. No afirma que el padre recibió directamente un mensaje que en realidad llegó al propietario de Resend.
- **Tomada:** el enlace de activación incluye `code` y `email`, ambos codificados con `URL.searchParams`. Precargar el email evita errores de tipeo y el navegador ya no bloquea el campo con su validación nativa.
- **Tomada:** código y email se muestran como `readOnly` (no `disabled`) para que sigan viajando en el `FormData`; la seguridad real la mantiene la validación server-side, porque `readOnly` puede alterarse desde DevTools.
- **Tomada:** la validación de la invitación ocurre en el servidor al renderizar `/activar`, no con RPC por cada tecla. Evita respuestas fuera de orden y carreras en el cliente.
- **Tomada:** los estados de error son explícitos: ruta sin parámetros, formato de código inválido e invitación inexistente/vencida/usada. Un resultado vacío ya no se confunde con una invitación inválida.
- **Tomada:** `activate_invitation` se endurece verificando que el usuario creado corresponde al email de la invitación y se otorga a `anon` y `authenticated`. Con la confirmación de email desactivada, `signUp` puede crear sesión y el contexto autenticado debe poder activar.
- **Tomada:** desactivar la confirmación de email de Supabase (`mailer_autoconfirm = true`). El SMTP por defecto solo envía al propietario de Resend y rompía el alta de cualquier otro email; la invitación con código ya es el mecanismo de verificación del flujo.
- **Descartada:** condicionar `CONTACT_TO_EMAIL` a `NODE_ENV = development`. Vercel usa `NODE_ENV = production` y volvería a intentar un envío externo no autorizado.
- **Descartada:** usar `CONTACT_REPLY_TO_EMAIL`. El proyecto del curso no necesita recibir respuestas desde estas invitaciones.
- **Descartada:** hardcodear el destinatario, remitente o URL. Impediría configurar el mismo código entre local y Vercel.
- **Descartada:** cancelar y crear una invitación nueva en cada reintento. Acumularía códigos o invalidaría innecesariamente el código ya generado.
- **Descartada:** renovar siete días al reintentar. Permitiría prolongar indefinidamente una invitación pendiente.
- **Descartada:** una función `SECURITY DEFINER` nueva para el reintento. Las policies por propietario y los privilegios de columna ofrecen el acceso mínimo sin agregar otra API privilegiada.
- **Descartada:** enviar primero y persistir después. Un fallo de base de datos podría entregar un código que no existe.

## Risks

| Riesgo                                                                             | Mitigación                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTACT_TO_EMAIL` no coincide con el propietario de Resend                        | Validar con un envío manual; Resend devolverá un error registrable y la invitación quedará disponible para reintento.                                       |
| `APP_URL` apunta a `localhost` en Vercel                                           | Configurar la variable por entorno y verificar que el enlace recibido use la URL `*.vercel.app`.                                                            |
| Dos solicitudes concurrentes crean filas antes de que una pueda reutilizar la otra | El botón permanece deshabilitado durante `isPending`; esta spec garantiza reintentos secuenciales, no idempotencia distribuida entre procesos concurrentes. |
| Ya existen invitaciones duplicadas de intentos anteriores                          | La búsqueda toma la más reciente; la limpieza histórica queda fuera del alcance y las filas anteriores no se modifican.                                     |
| La policy `SELECT` expone códigos al usuario que creó la invitación                | Solo `invited_by = auth.uid()` puede leerlos; el código ya se muestra a ese mismo staff tras crear la invitación.                                           |
| Los datos actualizados cambian mientras el código permanece igual                  | Solo nombre y parentesco pueden cambiar; niño, email, código y vencimiento quedan protegidos por privilegios de columna.                                    |
| El deployment Preview usa una URL distinta de `APP_URL`                            | La spec usa la URL estable del proyecto; soporte automático para cada Preview queda fuera de alcance.                                                       |
| El SMTP por defecto de Supabase rechaza el alta de emails que no son del propietario | Se desactiva la confirmación de email (`mailer_autoconfirm = true`); el código de invitación queda como único factor de verificación.                     |
| El campo `readOnly` puede alterarse desde DevTools                                  | La Server Action valida de nuevo formato, invitación y correspondencia con el email antes de crear la cuenta.                                              |
| La activación corre tras un `signUp` que crea sesión                               | `activate_invitation` se otorga también a `authenticated` y valida que la sesión corresponda al usuario creado.                                           |

## Verificación del registro por invitación

Durante la implementación se verificó de extremo a extremo que el registro por invitación funciona:

- Un enlace válido (`/activar?code=B26NQ8&email=mario@gmail.com`) muestra la tarjeta del niño, precarga código y email como `readOnly` y habilita el formulario de contraseña.
- Un código alterado (`B26NQ8DSA`) muestra "Código no válido." y no habilita el formulario.
- `/activar` sin parámetros pide abrir el enlace recibido por correo.
- Tras desactivar la confirmación de email, el alta crea el usuario en `auth.users` confirmado, replica el perfil en `public.users`, crea el vínculo en `public.parent_children` y marca la invitación `accepted` con `accepted_at`.
- Una invitación ya utilizada deja de ser reutilizable y muestra el estado de invitación inválida.
- `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan; `supabase migration list` queda sincronizado.

## What is **not** in this spec

- Dominio o correo personalizado.
- Entrega física al email del padre.
- Reply-to y recepción de respuestas.
- Cancelación o reenvío de invitaciones no vigentes.
- Limpieza de duplicados históricos.
- Webhooks y seguimiento de entrega de Resend.
- Idempotencia distribuida para solicitudes concurrentes.
- Resolución automática de la URL específica de cada Vercel Preview.

Cada uno de esos, si llega, va en su propia spec.
