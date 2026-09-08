import { createClient } from "@/utils/supabase/server";
import NinosPageClient from "@/components/ninos-page-client";

export default async function ChildrenPage() {
  const supabase = await createClient();

  const [{ data: children }, { data: rooms }] = await Promise.all([
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id, rooms(id, name)"
      )
      .order("created_at"),
    supabase.from("rooms").select("id, name").order("name"),
  ]);

  return <NinosPageClient kids={children ?? []} rooms={rooms ?? []} />;
}