import Link from "next/link";
import { SunIcon } from "@/components/icons";
import ActivateForm from "./activate-form";

// Pantalla de activación de cuenta.
// Fuente: references/pantallas/activar-cuenta.dc.html
// El código viene pre-relleno desde el enlace del correo (/activar?code=...).
export default async function ActivateAccountPage(props: PageProps<"/activar">) {
  const searchParams = await props.searchParams;
  const code = typeof searchParams.code === "string" ? searchParams.code : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <SunIcon width={30} height={30} />
        </div>
        <h1 className="m-0 mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-ink-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <ActivateForm initialCode={code} />

        <p className="mt-[22px] text-center text-[14.5px] text-ink-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/ingresar" className="font-extrabold text-accent-edit">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}