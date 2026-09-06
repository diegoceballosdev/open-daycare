"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type LoginState = {
  error?: string;
};

// Login con email y password contra Supabase.
// Usado por el formulario de /ingresar via useActionState.
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Cierre de sesión desde el sidebar.
export async function logout() {
  const supabase = await createClient();

  // Verificar que haya sesión antes de firmar out (valida el JWT).
  const { data } = await supabase.auth.getClaims();
  if (!data) {
    redirect("/ingresar");
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/ingresar");
}