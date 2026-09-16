import { SunIcon } from "@/components/icons";
import SetPasswordForm from "./set-password-form";

// Pantalla pública destino del enlace de invitación de staff (SPEC 15).
// Misma identidad visual que /activar; la sesión viene en el enlace de Supabase.
export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <SunIcon width={30} height={30} />
        </div>
        <h1 className="m-0 mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Definí tu contraseña
        </h1>
        <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-ink-muted">
          Ya casi estás dentro. Elegí una contraseña para entrar a OpenDayCare.
        </p>

        <SetPasswordForm />
      </div>
    </div>
  );
}
