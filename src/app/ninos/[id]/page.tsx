import Sidebar from "@/components/sidebar";
import ChildProfile from "@/components/child-profile";
import { BackIcon } from "@/components/icons";
import { children } from "@/data/children";

export default async function ChildProfilePage(props: PageProps<"/ninos/[id]">) {
  const { id } = await props.params;
  const child = children.find((c) => c.id === id);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          {/* Volver a Niños */}
          <a href="/ninos" className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-ink-muted">
            <BackIcon />
            Volver a Niños
          </a>

          {child ? (
            <ChildProfile child={child} />
          ) : (
            <div className="rounded-[16px] border border-line bg-surface p-6 text-center text-[15px] text-ink-muted">
              No encontramos a este niño.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}