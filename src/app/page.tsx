import { createClient } from "@/utils/supabase/server";
import { loadMorePosts } from "@/app/feed/actions";
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

// Home: lee el perfil (users_select_self), arma los datos del staff y delega la UI.
export default async function Home() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub ?? "";

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, role, room_id, daycare_id")
    .eq("id", currentUserId)
    .maybeSingle();

  const role = profile?.role ?? "parent";
  const canPublish = role === "staff";
  const roomId = profile?.room_id ?? null;

  // Solo el staff publica: necesita los niños de su sala y el nombre de la sala.
  let kids: PostKid[] = [];
  let roomName = "";
  if (canPublish && roomId) {
    const [{ data: children }, { data: room }] = await Promise.all([
      supabase
        .from("children")
        .select("id, full_name")
        .eq("room_id", roomId)
        .order("full_name"),
      supabase.from("rooms").select("name").eq("id", roomId).maybeSingle(),
    ]);

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
    roomName = room?.name ?? "";
  }

  // El feed lo filtra RLS por rol y daycare; la primera página se resuelve en servidor.
  const posts = await loadMorePosts(null);

  return (
    <FeedClient
      initialPosts={posts}
      canPublish={canPublish}
      currentUserId={currentUserId}
      kids={kids}
      roomId={roomId}
      roomName={roomName}
    />
  );
}
