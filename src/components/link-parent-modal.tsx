"use client";

import { useActionState } from "react";
import { useState } from "react";
import type { ChildWithRoom } from "@/components/child-card";
import { sendInvitation, type SendInvitationState } from "@/app/ninos/[id]/actions";

interface LinkParentModalProps {
  child: ChildWithRoom;
  open: boolean;
  onClose: () => void;
}

// Parentesco seleccionable del padre invitado (UI)
type Relationship = "Mamá" | "Papá" | "Tutor/a";

// Opciones de parentesco en el orden del mock
const RELATIONSHIPS: Relationship[] = ["Mamá", "Papá", "Tutor/a"];

// Mapeo UI → BD (la BD guarda father/mother/guardian)
const RELATIONSHIP_TO_DB: Record<Relationship, string> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

const initialState: SendInvitationState = {};

// Modal "Vincular padre": réplica pixel a pixel del mock references/pantallas/vincular-padre.dc.html
export default function LinkParentModal({ child, open, onClose }: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Mamá");
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(sendInvitation, initialState);

  if (!open) return null;

  // Validación cliente (mismas reglas que el servidor) antes de disparar la acción.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (name.trim() === "") {
      setClientError("El nombre es obligatorio.");
      event.preventDefault();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setClientError("El email no es válido.");
      event.preventDefault();
      return;
    }

    setClientError(null);
  }

  // Estado de éxito: muestra la confirmación con el código generado y botón para cerrar.
  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10">
        <div className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
            <div>
              <div className="font-display text-[18px] font-semibold text-ink">Invitación enviada</div>
              <div className="text-[13px] text-ink-faint">para {state.email}</div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-[26px] py-[22px]">
            <p className="mb-5 text-[14.5px] leading-[1.5] text-ink-muted">
              El código corresponde al correo de <strong>{state.email}</strong>. El mensaje se entregó al buzón
              de pruebas <strong>{state.deliveryEmail}</strong>. Guardá este código por si lo necesita.
            </p>

            {/* Código de invitación generado */}
            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-consent-bg px-[18px] py-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-consent-ink">{state.code}</div>
              <div className="mt-[6px] text-[13px] text-[#A88526]">Vence en 7 días</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          <form action={formAction} onSubmit={handleSubmit}>
            <input type="hidden" name="childId" value={child.id} />
            <input type="hidden" name="relationship" value={RELATIONSHIP_TO_DB[relationship]} />

            {/* Nombre del padre/madre */}
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
              NOMBRE DEL PADRE/MADRE
            </div>
            <input
              type="text"
              name="name"
              placeholder="Ej. Diego Fernández"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
            />

            {/* Email */}
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">EMAIL</div>
            <input
              type="email"
              name="email"
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

            {/* Error inline (cliente o servidor) */}
            {(clientError ?? state?.error) && (
              <p className="mb-5 rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600">
                {clientError ?? state?.error}
              </p>
            )}

            {/* Enviar invitación */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}