"use client";

import { useActionState, useState } from "react";
import { activate, type ActivateState } from "@/app/activar/actions";
import { createClient } from "@/utils/supabase/client";

const initialState: ActivateState = {};

interface ActivateFormProps {
  initialCode?: string;
}

// Traducción del parentesco para la tarjeta de invitación.
const RELATIONSHIP_LABEL: Record<string, string> = {
  father: "Papá",
  mother: "Mamá",
  guardian: "Tutor/a",
};

// Formulario de activación de cuenta.
// Valida la invitación (código+email) contra la BD y muestra al niño + parentesco cuando es válida.
export default function ActivateForm({ initialCode = "" }: ActivateFormProps) {
  const [state, formAction, isPending] = useActionState(activate, initialState);

  // Validación en vivo: datos de la invitación una vez que código+email coinciden.
  const [invitation, setInvitation] = useState<{
    child_name: string;
    relationship: string;
  } | null>(null);

  async function validateInvitation(code: string, email: string) {
    if (code.trim() === "" || email.trim() === "") {
      setInvitation(null);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.rpc("get_invitation_details", {
      p_code: code.trim(),
      p_email: email.trim(),
    });

    const details = data?.[0];
    setInvitation(
      details
        ? { child_name: details.child_name, relationship: details.relationship }
        : null
    );
  }

  return (
    <form action={formAction}>
      {/* Tarjeta de invitación (se muestra cuando el código+email son válidos) */}
      {invitation && (
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-field-border bg-white p-[14px_16px]">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-avatar-blue font-display text-[19px] font-semibold text-avatar-blue-ink">
            {invitation.child_name.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-ink-muted">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {invitation.child_name} · {RELATIONSHIP_LABEL[invitation.relationship] ?? invitation.relationship}
            </div>
          </div>
        </div>
      )}

      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        name="code"
        defaultValue={initialCode}
        onChange={(e) => {
          const code = e.target.value;
          const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value ?? "";
          void validateInvitation(code, email);
        }}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] font-display text-[18px] font-bold tracking-[3px] text-ink"
      />
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        onChange={(e) => {
          const email = e.target.value;
          const code = (document.querySelector('input[name="code"]') as HTMLInputElement)?.value ?? "";
          void validateInvitation(code, email);
        }}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        CONFIRMAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="confirmPassword"
        className="mb-[24px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />

      {state?.error && (
        <p className="mb-[14px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Activando…" : "Activar mi cuenta"}
      </button>
    </form>
  );
}