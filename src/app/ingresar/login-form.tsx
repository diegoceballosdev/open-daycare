"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "@/app/auth/actions";

const initialState: LoginState = {};

// Formulario de inicio de sesión conectado a la server action `login`.
// Muestra error inline y estado de envío mientras el login corre.
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction}>
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        EMAIL
      </div>
      <input
        type="email"
        name="email"
        defaultValue="staff@opendaycare.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
        CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        placeholder="••••••••"
        className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <div className="mb-[20px] text-right">
        <a href="#" className="text-[13.5px] font-bold text-accent-edit">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

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
        {isPending ? "Ingresando…" : "Iniciar sesión"}
      </button>

      <p className="mt-[24px] text-center text-[14.5px] text-ink-muted">
        ¿Te invitó la guardería?{" "}
        <Link href="/activar" className="font-extrabold text-accent-edit">
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}