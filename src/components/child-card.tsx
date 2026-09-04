import type { Child } from "@/data/children";
import { ChevronIcon } from "@/components/icons";
import Link from "next/link";

interface ChildCardProps {
  child: Child;
}

// Texto de subtítulo según la cantidad de padres vinculados
function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  return `${count} padre${count > 1 ? "s" : ""} vinculado${count > 1 ? "s" : ""}`;
}

// Tarjeta de niño de la lista: avatar, nombre, subtítulo y badge/flecha derivados de los datos
export default function ChildCard({ child }: ChildCardProps) {
  return (
    <Link
      href={`/ninos/${child.id}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: child.avatarBackground, color: child.avatarForeground }}
      >
        {child.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">{child.name}</div>
        <div className="text-[13px] text-ink-faint">
          {child.age} años · {parentsLabel(child.parents.length)}
        </div>
      </div>
      {child.allergyBadge ? (
        <span className="flex-none rounded-full bg-warning-soft px-[9px] py-[5px] text-[11px] font-extrabold text-warning-ink">
          {child.allergyBadge}
        </span>
      ) : child.parents.length === 0 ? (
        <span className="flex-none rounded-full bg-pink-soft px-[9px] py-[5px] text-[11px] font-extrabold text-pink-deep">
          VINCULAR
        </span>
      ) : (
        <ChevronIcon className="flex-none text-[#CBB89F]" />
      )}
    </Link>
  );
}