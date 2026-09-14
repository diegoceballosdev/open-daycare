"use server";

import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import InvitationEmail from "@/emails/invitation-email";

export type SendInvitationState = {
  error?: string;
  success?: boolean;
  code?: string;
  email?: string;
  deliveryEmail?: string;
};

// Alfabeto de códigos sin O/0/I/1 (mayor espacio que el mock y sin caracteres ambiguos)
const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const INVITATION_TTL_DAYS = 7;
const MAX_CODE_ATTEMPTS = 5;

// Parentescos válidos para la BD (el modal envía el valor mapeado)
const VALID_RELATIONSHIPS = ["father", "mother", "guardian"];

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Envío de la invitación desde el modal "Vincular padre" de /ninos/[id].
// Valida en servidor, inserta en `invitations` y manda el correo con el código vía Resend.
export async function sendInvitation(
  _prevState: SendInvitationState,
  formData: FormData
): Promise<SendInvitationState> {
  const supabase = await createClient();

  const childId = String(formData.get("childId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const relationship = String(formData.get("relationship") ?? "").trim();

  // Validación server-side (mismas reglas que el cliente).
  if (childId === "") {
    return { error: "Falta el niño a vincular." };
  }

  if (name === "") {
    return { error: "El nombre es obligatorio." };
  }

  if (!isValidEmail(email)) {
    return { error: "El email no es válido." };
  }

  if (!VALID_RELATIONSHIPS.includes(relationship)) {
    return { error: "El parentesco no es válido." };
  }

  // Validación de configuración antes de cualquier escritura: si falta una de las
  // variables requeridas, no se inserta ni actualiza una invitación.
  const missingConfig = [
    process.env.RESEND_API_KEY ? null : "RESEND_API_KEY",
    process.env.CONTACT_TO_EMAIL ? null : "CONTACT_TO_EMAIL",
    process.env.CONTACT_FROM_EMAIL ? null : "CONTACT_FROM_EMAIL",
    process.env.APP_URL ? null : "APP_URL",
  ].filter(Boolean);

  if (missingConfig.length > 0) {
    return {
      error: `Falta configuración del envío de correos: ${missingConfig.join(", ")}.`,
    };
  }

  // El staff logueado es quien invita (valida el JWT).
  const { data: claimsData } = await supabase.auth.getClaims();
  const invitedBy = claimsData?.claims.sub;
  if (!invitedBy) {
    return { error: "Debes iniciar sesión para invitar a un padre." };
  }

  // Resuelve el niño y su daycare (child → room → daycare).
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name, rooms(id, daycares(id))")
    .eq("id", childId)
    .maybeSingle();

  if (childError || !child) {
    return { error: "No se encontró el niño." };
  }

  const room = Array.isArray(child.rooms) ? child.rooms[0] : child.rooms;
  const daycare = Array.isArray(room?.daycares) ? room?.daycares[0] : room?.daycares;
  const daycareId = daycare?.id;
  if (!daycareId) {
    return { error: "El niño no tiene una sala asignada." };
  }

  const relationshipValue = relationship as "father" | "mother" | "guardian";

  // Reutilización: antes de generar un código, busca la invitación propia más
  // reciente pendiente y vigente para el mismo niño y email normalizado.
  const { data: reusable } = await supabase
    .from("invitations")
    .select("id, code, expires_at")
    .eq("child_id", child.id)
    .eq("invited_by", invitedBy)
    .ilike("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let code = "";
  let expiresAt = "";

  if (reusable) {
    // Reutiliza el id, código y vencimiento originales; actualiza solo nombre y parentesco.
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ full_name: name, relationship: relationshipValue })
      .eq("id", reusable.id);

    if (updateError) {
      return { error: "No se pudo actualizar la invitación. Intentalo de nuevo." };
    }

    code = reusable.code;
    expiresAt = reusable.expires_at;
  } else {
    // Código único de 6 alfanuméricos: reintenta si colisiona con uno existente.
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const candidate = generateCode();
      const { data: existing } = await supabase
        .from("invitations")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();

      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return { error: "No se pudo generar un código único. Intentalo de nuevo." };
    }

    expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Recupera el id de la fila insertada bajo la policy de lectura propia.
    const { data: inserted, error: insertError } = await supabase
      .from("invitations")
      .insert({
        child_id: child.id,
        invited_by: invitedBy,
        full_name: name,
        email,
        relationship: relationshipValue,
        code,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { error: "No se pudo guardar la invitación. Intentalo de nuevo." };
    }
  }

  // Envía el correo con el código y el enlace a /activar (origin = APP_URL).
  const resend = new Resend(process.env.RESEND_API_KEY);
  const childFirstName = child.full_name.split(" ")[0];

  const { error: sendError } = await resend.emails.send({
    from: `OpenDayCare <${process.env.CONTACT_FROM_EMAIL}>`,
    to: [process.env.CONTACT_TO_EMAIL!],
    subject: `Te invitamos a seguir el día de ${childFirstName}`,
    react: InvitationEmail({
      childFirstName,
      code,
      intendedEmail: email,
      origin: process.env.APP_URL,
    }),
  });

  if (sendError) {
    // Registra solo datos necesarios para diagnosticar: nombre, mensaje y código
    // HTTP disponibles. No se registran API keys, cuerpos completos ni el contenido del correo.
    const status = (sendError as { statusCode?: number }).statusCode;
    console.error("Resend send failed:", {
      name: sendError.name,
      message: sendError.message,
      statusCode: status ?? null,
    });
    return { error: "La invitación se guardó, pero no se pudo enviar el correo. Intentalo de nuevo." };
  }

  return { success: true, code, email, deliveryEmail: process.env.CONTACT_TO_EMAIL };
}