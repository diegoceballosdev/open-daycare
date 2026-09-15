# OpenDayCare

Sistema de gestión para guarderías construido con [Next.js](https://nextjs.org) (App Router, carpeta `src/`), [Tailwind CSS](https://tailwindcss.com) y [Supabase](https://supabase.com) como backend (base de datos, autenticación y RLS).

## Requisitos previos

- **Node.js** 20+ y **npm** (el gestor de paquetes del proyecto es `npm`).
- **Supabase CLI** instalado y accesible desde la terminal (`supabase --version`). Instálalo desde [Supabase CLI Docs](https://supabase.com/docs/guides/cli).
- Acceso a la cuenta Supabase del equipo (ver [Autenticación con el CLI de Supabase](#autenticacion-con-el-cli-de-supabase)).

## Puesta en marcha por primera vez

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo de entorno local a partir de la plantilla:

   ```bash
   cp .env.template .env
   ```

   Completa los valores en `.env` (puedes pedirlos al owner del equipo):

   | Variable | Descripción |
   | --- | --- |
   | `APP_URL` | URL base de la app (local: `http://localhost:3000`) |
   | `SUPABASE_DB_PASSWORD` | Password de la base de datos del proyecto remoto |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo uso en servidor; nunca exponerla en el cliente) |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase (https://<project-ref>.supabase.co) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del proyecto (para el cliente) |
   | `RESEND_API_KEY` | API key de Resend para envío de correos |
   | `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | Destinatario/remitente de los correos |

   > `.env` está en `.gitignore`: nunca lo subas al repositorio.

3. Autentica el CLI de Supabase y vincula el proyecto (ver sección siguiente).

4. Aplica las migraciones de base de datos (ver [Migraciones](#migraciones)).

## Autenticación con el CLI de Supabase

El proyecto usa el **MCP de Supabase** (herramientas `list_tables`, `execute_sql`, etc.) y el **CLI de Supabase** para migraciones. Ambos se autentican contra el proyecto remoto usando las credenciales del CLI.

### 1. Login (cuenta personal)

Inicia sesión en tu cuenta de Supabase desde la terminal:

```bash
supabase login
```

Se abrirá el navegador para autorizar el CLI. También puedes hacerlo con un token de acceso personal:

```bash
supabase login --token <TU_PERSONAL_ACCESS_TOKEN>
```

> El token de acceso personal se genera en el Dashboard de Supabase → **Account → Access Tokens**.

### 2. Autenticar al equipo / organización

Las credenciales del CLI no son por proyecto sino por **cuenta**. Si tu cuenta pertenece a la organización del equipo, ya puedes trabajar contra sus proyectos. Para ver todos los proyectos a los que tienes acceso:

```bash
supabase projects list
```

Debes ver el proyecto `OpenDayCare` (ref `mcilycrcsfmbepzcxsxa`).

- **Invitación de un nuevo miembro**: quien tenga rol de Owner/Admin en la organización debe invitar a la persona desde el Dashboard de Supabase → **Organization → Team**. Al aceptar la invitación, el miembro ya puede usar el CLI/MCP contra los proyectos de la organización.
- Si un miembro del equipo necesita **crear tokens** o gestionar la organización, necesitará el rol correspondiente en el Dashboard (no se hace desde el CLI).

### 3. Vincular el proyecto (solo la primera vez)

El link del proyecto **no viaja en git** (carpeta `supabase/.temp/` está ignorada), así que cada persona debe vincular su copia local:

```bash
supabase link --project-ref mcilycrcsfmbepzcxsxa
```

Te pedirá el `SUPABASE_DB_PASSWORD` (el mismo de `.env`). Verifica el estado del vínculo con:

```bash
supabase migration list
```

## Migraciones

Las migraciones viven en `supabase/migrations/` y son la **única fuente de verdad** del esquema. Para aplicarlas al proyecto remoto:

```bash
# Verificar primero qué se va a aplicar (sin ejecutar)
supabase db push --dry-run

# Aplicar
supabase db push
```

## Levantar el servidor de desarrollo

Con `.env` configurado, el link de Supabase hecho y las migraciones aplicadas:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La app lee la autenticación de Supabase en cada request (`src/proxy.ts` refresca la sesión), así que inicia sesión con las credenciales de demo.

### Credenciales de demo

Los seeds de las migraciones crean un usuario de staff:

| Rol | Email | Password |
| --- | --- | --- |
| Staff | `staff@opendaycare.com` | `Staff123!` |

## Comandos útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `supabase login` | Autenticar el CLI de Supabase |
| `supabase projects list` | Listar proyectos del equipo |
| `supabase link --project-ref mcilycrcsfmbepzcxsxa` | Vincular el proyecto |
| `supabase migration new <nombre>` | Crear una migración |
| `supabase db push --dry-run` | Verificar migraciones pendientes |
| `supabase db push` | Aplicar migraciones al proyecto remoto |

## Más info

- Documentación de Next.js: [nextjs.org/docs](https://nextjs.org/docs)
- Documentación de Supabase: [supabase.com/docs](https://supabase.com/docs)