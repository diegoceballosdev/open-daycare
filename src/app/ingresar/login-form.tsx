"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "@/app/auth/actions";

const initialState: LoginState = {};

// Formulario de inicio de sesión conectado a la server action `login`.
// Muestra error inline y estado de envío mientras el login corre.
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const hasError = Boolean(state?.error);

  return (
    <form action={formAction} aria-labelledby="login-heading">
      <label
        htmlFor="login-email"
        className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-ink-muted"
      >
        EMAIL
      </label>
      <input
        id="login-email"
        type="email"
        name="email"
        autoComplete="username"
        defaultValue="staff@opendaycare.com"
        aria-invalid={hasError}
        aria-describedby={hasError ? "login-error" : undefined}
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <label
        htmlFor="login-password"
        className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-ink-muted"
      >
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        aria-invalid={hasError}
        aria-describedby={hasError ? "login-error" : undefined}
        className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
      />
      <div className="mb-[20px] text-right">
        <a href="#" className="text-[13.5px] font-bold text-accent-edit">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {state?.error && (
        <p
          id="login-error"
          role="alert"
          className="mb-[14px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-700"
        >
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