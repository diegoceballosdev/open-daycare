"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export interface SetPasswordState {
  error?: string;
}

// Mínimo de Supabase Auth para la contraseña.
const MIN_PASSWORD_LENGTH = 6;

// Define la contraseña del staff invitado desde /definir-contrasena (ruta pública).
// El `action_link` de la invitación es implicit flow (sesión en el fragmento de la URL), pero
// el cliente de navegador de @supabase/ssr usa PKCE y descarta ese fragmento. Por eso los
// tokens viajan ocultos en el formulario y la sesión se establece acá, en el servidor.
export async function setPassword(
  _prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const accessToken = String(formData.get("accessToken") ?? "");
  const refreshToken = String(formData.get("refreshToken") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Establece la sesión del enlace de invitación (cookies vía el cliente de servidor).
  if (accessToken !== "" && refreshToken !== "") {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error("setSession failed:", {
        code: sessionError.code ?? null,
        message: sessionError.message,
        status: sessionError.status ?? null,
      });
      return { error: "El enlace no es válido o venció. Pedí una nueva invitación." };
    }
  }

  // Sin sesión válida el enlace no sirvió: se avisa antes de llamar a Auth.
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { error: "El enlace no es válido o venció. Pedí una nueva invitación." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("updateUser failed:", {
      code: error.code ?? null,
      message: error.message,
      status: error.status ?? null,
    });
    return { error: "No se pudo definir la contraseña. Intentá de nuevo." };
  }

  redirect("/");
}
