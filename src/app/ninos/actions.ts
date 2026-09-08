"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { isValidBirthDate, birthDateToIso } from "@/lib/child-validation";

export type AddChildState = {
  error?: string;
  success?: boolean;
};

// Alta de un niño desde el modal "Agregar niño" de /ninos.
// Valida en servidor e inserta la fila en `children` con enrolled_at = hoy.
export async function addChild(
  _prevState: AddChildState,
  formData: FormData
): Promise<AddChildState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const roomId = String(formData.get("room") ?? "").trim();
  const allergies = String(formData.get("allergies") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  // Validación server-side (misma regla que el cliente).
  if (name === "") {
    return { error: "El nombre es obligatorio." };
  }

  if (!isValidBirthDate(birthDate)) {
    return { error: "Fecha inválida (formato dd/mm/aaaa)." };
  }

  const isoBirthDate = birthDateToIso(birthDate);
  if (!isoBirthDate) {
    return { error: "Fecha inválida (formato dd/mm/aaaa)." };
  }

  if (roomId === "") {
    return { error: "La sala es obligatoria." };
  }

  // Verifica que la sala exista antes de insertar.
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError) {
    return { error: "No se pudo validar la sala." };
  }

  if (!room) {
    return { error: "La sala seleccionada no existe." };
  }

  // Alergias: split por coma + trim; vacío si no hay.
  const allergyTags = allergies
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

  const today = new Date();
  const enrolledAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { error } = await supabase.from("children").insert({
    room_id: room.id,
    full_name: name,
    birth_date: isoBirthDate,
    enrolled_at: enrolledAt,
    allergy_tags: allergyTags,
    medical_notes: notes === "" ? null : notes,
    photo_consent: true,
    status: "active",
  });

  if (error) {
    return { error: "No se pudo guardar el niño. Intentalo de nuevo." };
  }

  revalidatePath("/ninos");
  return { success: true };
}