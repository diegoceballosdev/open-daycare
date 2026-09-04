import type { Child, Parent, ParentStatus } from "@/data/children";
import { AlertIcon, PlusIcon, SummaryIcon } from "@/components/icons";

interface ChildProfileProps {
  child: Child;
}

// Texto descriptivo del estado del padre según parentesco y status
function parentStatusText(parent: Parent): string {
  if (parent.status === "pending") return "invitación enviada";
  return parent.relationship === "Mamá" ? "activa" : "activo";
}

// Texto del badge de estado (ACTIVA/PENDIENTE)
function statusBadge(status: ParentStatus): string {
  return status === "active" ? "ACTIVA" : "PENDIENTE";
}

// Perfil de un niño: cabecera, alergias, info y padres vinculados
export default function ChildProfile({ child }: ChildProfileProps) {
  return (
    <div className="flex flex-wrap items-start gap-[26px]">
      {/* Columna izquierda */}
      <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
        {/* Cabecera */}
        <div className="flex items-center gap-[18px]">
          <div
            className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
            style={{ backgroundColor: child.avatarBackground, color: child.avatarForeground }}
          >
            {child.initials}
          </div>
          <div className="flex-1">
            <h1 className="m-0 font-display text-[28px] font-semibold text-ink">{child.name}</h1>
            <p className="mt-[3px] text-[15px] text-ink-muted">
              {child.age} años · Sala {child.room}
            </p>
          </div>
          <a
            href="#"
            className="rounded-[12px] border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-ink-nav"
          >
            Editar
          </a>
        </div>

        {/* Tarjeta de alergias (solo si existe) */}
        {child.allergiesNote && (
          <div className="flex gap-[14px] rounded-[16px] bg-warning px-[18px] py-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
              <AlertIcon className="text-white" />
            </div>
            <div>
              <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
              <div className="text-[14.5px] leading-[1.5] text-[#B25249]">{child.allergiesNote}</div>
            </div>
          </div>
        )}

        {/* Tarjeta de información */}
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="flex justify-between border-b border-divider px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Fecha de nacimiento</span>
            <span className="text-[14.5px] font-extrabold text-ink">{child.birthDate}</span>
          </div>
          <div className="flex justify-between border-b border-divider px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Sala</span>
            <span className="text-[14.5px] font-extrabold text-ink">{child.room}</span>
          </div>
          <div className="flex justify-between px-[18px] py-[15px]">
            <span className="text-[14.5px] text-ink-muted">Ingreso</span>
            <span className="text-[14.5px] font-extrabold text-ink">{child.enrollmentDate}</span>
          </div>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="flex w-[300px] flex-none flex-col gap-[14px]">
        {/* Botón resumen del día */}
        <a
          href="#"
          className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-4 py-[13px] text-[15px] font-extrabold text-white"
        >
          <SummaryIcon />
          Resumen del día
        </a>

        {/* Tarjeta de padres vinculados */}
        <div className="rounded-[16px] border border-line bg-surface px-[18px] py-4">
          <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-divider-label">
            PADRES VINCULADOS
          </div>
          <div className="flex flex-col gap-[14px]">
            {child.parents.map((parent) => (
              <div key={parent.name} className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold"
                  style={{ backgroundColor: parent.avatarBackground, color: parent.avatarForeground }}
                >
                  {parent.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-extrabold text-ink">{parent.name}</div>
                  <div className="text-[12.5px] text-ink-faint">
                    {parent.relationship} · {parentStatusText(parent)}
                  </div>
                </div>
                <span
                  className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
                    parent.status === "active" ? "bg-green-soft text-success" : "bg-yellow-soft text-yellow-ink"
                  }`}
                >
                  {statusBadge(parent.status)}
                </span>
              </div>
            ))}

            {/* Vincular otro padre */}
            <a href="#" className="flex items-center gap-3 pt-2">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
                <PlusIcon />
              </span>
              <span className="text-[14.5px] font-extrabold text-accent-edit">Vincular otro padre</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}