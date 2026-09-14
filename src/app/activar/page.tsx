import Link from "next/link";
import { SunIcon } from "@/components/icons";
import { createClient } from "@/utils/supabase/server";
import ActivateForm from "./activate-form";

// Pantalla de activación de cuenta.
// Fuente: references/pantallas/activar-cuenta.dc.html
// El código y el email vienen desde el enlace del correo y se validan antes de mostrar el formulario.
export default async function ActivateAccountPage(props: PageProps<"/activar">) {
  const searchParams = await props.searchParams;
  const code = typeof searchParams.code === "string" ? searchParams.code.trim().toUpperCase() : "";
  const email = typeof searchParams.email === "string" ? searchParams.email.trim().toLowerCase() : "";

  let invitation: { childName: string; relationship: string } | null = null;
  let validationError: string | null = null;

  if (code === "" || email === "") {
    validationError = "Abrí el enlace de activación que recibiste por correo.";
  } else if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) {
    validationError = "Código no válido.";
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_invitation_details", {
      p_code: code,
      p_email: email,
    });

    const details = data?.[0];
    if (error) {
      validationError = "No se pudo validar la invitación. Intentalo de nuevo.";
    } else if (!details) {
      validationError = "La invitación no es válida, venció o ya fue utilizada.";
    } else {
      invitation = {
        childName: details.child_name,
        relationship: details.relationship,
      };
    }
  }

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

        <ActivateForm
          initialCode={code}
          initialEmail={email}
          invitation={invitation}
          validationError={validationError}
        />

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
