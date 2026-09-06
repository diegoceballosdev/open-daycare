import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // No guardar este cliente en una variable global: crear uno nuevo por request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(cacheHeaders).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // No ejecutar código entre createServerClient y supabase.auth.getClaims().
  // Un descuido aquí puede hacer muy difícil debuguear usuarios deslogueados
  // al azar. Si se quita getClaims() y se usa SSR con el cliente de Supabase,
  // los usuarios pueden ser deslogueados aleatoriamente.
  await supabase.auth.getClaims();

  // IMPORTANTE: devolver `supabaseResponse` tal cual. Si se crea una nueva
  // respuesta con NextResponse.next(), pasar el request y copiar las cookies
  // para mantener en sync browser y servidor.
  return supabaseResponse;
}