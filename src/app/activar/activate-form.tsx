"use client";

import { useActionState } from "react";
import { activate, type ActivateState } from "@/app/activar/actions";

const initialState: ActivateState = {};

interface ActivateFormProps {
  initialCode: string;
  initialEmail: string;
  invitation: {
    childName: string;
    relationship: string;
  } | null;
  validationError: string | null;
}

// Traducción del parentesco para la tarjeta de invitación.
const RELATIONSHIP_LABEL: Record<string, string> = {
  father: "Papá",
  mother: "Mamá",
  guardian: "Tutor/a",
};

// Formulario de activación de cuenta.
// El servidor valida código+email antes de mostrar el formulario de creación de cuenta.
export default function ActivateForm({
  initialCode,
  initialEmail,
  invitation,
  validationError,
}: ActivateFormProps) {
  const [state, formAction, isPending] = useActionState(activate, initialState);

  return (
    <form action={formAction}>
      {/* Tarjeta de invitación (se muestra cuando el código+email son válidos) */}
      {invitation && (
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-field-border bg-white p-[14px_16px]">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-avatar-blue font-display text-[19px] font-semibold text-avatar-blue-ink">
            {invitation.childName.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-ink-muted">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {invitation.childName} · {RELATIONSHIP_LABEL[invitation.relationship] ?? invitation.relationship}
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
        readOnly
        aria-readonly="true"
        className="mb-[18px] w-full cursor-not-allowed rounded-[14px] border-[1.5px] border-field-border bg-divider p-[14px_16px] font-display text-[18px] font-bold tracking-[3px] text-ink"
      />
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        defaultValue={initialEmail}
        readOnly
        aria-readonly="true"
        className="mb-[18px] w-full cursor-not-allowed rounded-[14px] border-[1.5px] border-field-border bg-divider p-[14px_16px] text-[15px] text-ink"
      />
      {validationError && (
        <p className="mb-[18px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600">
          {validationError}
        </p>
      )}

      {invitation && (
        <>
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
        </>
      )}
    </form>
  );
}
