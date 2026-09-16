import "server-only";
import { createClient } from "@/utils/supabase/server";
import { roleLabel, type UserRole } from "@/lib/role-labels";

export type { UserRole } from "@/lib/role-labels";

// Identidad real del usuario logueado que consumen el sidebar y el feed.
export interface CurrentUserView {
  id: string;
  fullName: string;
  initials: string;
  role: UserRole;
  roleLabel: string;
  roomId: string | null;
  roomName: string | null;
  daycareId: string;
  daycareName: string;
  avatarUrl: string | null;
}

// Iniciales para el avatar: máximo dos letras del nombre completo.
export function initialsFromName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

// Etiqueta del rol para la UI: el staff muestra su sala, el admin su rol y
// la familia el nombre del daycare (los padres no tienen sala).
// Identidad real del usuario logueado (server-only). Lee el perfil con
// `users_select_self` y resuelve el nombre de la sala y del daycare.
// Devuelve null si no hay sesión válida o no existe el perfil: cada page
// decide redirigir a /ingresar.
export async function getCurrentUser(): Promise<CurrentUserView | null> {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, role, room_id, daycare_id, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: room }, { data: daycare }] = await Promise.all([
    // Sin sala, la consulta por id vacío no devuelve fila.
    supabase.from("rooms").select("name").eq("id", profile.room_id ?? "").maybeSingle(),
    supabase.from("daycares").select("name").eq("id", profile.daycare_id).maybeSingle(),
  ]);

  const roomName = room?.name ?? null;
  const daycareName = daycare?.name ?? "";

  return {
    id: profile.id,
    fullName: profile.full_name,
    initials: initialsFromName(profile.full_name),
    role: profile.role,
    roleLabel: roleLabel(profile.role, roomName, daycareName),
    roomId: profile.room_id,
    roomName,
    daycareId: profile.daycare_id,
    daycareName,
    avatarUrl: profile.avatar_url,
  };
}
