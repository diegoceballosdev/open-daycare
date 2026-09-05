import Link from "next/link";
import { CheckIcon, SunIcon } from "@/components/icons";
import { invitation } from "@/data/invitation";

// Pantalla de activación de cuenta.
// Fuente: references/pantallas/activar-cuenta.dc.html
export default function ActivateAccountPage() {
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

        {/* Tarjeta de invitación */}
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-field-border bg-white p-[14px_16px]">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-avatar-blue font-display text-[19px] font-semibold text-avatar-blue-ink">
            {invitation.childInitials}
          </div>
          <div>
            <div className="text-[13px] text-ink-muted">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {invitation.childName}
            </div>
          </div>
        </div>

        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          value={invitation.code}
          readOnly
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] font-display text-[18px] font-bold tracking-[3px] text-ink"
        />
        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
          EMAIL
        </div>
        <input
          type="email"
          value={invitation.email}
          readOnly
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white p-[14px_16px] text-[15px] text-ink"
        />
        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-ink-muted">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
          defaultValue="contraseña"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white p-[14px_16px] text-[15px] text-ink"
        />

        {/* Consentimiento */}
        <label className="mb-[24px] flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-consent-bg p-[14px_16px]">
          <span className="mt-[1px] flex h-[24px] w-[24px] flex-none items-center justify-center rounded-[8px] bg-consent-check">
            <CheckIcon width={15} height={15} strokeWidth={3} stroke="#fff" />
          </span>
          <span className="text-[14px] leading-[1.45] text-consent-ink">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </label>

        <a
          href="#"
          className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        >
          Activar mi cuenta
        </a>
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
