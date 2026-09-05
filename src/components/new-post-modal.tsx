"use client";

import { useState } from "react";
import { ImageIcon, PlusIcon } from "@/components/icons";

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
}

// Niños hardcodeados del mock (desacoplado de children.ts)
type KidChip = {
  id: string;
  firstName: string;
  initials: string;
  avatarBackground: string;
  avatarForeground: string;
};

const KIDS: KidChip[] = [
  { id: "mateo", firstName: "Mateo", initials: "M", avatarBackground: "#A9D9E8", avatarForeground: "#1F7A93" },
  { id: "sofia", firstName: "Sofía", initials: "S", avatarBackground: "#F4B8CC", avatarForeground: "#C44A7A" },
  { id: "benjamin", firstName: "Benjamín", initials: "B", avatarBackground: "#B9DEC4", avatarForeground: "#3E8B62" },
];

// Tipos de publicación en el orden del mock
type PostType = "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio";

const POST_TYPES: PostType[] = ["Comida", "Siesta", "Actividad", "Logro", "Ánimo", "Foto", "Anuncio"];

// Tema de cada chip TIPO: suave (inactivo) y relleno (activo), con los colores del mock
const typeTheme: Record<PostType, { softBackground: string; softText: string; filledBackground: string }> = {
  Comida: { softBackground: "#F7E7A6", softText: "#9A7B1E", filledBackground: "#9A7B1E" },
  Siesta: { softBackground: "#E7DCF6", softText: "#7B5FC0", filledBackground: "#7B5FC0" },
  Actividad: { softBackground: "#C7E7F1", softText: "#2E89A6", filledBackground: "#2E89A6" },
  Logro: { softBackground: "#CFEBD8", softText: "#3E9B6C", filledBackground: "#3E9B6C" },
  Ánimo: { softBackground: "#F9D2DE", softText: "#C56486", filledBackground: "#C56486" },
  Foto: { softBackground: "#FBD8CC", softText: "#D9684A", filledBackground: "#D9684A" },
  Anuncio: { softBackground: "#CCD8F4", softText: "#4E72C8", filledBackground: "#4E72C8" },
};

// Modal "Nueva publicación": réplica del mock references/pantallas/crear-publicacion.dc.html
export default function NewPostModal({ open, onClose }: NewPostModalProps) {
  const [selectedKids, setSelectedKids] = useState<Set<string>>(new Set());
  const [wholeRoom, setWholeRoom] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");

  if (!open) return null;

  // PARA: click en un niño agrega/quita su id y desactiva "Toda la sala"
  const toggleKid = (id: string) => {
    setWholeRoom(false);
    setSelectedKids((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // PARA: "Toda la sala" se activa y vacía la selección de niños
  const selectWholeRoom = () => {
    setWholeRoom(true);
    setSelectedKids(new Set());
  };

  // TIPO: single-select con toggle (click en el activo lo deselecciona)
  const toggleType = (type: PostType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <button type="button" onClick={onClose} className="text-[15px] font-bold text-ink-muted">
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">Nueva publicación</span>
          <button type="button" onClick={onClose} className="text-[15px] font-extrabold text-accent">
            Publicar
          </button>
        </div>

        {/* Contenido */}
        <div className="px-[26px] py-6">
          {/* PARA */}
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">PARA</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {KIDS.map((kid) => {
              const isActive = selectedKids.has(kid.id);
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => toggleKid(kid.id)}
                  className={`flex items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                    isActive ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-nav"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{ backgroundColor: kid.avatarBackground, color: kid.avatarForeground }}
                  >
                    {kid.initials}
                  </span>
                  {kid.firstName}
                </button>
              );
            })}
            <button
              type="button"
              onClick={selectWholeRoom}
              className={`rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold ${
                wholeRoom ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-nav"
              }`}
            >
              Toda la sala
            </button>
          </div>

          {/* TIPO */}
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">TIPO</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {POST_TYPES.map((type) => {
              const isActive = type === selectedType;
              const theme = typeTheme[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className="rounded-full px-4 py-2 text-[13.5px] font-extrabold"
                  style={
                    isActive
                      ? { backgroundColor: theme.filledBackground, color: "#fff" }
                      : { backgroundColor: theme.softBackground, color: theme.softText }
                  }
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">DESCRIPCIÓN</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] w-full min-h-[120px] resize-y rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          {/* FOTOS (estáticas, sin acciones) */}
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">FOTOS</div>
          <div className="flex gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-line bg-photo-bg text-[#CBB89F]">
              <ImageIcon />
            </div>
            <div className="flex h-24 w-24 flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-photo-line bg-photo-bg text-photo-ink">
              <PlusIcon width={22} height={22} strokeWidth={2} className="text-[#C5503A]" />
              <span className="text-xs">Agregar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}