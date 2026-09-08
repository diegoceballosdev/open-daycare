import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/components/sidebar";
import ChildProfile from "@/components/child-profile";
import { BackIcon } from "@/components/icons";
import Link from "next/link";

export default async function ChildProfilePage(props: PageProps<"/ninos/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id, rooms(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!child) {
    redirect("/ninos");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          {/* Volver a Niños */}
          <Link href="/ninos" className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-ink-muted">
            <BackIcon />
            Volver a Niños
          </Link>

          <ChildProfile child={child} />
        </div>
      </main>
    </div>
  );
}