import { SunIcon } from "@/components/icons";
import LoginForm from "./login-form";

// Pantalla de inicio de sesión.
// Fuente: references/pantallas/login.dc.html (sin el selector Personal/Familia, pedido del usuario).
export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-auth-bg lg:grid-cols-[1.05fr_1fr]">
      {/* Panel izquierdo con gradiente salmón, oculto por debajo de lg (1024px) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] p-14 text-white lg:flex">
        {/* Círculos decorativos */}
        <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12" />
        <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />

        {/* Marca */}
        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
            <SunIcon width={26} height={26} />
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[.5px]">
            OpenDayCare
          </span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h1 className="mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        {/* Footer */}
        <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
      </div>

      {/* Columna del formulario */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="m-0 mb-[6px] font-display text-[30px] font-semibold text-ink">
            Iniciar sesión
          </h2>
          <p className="m-0 mb-[28px] text-[15px] text-ink-muted">
            Ingresá para ver el día de hoy.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
