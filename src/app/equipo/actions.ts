"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import StaffInvitationEmail from "@/emails/staff-invitation-email";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export interface CreateStaffState {
  error?: string;
  success?: boolean;
  // Casilla a la que Resend entregó el correo (en local es CONTACT_TO_EMAIL).
  deliveryEmail?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

// Alta de staff desde /equipo (SPEC 15).
// Orden: validar → re-verificar que el llamador sea admin → crear en auth (Admin API,
// `app_metadata.role = staff`) → asignar sala → generar enlace de invitación → enviarlo.
export async function createStaff(
  _prevState: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const supabase = await createClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roomId = String(formData.get("roomId") ?? "").trim();

  // Validación server-side (mismas reglas que el formulario).
  if (fullName === "") {
    return { error: "El nombre es obligatorio." };
  }

  if (!isValidEmail(email)) {
    return { error: "El email no es válido." };
  }

  if (roomId === "") {
    return { error: "Elegí una sala." };
  }

  // Validación de configuración antes de cualquier escritura: si falta una variable
  // requerida no se crea el usuario en auth.
  const missingConfig = [
    process.env.RESEND_API_KEY ? null : "RESEND_API_KEY",
    process.env.CONTACT_TO_EMAIL ? null : "CONTACT_TO_EMAIL",
    process.env.CONTACT_FROM_EMAIL ? null : "CONTACT_FROM_EMAIL",
    process.env.APP_URL ? null : "APP_URL",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? null : "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missingConfig.length > 0) {
    return {
      error: `Falta configuración para crear staff: ${missingConfig.join(", ")}.`,
    };
  }

  // El llamador debe tener sesión válida (valida el JWT).
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerId = claimsData?.claims.sub;
  if (!callerId) {
    return { error: "Tu sesión expiró. Volvé a ingresar." };
  }

  // El rol se re-verifica contra la BD: el cliente no es fuente de verdad.
  const { data: caller } = await supabase
    .from("users")
    .select("role, daycare_id")
    .eq("id", callerId)
    .maybeSingle();

  if (!caller || caller.role !== "admin" || !caller.daycare_id) {
    return { error: "No tenés permiso para dar de alta usuarios." };
  }

  // La sala elegida tiene que pertenecer al daycare del admin.
  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .eq("daycare_id", caller.daycare_id)
    .maybeSingle();

  if (!room) {
    return { error: "La sala elegida no pertenece a tu guardería." };
  }

  const { data: daycare } = await supabase
    .from("daycares")
    .select("name")
    .eq("id", caller.daycare_id)
    .maybeSingle();

  // Cliente service_role: `app_metadata` (fuente del rol en el trigger) solo se
  // escribe desde servidor.
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    app_metadata: { role: "staff" },
    user_metadata: { daycare_id: caller.daycare_id, full_name: fullName },
  });

  if (createError || !created?.user) {
    const alreadyRegistered =
      createError?.code === "email_exists" ||
      /already|exist/i.test(createError?.message ?? "");

    if (alreadyRegistered) {
      return { error: "Ese email ya está registrado." };
    }

    console.error("createUser failed:", {
      code: createError?.code ?? null,
      message: createError?.message ?? null,
      status: createError?.status ?? null,
    });
    return { error: "No se pudo crear el usuario. Intentá de nuevo." };
  }

  // El trigger replica la fila en `public.users`, pero con la Admin API el
  // `app_metadata` personalizado llega después del INSERT: el trigger no ve `role` y
  // cae al default `parent`. Por eso el rol se reafirma acá junto con la sala
  // (el trigger tampoco setea `room_id`), siempre desde servidor con service_role.
  const { data: updatedProfile, error: profileError } = await admin
    .from("users")
    .update({ role: "staff", room_id: roomId })
    .eq("id", created.user.id)
    .select("id")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    console.error("update staff profile failed:", {
      message: profileError?.message ?? "sin fila en public.users",
    });
    return {
      error:
        "El usuario se creó en Auth, pero no se pudo preparar su perfil. Revisá el equipo.",
    };
  }

  // Enlace para fijar la contraseña (destino: /definir-contrasena).
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${process.env.APP_URL}/definir-contrasena` },
  });

  const actionLink = link?.properties?.action_link;
  if (linkError || !actionLink) {
    console.error("generateLink failed:", {
      code: linkError?.code ?? null,
      message: linkError?.message ?? null,
      status: linkError?.status ?? null,
    });
    return {
      error:
        "El usuario se creó, pero no se pudo generar la invitación. Intentá de nuevo.",
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error: sendError } = await resend.emails.send({
    from: `OpenDayCare <${process.env.CONTACT_FROM_EMAIL}>`,
    to: [process.env.CONTACT_TO_EMAIL!],
    subject: `Invitación al equipo de ${daycare?.name ?? "OpenDayCare"}`,
    react: StaffInvitationEmail({
      staffName: firstName(fullName),
      daycareName: daycare?.name ?? "tu guardería",
      actionLink,
    }),
  });

  if (sendError) {
    // Solo datos de diagnóstico: nombre, mensaje y status. Sin keys ni contenido del correo.
    const status = (sendError as { statusCode?: number }).statusCode;
    console.error("Resend send failed:", {
      name: sendError.name,
      message: sendError.message,
      statusCode: status ?? null,
    });
    return {
      error:
        "El usuario se creó, pero no se pudo enviar la invitación. Revisá el equipo y reenviá el enlace.",
    };
  }

  revalidatePath("/equipo");

  return { success: true, deliveryEmail: process.env.CONTACT_TO_EMAIL };
}
