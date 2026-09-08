"use client";

import { useState } from "react";
import type { ChildWithRoom } from "@/components/child-card";
import { AlertIcon, PlusIcon, SummaryIcon } from "@/components/icons";
import LinkParentModal from "@/components/link-parent-modal";

interface ChildProfileProps {
  child: ChildWithRoom;
}

// Meses cortos en español para fechas legibles
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2022-03-12" → "12 mar 2022"
function formatBirthDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

// "2025-02-01" → "feb 2025"
function formatEnrollmentDate(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${year}`;
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

// Perfil de un niño: cabecera, alergias, info y padres vinculados
export default function ChildProfile({ child }: ChildProfileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const room = Array.isArray(child.rooms) ? child.rooms[0] : child.rooms;
  const roomName = room?.name ?? "Sala";
  const allergiesNote = child.medical_notes ?? (child.allergy_tags.length > 0 ? child.allergy_tags.join(", ") : null);

  return (
    <div className="flex flex-wrap items-start gap-[26px]">
      {/* Columna izquierda */}
      <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
        {/* Cabecera */}
        <div className="flex items-center gap-[18px]">
          <div className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[34px] font-semibold text-[#1F7A93]">
            {child.full_name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="m-0 font-display text-[28px] font-semibold text-ink">{child.full_name}</h1>
            <p className="mt-[3px] text-[15px] text-ink-muted">
              {ageFromBirthDate(child.birth_date)} años · Sala {roomName}
            </p>
          </div>
          <a
            href="#"
            className="rounded-[12px] border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-ink-nav"
          >
            Editar
          </a>
        </div>

        {/* Tarjeta de alergias (solo si existe) */}
        {allergiesNote && (
          <div className="flex gap-[14px] rounded-[16px] bg-warning px-[18px] py-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
              <AlertIcon className="text-white" />
            </div>
            <div>
              <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
              <div className="text-[14.5px] leading-[1.5] text-[#B25249]">{allergiesNote}</div>
            </div>
          </div>
        )}

        {/* Tarjeta de información */}
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="flex justify-between border-b border-divider px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Fecha de nacimiento</span>
            <span className="text-[14.5px] font-extrabold text-ink">{formatBirthDate(child.birth_date)}</span>
          </div>
          <div className="flex justify-between border-b border-divider px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Sala</span>
            <span className="text-[14.5px] font-extrabold text-ink">{roomName}</span>
          </div>
          <div className="flex justify-between px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Ingreso</span>
            <span className="text-[14.5px] font-extrabold text-ink">{formatEnrollmentDate(child.enrolled_at)}</span>
          </div>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="flex w-[300px] flex-none flex-col gap-[14px]">
        {/* Botón resumen del día */}
        <a
          href="#"
          className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-4 py-[13px] text-[15px] font-extrabold text-white"
        >
          <SummaryIcon />
          Resumen del día
        </a>

        {/* Tarjeta de padres vinculados */}
        <div className="rounded-[16px] border border-line bg-surface px-[18px] py-4">
          <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-divider-label">
            PADRES VINCULADOS
          </div>
          <div className="flex flex-col gap-[14px]">
            <div className="text-[14px] text-ink-faint">Sin padres vinculados todavía</div>

            {/* Vincular otro padre */}
            <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 pt-2">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
                <PlusIcon />
              </span>
              <span className="text-[14.5px] font-extrabold text-accent-edit">Vincular otro padre</span>
            </button>
          </div>
        </div>
      </div>

      <LinkParentModal child={child} open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}