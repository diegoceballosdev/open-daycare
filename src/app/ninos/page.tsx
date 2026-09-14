import { createClient } from "@/utils/supabase/server";
import NinosPageClient from "@/components/ninos-page-client";

export default async function ChildrenPage() {
  const supabase = await createClient();

  const [{ data: children }, { data: rooms }, { data: parentLinks }] = await Promise.all([
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id, rooms(id, name)"
      )
      .order("created_at"),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("parent_children").select("child_id"),
  ]);

  // Conteo de padres vinculados por niño (para la tarjeta).
  const parentCounts: Record<string, number> = {};
  for (const link of parentLinks ?? []) {
    parentCounts[link.child_id] = (parentCounts[link.child_id] ?? 0) + 1;
  }

  return <NinosPageClient kids={children ?? []} rooms={rooms ?? []} parentCounts={parentCounts} />;
}