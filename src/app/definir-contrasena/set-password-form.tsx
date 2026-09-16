"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useActionState } from "react";
import { setPassword, type SetPasswordState } from "@/app/definir-contrasena/actions";

const initialState: SetPasswordState = {};
const MIN_PASSWORD_LENGTH = 6;

interface FieldErrors {
  password?: boolean;
  confirmPassword?: boolean;
}

// Formulario de definición de contraseña del staff invitado.
// El enlace de invitación de Supabase devuelve la sesión en el fragmento de la URL; esos
// tokens se adjuntan al formulario y la Server Action establece la sesión en el servidor
// (el cliente de navegador de @supabase/ssr usa PKCE y descarta el implicit flow).
export default function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState(setPassword, initialState);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const nextErrors: FieldErrors = {
      password: password.length < MIN_PASSWORD_LENGTH,
      confirmPassword: password !== confirmPassword,
    };
    setErrors(nextErrors);

    if (nextErrors.password || nextErrors.confirmPassword) return;

    // Tokens del fragmento del enlace (#access_token=…&refresh_token=…).
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (accessToken) formData.set("accessToken", accessToken);
    if (refreshToken) formData.set("refreshToken", refreshToken);

    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} onInput={() => setErrors({})}>
      <div className="mb-[18px]">
        <label
          htmlFor="password"
          className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-ink-muted"
        >
          CONTRASEÑA
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          aria-invalid={errors.password === true}
          className={`w-full rounded-[14px] border-[1.5px] bg-white p-[14px_16px] text-[15px] text-ink outline-none ${
            errors.password ? "border-[#E5484D]" : "border-field-border"
          }`}
        />
        {errors.password && (
          <p className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">
            La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres
          </p>
        )}
      </div>

      <div className="mb-[18px]">
        <label
          htmlFor="confirmPassword"
          className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-ink-muted"
        >
          CONFIRMAR CONTRASEÑA
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword === true}
          className={`w-full rounded-[14px] border-[1.5px] bg-white p-[14px_16px] text-[15px] text-ink outline-none ${
            errors.confirmPassword ? "border-[#E5484D]" : "border-field-border"
          }`}
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">Las contraseñas no coinciden</p>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="mb-[18px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Guardando…" : "Definir mi contraseña"}
      </button>
    </form>
  );
}
