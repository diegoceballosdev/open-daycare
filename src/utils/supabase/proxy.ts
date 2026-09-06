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
  const {
    data,
  } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  // Rutas públicas: solo /ingresar y /activar. El resto requiere sesión.
  const isPublicRoute =
    pathname.startsWith("/ingresar") || pathname.startsWith("/activar");

  // Ruta protegida sin sesión → redirigir al login.
  if (!isPublicRoute && !data) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    const redirectResponse = NextResponse.redirect(url);
    // Copiar cookies de sesión refrescadas a la respuesta de redirect
    // para mantener en sync browser y servidor.
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie)
    );
    return redirectResponse;
  }

  // Ruta pública con sesión activa → redirigir al feed.
  if (isPublicRoute && data) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie)
    );
    return redirectResponse;
  }

  // IMPORTANTE: devolver `supabaseResponse` tal cual. Si se crea una nueva
  // respuesta con NextResponse.next(), pasar el request y copiar las cookies
  // para mantener en sync browser y servidor.
  return supabaseResponse;
}