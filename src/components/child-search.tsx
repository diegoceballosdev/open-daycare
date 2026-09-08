import { SearchIcon } from "@/components/icons";

interface ChildSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// Barra de búsqueda de la lista de niños: filtrado reactivo por nombre
export default function ChildSearch({ value, onChange }: ChildSearchProps) {
  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
      <SearchIcon className="flex-none text-photo-ink" />
      <input
        type="text"
        placeholder="Buscar niño…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}