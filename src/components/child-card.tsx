import Link from "next/link";

// Fila de `children` con la sala resuelta por el join en /ninos.
export interface ChildWithRoom {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  room_id: string | null;
  rooms:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
}

interface ChildCardProps {
  child: ChildWithRoom;
}

// Paleta de avatar derivada del nombre (determinística, sin campos extra en BD)
const AVATAR_PALETTES = [
  { background: "#A9D9E8", foreground: "#1F7A93" },
  { background: "#F4B8CC", foreground: "#C44A7A" },
  { background: "#B9DEC4", foreground: "#3E8B62" },
  { background: "#F4DC8E", foreground: "#9A7B1E" },
  { background: "#C9B6E8", foreground: "#7B5FC0" },
];

function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
  }
  return AVATAR_PALETTES[hash];
}

// Inicial del nombre para el avatar
function initials(fullName: string): string {
  return fullName.trim().charAt(0).toUpperCase();
}

// Edad calculada desde birth_date (yyyy-mm-dd)
function ageFromBirthDate(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return age;
}

// Tarjeta de niño de la lista: avatar, nombre, edad y badge/flecha derivados de la BD
export default function ChildCard({ child }: ChildCardProps) {
  const palette = avatarPalette(child.full_name);
  const allergyBadge = child.allergy_tags[0]?.toUpperCase();

  return (
    <Link
      href={`/ninos/${child.id}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: palette.background, color: palette.foreground }}
      >
        {initials(child.full_name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">{child.full_name}</div>
        <div className="text-[13px] text-ink-faint">
          {ageFromBirthDate(child.birth_date)} años · sin padres vinculados
        </div>
      </div>
      {allergyBadge ? (
        <span className="flex-none rounded-full bg-warning-soft px-[9px] py-[5px] text-[11px] font-extrabold text-warning-ink">
          {allergyBadge}
        </span>
      ) : (
        <span className="flex-none rounded-full bg-pink-soft px-[9px] py-[5px] text-[11px] font-extrabold text-pink-deep">
          VINCULAR
        </span>
      )}
    </Link>
  );
}