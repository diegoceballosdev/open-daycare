"use server";

import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import InvitationEmail from "@/emails/invitation-email";

export type SendInvitationState = {
  error?: string;
  success?: boolean;
  code?: string;
  email?: string;
};

// Alfabeto de códigos sin O/0/I/1 (mayor espacio que el mock y sin caracteres ambiguos)
const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const INVITATION_TTL_DAYS = 7;
const MAX_CODE_ATTEMPTS = 5;

// Por ahora el dominio es nuestro localhost; luego se reemplaza por el dominio real de producción.
const APP_ORIGIN = "http://localhost:3000";

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

  if (!process.env.RESEND_API_KEY) {
    return { error: "Falta la API key de Resend. No se pudo enviar el correo." };
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

  // Código único de 6 alfanuméricos: reintenta si colisiona con uno existente.
  let code = "";
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

  if (code === "") {
    return { error: "No se pudo generar un código único. Intentalo de nuevo." };
  }

  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("invitations").insert({
    child_id: child.id,
    invited_by: invitedBy,
    full_name: name,
    email,
    relationship: relationship as "father" | "mother" | "guardian",
    code,
    status: "pending",
    expires_at: expiresAt,
  });

  if (insertError) {
    return { error: "No se pudo guardar la invitación. Intentalo de nuevo." };
  }

  // Envía el correo con el código y el enlace a /activar (dominio localhost por ahora).
  const resend = new Resend(process.env.RESEND_API_KEY);
  const childFirstName = child.full_name.split(" ")[0];

  const { error: sendError } = await resend.emails.send({
    from: "OpenDayCare <onboarding@resend.dev>",
    to: [email],
    subject: `Te invitamos a seguir el día de ${childFirstName}`,
    react: InvitationEmail({
      childFirstName,
      code,
      origin: APP_ORIGIN,
    }),
  });

  if (sendError) {
    return { error: "La invitación se guardó, pero no se pudo enviar el correo. Intentalo de nuevo." };
  }

  return { success: true, code, email };
}