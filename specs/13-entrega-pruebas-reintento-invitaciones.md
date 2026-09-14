# SPEC 13 — Entrega de invitaciones al correo de pruebas y reintentos sin duplicados

> **Status:** Implementado
> **Depends on:** SPEC 12
> **Date:** 2026-09-14
> **Objective:** Corregir el envío de invitaciones para entregar siempre el correo al propietario de Resend, generar enlaces válidos en local y Vercel y reutilizar invitaciones pendientes al reintentar.

## Why this spec exists

Resend solo permite enviar desde `onboarding@resend.dev` al correo propietario de la cuenta mientras no exista un dominio verificado. La invitación debe seguir perteneciendo al email ingresado para el padre, aunque el mensaje se entregue físicamente a un único correo de pruebas durante todo el curso.

El flujo actual también inserta una nueva invitación antes de cada intento de envío. Si Resend rechaza el mensaje y el usuario reintenta, se acumulan invitaciones pendientes con códigos diferentes.

## Scope

**In:**

- Agregar `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` a la configuración documentada en `.env.template`.
- Usar siempre `CONTACT_TO_EMAIL` como destinatario físico de los correos de invitación, tanto en desarrollo local como en Vercel.
- Mantener el email ingresado en el modal como `public.invitations.email` y como credencial requerida durante la activación.
- Usar `CONTACT_FROM_EMAIL` como dirección del remitente con el nombre visible `OpenDayCare`.
- Construir el enlace `/activar?code=<código>` desde `APP_URL` para que funcione en local y en el deployment de Vercel.
- Validar `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` antes de insertar o actualizar una invitación.
- Reutilizar la invitación propia más reciente para el mismo niño y email cuando siga `pending` y no haya vencido.
- Actualizar `full_name` y `relationship` con los valores actuales del formulario al reutilizar una invitación.
- Conservar el código y `expires_at` originales al reintentar.
- Agregar acceso mínimo de lectura y actualización sobre invitaciones propias para soportar el reintento.
- Mostrar en la confirmación el email previsto del padre y el correo de pruebas que recibió físicamente el mensaje.
- Indicar en el correo para qué email de padre se creó la invitación.
- Registrar de forma segura los errores devueltos por Resend.
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

Esta feature no agrega columnas ni tablas. Reutiliza `public.invitations` de SPEC 12 y agrega policies, privilegios de columna e índice mediante una migración `allow_invitation_retries`.

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

## Acceptance criteria

- [ ] `.env.template` documenta `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` y `APP_URL` sin valores secretos reales.
- [ ] Si falta cualquiera de las cuatro variables requeridas, el modal muestra un error de configuración y no se inserta ni actualiza una invitación.
- [ ] `CONTACT_TO_EMAIL` es siempre el destinatario enviado a Resend, sin depender de `NODE_ENV`.
- [ ] `CONTACT_FROM_EMAIL` se usa como dirección del remitente bajo el nombre visible `OpenDayCare`.
- [ ] El email ingresado en el modal se guarda en `public.invitations.email` y no se reemplaza por `CONTACT_TO_EMAIL`.
- [ ] El enlace del correo usa `APP_URL` y no contiene `http://localhost:3000` cuando la variable apunta a Vercel.
- [ ] La plantilla identifica explícitamente el email del padre al que pertenece el código.
- [ ] La primera solicitud válida sin invitación reutilizable crea una fila `pending` con código único y vencimiento de siete días.
- [ ] Un nuevo intento del mismo usuario para el mismo niño y email reutiliza la invitación pendiente y vigente más reciente.
- [ ] El reintento conserva exactamente el mismo `id`, código y `expires_at`.
- [ ] El reintento actualiza `full_name` y `relationship` con los valores actuales del formulario.
- [ ] Un reintento no aumenta la cantidad de invitaciones pendientes para esa combinación de usuario, niño y email.
- [ ] Una invitación vencida, aceptada o cancelada no se reutiliza.
- [ ] `authenticated` solo puede seleccionar invitaciones cuyo `invited_by` coincide con `auth.uid()`.
- [ ] `authenticated` solo puede actualizar `full_name` y `relationship` de invitaciones propias, pendientes y vigentes.
- [ ] `authenticated` no puede modificar mediante `UPDATE` el email, niño, creador, código, estado, vencimiento ni timestamps de una invitación.
- [ ] La confirmación del modal muestra por separado el email previsto del padre y `CONTACT_TO_EMAIL` como destino físico de pruebas.
- [ ] La activación continúa requiriendo el código y el email original almacenado para el padre; `CONTACT_TO_EMAIL` no sirve como reemplazo salvo que coincida con aquel email.
- [ ] Un error de Resend deja la invitación en estado `pending` para que pueda reutilizarse en el siguiente intento.
- [ ] Los logs del servidor incluyen `name`, `message` y código HTTP disponible del error de Resend sin incluir `RESEND_API_KEY`.
- [ ] En desarrollo local, el propietario de Resend recibe el correo y el enlace abre `/activar` en la instancia local configurada.
- [ ] En Vercel, el propietario de Resend recibe el correo y el enlace abre `/activar` en la URL estable configurada.
- [ ] El flujo invitación → recepción en correo de pruebas → activación con email original → vínculo del padre funciona de extremo a extremo.
- [ ] `supabase migration list` queda sincronizado y `supabase db push --dry-run` no muestra migraciones pendientes después de aplicar el cambio.
- [ ] Los advisors de seguridad y rendimiento de Supabase no reportan issues nuevos causados por esta spec.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

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
