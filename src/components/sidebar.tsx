import { currentUser } from "@/app/data/posts";
import { BellIcon, HomeIcon, LogoutIcon, PlusIcon, SunIcon, UserIcon, UsersIcon } from "@/app/components/icons";

// Items de navegación del sidebar (todos inertes por ahora)
const navItems = [
  { label: "Feed", icon: HomeIcon, active: true },
  { label: "Niños", icon: UsersIcon, active: false },
  { label: "Avisos", icon: BellIcon, active: false },
  { label: "Mi cuenta", icon: UserIcon, active: false },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      {/* Marca */}
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <SunIcon />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">OpenDayCare</div>
          <div className="mt-0.5 text-[11.5px] text-ink-faint">{currentUser.classroom}</div>
        </div>
      </a>

      {/* Botón nueva publicación */}
      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon />
        Nueva publicación
      </a>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              active ? "bg-accent-soft font-extrabold text-accent" : "bg-transparent font-semibold text-ink-nav"
            }`}
          >
            <Icon />
            {label}
          </a>
        ))}
      </nav>

      {/* Bloque de usuario */}
      <div className="mt-[10px] border-t border-line pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand font-display text-base font-semibold text-white">
            {currentUser.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{currentUser.name}</div>
            <div className="text-xs text-ink-faint">{currentUser.role}</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-muted"
          >
            <LogoutIcon />
          </a>
        </div>
      </div>
    </aside>
  );
}