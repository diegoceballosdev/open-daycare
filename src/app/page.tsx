import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { loadMorePosts } from "@/app/feed/actions";
import { formatLongDate } from "@/lib/date-format";
import FeedClient from "@/components/feed-client";
import type { PostKid } from "@/components/new-post-modal";

// Paleta de avatares por índice: los niños reales no tienen color propio.
const KID_AVATAR_PALETTE = [
  { background: "#A9D9E8", foreground: "#1F7A93" },
  { background: "#F4B8CC", foreground: "#C44A7A" },
  { background: "#B9DEC4", foreground: "#3E8B62" },
  { background: "#C9B6E8", foreground: "#7B5FC0" },
  { background: "#F4DC8E", foreground: "#9A7B1E" },
];

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

// Home: resuelve la identidad real, cuenta los niños del daycare y delega la UI.
export default async function Home() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/ingresar");

  const supabase = await createClient();
  const canPublish = currentUser.role === "staff";
  const isAdmin = currentUser.role === "admin";
  const roomId = currentUser.roomId;

  // Solo el staff publica: necesita los niños de su sala.
  let kids: PostKid[] = [];
  if (canPublish && roomId) {
    const { data: children } = await supabase
      .from("children")
      .select("id, full_name")
      .eq("room_id", roomId)
      .order("full_name");

    kids = (children ?? []).map((child, index) => {
      const palette = KID_AVATAR_PALETTE[index % KID_AVATAR_PALETTE.length];
      const name = firstName(child.full_name);
      return {
        id: child.id,
        firstName: name,
        initials: name.slice(0, 1).toUpperCase(),
        avatarBackground: palette.background,
        avatarForeground: palette.foreground,
      };
    });
  }

  // `children` no tiene daycare_id: el conteo se acota por las salas del daycare.
  const { count } = await supabase
    .from("children")
    .select("id, rooms!inner(daycare_id)", { count: "exact", head: true })
    .eq("rooms.daycare_id", currentUser.daycareId);

  // El feed lo filtra RLS por rol y daycare; la primera página se resuelve en servidor.
  const posts = await loadMorePosts(null);

  return (
    <FeedClient
      initialPosts={posts}
      canPublish={canPublish}
      isAdmin={isAdmin}
      currentUserId={currentUser.id}
      currentUser={currentUser}
      childCount={count ?? 0}
      todayLabel={formatLongDate(new Date().toISOString())}
      kids={kids}
      roomId={roomId}
    />
  );
}
