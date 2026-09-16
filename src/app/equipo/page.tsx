import { redirect } from "next/navigation";
import TeamClient from "@/components/team-client";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

// Tope de páginas de `listUsers` (1000 usuarios por página).
const MAX_USER_PAGES = 10;
const USERS_PER_PAGE = 1000;

// El email vive en `auth.users`, no en `public.users`: se resuelve con la Admin API
// (service_role, solo servidor) y se arma el mapa `id → email` paginando.
async function fetchEmailById(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const emailById = new Map<string, string>();

  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      console.error("listUsers failed:", { message: error.message });
      break;
    }

    for (const user of data.users) {
      if (user.email) emailById.set(user.id, user.email);
    }

    if (data.users.length < USERS_PER_PAGE) break;
  }

  return emailById;
}

// Los joins anidados pueden venir como objeto o array según el tipo de relación.
function roomName(rooms: { name: string } | { name: string }[] | null): string {
  if (!rooms) return "";
  return Array.isArray(rooms) ? (rooms[0]?.name ?? "") : rooms.name;
}

// /equipo: solo el admin de la guardería ve y administra a su equipo.
export default async function TeamPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub;
  if (!currentUserId) redirect("/ingresar");

  const { data: profile } = await supabase
    .from("users")
    .select("role, daycare_id")
    .eq("id", currentUserId)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || !profile.daycare_id) {
    redirect("/");
  }

  // La policy del daycare devuelve todos los usuarios (incluye padres): se filtra por rol.
  const [{ data: members }, { data: rooms }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, status, rooms(name)")
      .eq("daycare_id", profile.daycare_id)
      .in("role", ["staff", "admin"])
      .order("full_name"),
    supabase
      .from("rooms")
      .select("id, name")
      .eq("daycare_id", profile.daycare_id)
      .order("name"),
  ]);

  const emailById = await fetchEmailById();

  const team = (members ?? []).map((member) => ({
    id: member.id,
    fullName: member.full_name,
    email: emailById.get(member.id) ?? "",
    role: member.role,
    status: member.status,
    roomName: roomName(member.rooms),
  }));

  return <TeamClient members={team} rooms={rooms ?? []} isAdmin={profile.role === "admin"} />;
}
