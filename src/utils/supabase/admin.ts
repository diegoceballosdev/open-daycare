import "server-only";

import { createClient } from "@supabase/supabase-js";

// Cliente con `service_role`: omite RLS. Solo puede usarse en servidor
// (el import de `server-only` rompe el build si un Client Component lo importa).
// Cada llamada crea un cliente nuevo; no se guarda en variables globales.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
