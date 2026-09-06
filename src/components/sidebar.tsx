"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentUser } from "@/data/posts";
import { logout } from "@/app/auth/actions";
import { BellIcon, HomeIcon, LogoutIcon, MenuIcon, PlusIcon, SunIcon, UserIcon, UsersIcon, XIcon } from "@/components/icons";

// Items de navegación del sidebar (el estado activo depende de la ruta actual)
const navItems = [
  { label: "Feed", href: "/", icon: HomeIcon, isActive: (path: string) => path === "/" },
  { label: "Niños", href: "/ninos", icon: UsersIcon, isActive: (path: string) => path.startsWith("/ninos") },
  { label: "Avisos", href: "/avisos", icon: BellIcon, isActive: (path: string) => path.startsWith("/avisos") },
  { label: "Mi cuenta", href: "/mi-cuenta", icon: UserIcon, isActive: (path: string) => path.startsWith("/mi-cuenta") },
];

export default function Sidebar({ onNewPost }: { onNewPost?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Botón hamburguesa (móvil) */}
      <MobileSidebarTrigger />

      {/* Sidebar desktop (siempre visible en lg+) */}
      <div className="hidden lg:block">
        <DesktopSidebarContent pathname={pathname} onNewPost={onNewPost} />
      </div>
    </>
  );
}

function MobileSidebarTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow lg:hidden"
      >
        <MenuIcon />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {open && (
        <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
          <MobileSidebarContent pathname={pathname} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function DesktopSidebarContent({ pathname, onNewPost }: { pathname: string; onNewPost?: () => void }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6">
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
      <button
        type="button"
        onClick={onNewPost}
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon />
        Nueva publicación
      </button>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
                active ? "bg-accent-soft font-extrabold text-accent" : "bg-transparent font-semibold text-ink-nav"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
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
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-muted"
            >
              <LogoutIcon />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebarContent({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <aside className="relative flex h-screen w-[248px] flex-col border-r border-line bg-surface px-4 py-6">
      {/* Botón cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg"
      >
        <XIcon />
      </button>

      {/* Marca */}
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1" onClick={onClose}>
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <SunIcon />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">OpenDayCare</div>
          <div className="mt-0.5 text-[11.5px] text-ink-faint">{currentUser.classroom}</div>
        </div>
      </a>

      {/* Navegación */}
      <nav className="mt-[18px] flex flex-1 flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
                active ? "bg-accent-soft font-extrabold text-accent" : "bg-transparent font-semibold text-ink-nav"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
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
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-muted"
            >
              <LogoutIcon />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}