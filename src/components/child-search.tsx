import { SearchIcon } from "@/components/icons";

// Barra de búsqueda decorativa (sin lógica de filtrado por ahora)
export default function ChildSearch() {
  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
      <SearchIcon className="flex-none text-photo-ink" />
      <input
        type="text"
        placeholder="Buscar niño…"
        className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}