"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActivateState = {
  error?: string;
};

// Activación de la cuenta del padre desde /activar (página pública).
// Valida la invitación (vía get_invitation_details), crea la cuenta en Supabase Auth,
// llama a la RPC activate_invitation (crea parent_children + marca accepted) y loguea.
export async function activate(
  _prevState: ActivateState,
  formData: FormData
): Promise<ActivateState> {
  const supabase = await createClient();

  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Validación server-side de contraseñas.
  if (password === "" || confirmPassword === "") {
    return { error: "Las contraseñas no pueden estar vacías." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Valida la invitación y resuelve daycare_id + full_name para el signUp.
  const { data: invitation } = await supabase.rpc("get_invitation_details", {
    p_code: code,
    p_email: email,
  });

  const details = invitation?.[0];
  if (!details) {
    return { error: "Código o email no válidos. Verificá que la invitación esté pendiente." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        daycare_id: details.daycare_id,
        full_name: details.parent_full_name,
      },
    },
  });

  if (signUpError) {
    // Supabase Auth devuelve distintos mensajes para un email ya registrado
    // según configuración/rate-limit (clásico y el de seguridad del signUp).
    if (
      /already registered|already been registered/i.test(signUpError.message) ||
      /for security purposes/i.test(signUpError.message)
    ) {
      return { error: "Este email ya está registrado." };
    }
    return { error: signUpError.message };
  }

  // Sin error pero sin identidades nuevas (user ya existente): Supabase oculta
  // el registro duplicado devolviendo un user sin identities.
  if ((signUpData.user?.identities?.length ?? 0) === 0) {
    return { error: "Este email ya está registrado." };
  }

  if (!signUpData.user) {
    return { error: "No se pudo crear la cuenta. Intentalo de nuevo." };
  }

  // Crea el vínculo padre→niño y marca la invitación accepted (RPC SECURITY DEFINER).
  const { data: rpcData, error: rpcError } = await supabase.rpc("activate_invitation", {
    p_code: code,
    p_email: email,
    p_new_user_id: signUpData.user.id,
  });

  if (rpcError || !rpcData?.[0]?.ok) {
    const message = rpcError?.message ?? rpcData?.[0]?.message ?? "No se pudo activar la cuenta.";
    return { error: message };
  }

  redirect("/");
}