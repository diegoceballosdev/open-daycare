"use client";

import { useState } from "react";
import type { ChildWithRoom } from "@/components/child-card";

interface LinkParentModalProps {
  child: ChildWithRoom;
  open: boolean;
  onClose: () => void;
}

// Parentesco seleccionable del padre invitado
type Relationship = "Mamá" | "Papá" | "Tutor/a";

// Opciones de parentesco en el orden del mock
const RELATIONSHIPS: Relationship[] = ["Mamá", "Papá", "Tutor/a"];

// Modal "Vincular padre": réplica pixel a pixel del mock references/pantallas/vincular-padre.dc.html
export default function LinkParentModal({ child, open, onClose }: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Mamá");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10">
      <div className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <div>
            <div className="font-display text-[18px] font-semibold text-ink">Vincular padre</div>
            <div className="text-[13px] text-ink-faint">a {child.full_name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-divider text-ink-muted"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="px-[26px] py-[22px]">
          {/* Info box azul */}
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4E72C8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-[1px] flex-none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {child.full_name.split(" ")[0]}.
            </span>
          </div>

          {/* Nombre del padre/madre */}
          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
            NOMBRE DEL PADRE/MADRE
          </div>
          <input
            type="text"
            placeholder="Ej. Diego Fernández"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          {/* Email */}
          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">EMAIL</div>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          {/* Parentesco */}
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-ink-muted">PARENTESCO</div>
          <div className="mb-5 flex gap-[9px]">
            {RELATIONSHIPS.map((option) => {
              const isActive = option === relationship;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRelationship(option)}
                  className={`flex-1 rounded-full border-[1.5px] py-[11px] text-[14px] font-extrabold ${
                    isActive
                      ? "border-[#9FB8EC] bg-announcement-soft text-announcement"
                      : "border-line bg-surface text-ink-nav"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Código de invitación */}
          <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-consent-bg px-[18px] py-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold tracking-[7px] text-consent-ink">7K4P9</div>
            <div className="mt-[6px] text-[13px] text-[#A88526]">Vence en 7 días</div>
          </div>

          {/* Enviar invitación */}
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}