"use client";

import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createStaff, type CreateStaffState } from "@/app/equipo/actions";
import Sidebar from "@/components/sidebar";
import type { CurrentUserView } from "@/lib/current-user";
import type { Database } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];
type UserStatus = Database["public"]["Enums"]["user_status"];

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  roomName: string;
}

interface TeamClientProps {
  members: TeamMember[];
  rooms: { id: string; name: string }[];
  isAdmin: boolean;
  currentUser: CurrentUserView;
}

interface FieldErrors {
  fullName?: boolean;
  email?: boolean;
  room?: boolean;
}

const initialState: CreateStaffState = {};

const ROLE_LABELS: Record<UserRole, string> = {
  staff: "Staff",
  admin: "Admin",
  parent: "Familia",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  pending: "Pendiente",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase() || "?";
}

// /equipo: lista del equipo del daycare y formulario de alta de staff (SPEC 15).
// El Server Component ya filtró por daycare y rol; acá solo se valida en cliente y se
// despacha la Server Action createStaff.
export default function TeamClient({ members, rooms, isAdmin, currentUser }: TeamClientProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createStaff, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Errores de validación del formulario (solo cliente); el server revalida igual.
  const [errors, setErrors] = useState<FieldErrors>({});

  // En éxito: limpia los campos (inputs no controlados) y refresca la lista del equipo.
  useEffect(() => {
    if (!state.success) return;

    formRef.current?.reset();
    router.refresh();
  }, [state.success, router]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const roomId = String(formData.get("roomId") ?? "");

    const nextErrors: FieldErrors = {
      fullName: fullName === "",
      email: !isValidEmail(email),
      room: roomId === "",
    };
    setErrors(nextErrors);

    if (nextErrors.fullName || nextErrors.email || nextErrors.room) return;

    startTransition(() => formAction(formData));
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar currentUser={currentUser} isAdmin={isAdmin} />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          {/* Cabecera */}
          <div className="mb-[22px]">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">GESTIÓN</div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-ink">Equipo</h1>
          </div>

          {/* Alta de staff */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            onInput={() => setErrors({})}
            className="mb-8 rounded-[18px] border border-line bg-surface p-[22px]"
          >
            <h2 className="m-0 mb-[16px] font-display text-[17px] font-semibold text-ink">
              Invitar a una persona del equipo
            </h2>

            {state.error && (
              <p
                role="alert"
                className="mb-[14px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600"
              >
                {state.error}
              </p>
            )}

            {state.success && (
              <p
                role="status"
                className="mb-[14px] rounded-[12px] bg-[#EAF7EE] p-[12px_14px] text-[14px] font-semibold text-[#2F7D4F]"
              >
                Invitación enviada a {state.deliveryEmail}. Revisá esa casilla para tomar el enlace.
              </p>
            )}

            <div className="mb-[18px] flex flex-col gap-[14px] sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="staff-name"
                  className="mb-2 block text-[12px] font-extrabold tracking-[.7px] text-ink-muted"
                >
                  NOMBRE COMPLETO
                </label>
                <input
                  id="staff-name"
                  name="fullName"
                  type="text"
                  placeholder="Ej. Martina López"
                  aria-invalid={errors.fullName === true}
                  className={`w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] ${
                    errors.fullName ? "border-[#E5484D]" : "border-field-border"
                  }`}
                />
                {errors.fullName && (
                  <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">
                    El nombre es obligatorio
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="staff-email"
                  className="mb-2 block text-[12px] font-extrabold tracking-[.7px] text-ink-muted"
                >
                  EMAIL
                </label>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  placeholder="nombre@correo.com"
                  aria-invalid={errors.email === true}
                  className={`w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] ${
                    errors.email ? "border-[#E5484D]" : "border-field-border"
                  }`}
                />
                {errors.email && (
                  <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">El email no es válido</div>
                )}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="staff-room"
                  className="mb-2 block text-[12px] font-extrabold tracking-[.7px] text-ink-muted"
                >
                  SALA
                </label>
                <div className="relative">
                  <select
                    id="staff-room"
                    name="roomId"
                    defaultValue={rooms[0]?.id ?? ""}
                    aria-invalid={errors.room === true}
                    className={`w-full appearance-none rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] font-bold text-ink outline-none ${
                      errors.room ? "border-[#E5484D]" : "border-field-border"
                    }`}
                  >
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#B0A290"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                {errors.room && (
                  <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">La sala es obligatoria</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>

          {/* Lista del equipo */}
          <div className="mb-[14px] flex items-center gap-3">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">TU EQUIPO</span>
            <span className="text-[13px] text-ink-faint">
              {members.length} {members.length === 1 ? "persona" : "personas"}
            </span>
            <span className="h-px flex-1 bg-divider-strong" />
          </div>

          {members.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-[14px] rounded-[16px] border border-line bg-surface p-4"
                >
                  <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-brand font-display text-[15px] font-semibold text-white">
                    {initials(member.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-extrabold text-ink">{member.fullName}</div>
                    <div className="truncate text-[13px] text-ink-faint">{member.email || "Sin email"}</div>
                  </div>
                  <div className="hidden text-right text-[13px] text-ink-muted sm:block">
                    {member.roomName || "Sin sala"}
                  </div>
                  <span className="rounded-full bg-accent-soft px-[10px] py-[5px] text-[12px] font-extrabold text-accent">
                    {ROLE_LABELS[member.role]}
                  </span>
                  <span
                    className={`rounded-full px-[10px] py-[5px] text-[12px] font-extrabold ${
                      member.status === "active" ? "bg-[#EAF7EE] text-[#2F7D4F]" : "bg-cream text-ink-muted"
                    }`}
                  >
                    {STATUS_LABELS[member.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[16px] border border-line bg-surface p-6 text-center text-[15px] text-ink-muted">
              Todavía no hay personas en tu equipo.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
