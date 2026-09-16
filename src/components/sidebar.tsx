"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUserView } from "@/lib/current-user";
import { logout } from "@/app/auth/actions";
import { BellIcon, HomeIcon, LogoutIcon, MenuIcon, PlusIcon, SunIcon, TeamIcon, UserIcon, UsersIcon, XIcon } from "@/components/icons";

// Items de navegación del sidebar (el estado activo depende de la ruta actual).
// `adminOnly` se filtra según el rol real del usuario (prop `isAdmin`).
const navItems = [
  { label: "Feed", href: "/", icon: HomeIcon, isActive: (path: string) => path === "/", adminOnly: false },
  { label: "Niños", href: "/ninos", icon: UsersIcon, isActive: (path: string) => path.startsWith("/ninos"), adminOnly: false },
  { label: "Avisos", href: "/avisos", icon: BellIcon, isActive: (path: string) => path.startsWith("/avisos"), adminOnly: false },
  { label: "Equipo", href: "/equipo", icon: TeamIcon, isActive: (path: string) => path.startsWith("/equipo"), adminOnly: true },
  { label: "Mi cuenta", href: "/mi-cuenta", icon: UserIcon, isActive: (path: string) => path.startsWith("/mi-cuenta"), adminOnly: false },
];

export default function Sidebar({
  currentUser,
  onNewPost,
  canPublish = true,
  isAdmin = false,
}: {
  currentUser: CurrentUserView;
  onNewPost?: () => void;
  canPublish?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Botón hamburguesa (móvil) */}
      <MobileSidebarTrigger items={items} currentUser={currentUser} />

      {/* Sidebar desktop (siempre visible en lg+) */}
      <div className="hidden lg:block">
        <DesktopSidebarContent
          pathname={pathname}
          currentUser={currentUser}
          onNewPost={onNewPost}
          canPublish={canPublish}
          items={items}
        />
      </div>
    </>
  );
}

type NavItem = (typeof navItems)[number];

// Avatar del usuario: foto si existe, iniciales sobre el color de marca si no.
function UserAvatar({ user }: { user: CurrentUserView }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className="h-[38px] w-[38px] flex-none rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand font-display text-base font-semibold text-white">
      {user.initials}
    </div>
  );
}

function MobileSidebarTrigger({
  items,
  currentUser,
}: {
  items: NavItem[];
  currentUser: CurrentUserView;
}) {
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
          <MobileSidebarContent
            pathname={pathname}
            currentUser={currentUser}
            onClose={() => setOpen(false)}
            items={items}
          />
        </div>
      )}
    </>
  );
}

function DesktopSidebarContent({
  pathname,
  currentUser,
  onNewPost,
  canPublish,
  items,
}: {
  pathname: string;
  currentUser: CurrentUserView;
  onNewPost?: () => void;
  canPublish: boolean;
  items: NavItem[];
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6">
      {/* Marca */}
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <SunIcon />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">OpenDayCare</div>
          <div className="mt-0.5 text-[11.5px] text-ink-faint">
            {currentUser.roomName ?? currentUser.daycareName}
          </div>
        </div>
      </a>

      {/* Botón nueva publicación: oculto para roles que no publican */}
      {canPublish && (
        <button
          type="button"
          onClick={onNewPost}
          className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
        >
          <PlusIcon />
          Nueva publicación
        </button>
      )}

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ label, href, icon: Icon, isActive }) => {
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
          <UserAvatar user={currentUser} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{currentUser.fullName}</div>
            <div className="text-xs text-ink-faint">{currentUser.roleLabel}</div>
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

function MobileSidebarContent({
  pathname,
  currentUser,
  onClose,
  items,
}: {
  pathname: string;
  currentUser: CurrentUserView;
  onClose: () => void;
  items: NavItem[];
}) {
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
          <div className="mt-0.5 text-[11.5px] text-ink-faint">
            {currentUser.roomName ?? currentUser.daycareName}
          </div>
        </div>
      </a>

      {/* Navegación */}
      <nav className="mt-[18px] flex flex-1 flex-col gap-1">
        {items.map(({ label, href, icon: Icon, isActive }) => {
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
          <UserAvatar user={currentUser} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{currentUser.fullName}</div>
            <div className="text-xs text-ink-faint">{currentUser.roleLabel}</div>
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