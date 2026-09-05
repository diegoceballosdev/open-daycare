"use client";

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
}

// Modal "Agregar niño": replica pixel a pixel el mock references/pantallas/agregar-nino.dc.html
export default function AddChildModal({ open, onClose }: AddChildModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <button type="button" onClick={onClose} className="text-[15px] font-bold text-ink-muted">
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">Agregar niño</span>
          <button type="button" onClick={onClose} className="text-[15px] font-extrabold text-accent">
            Guardar
          </button>
        </div>

        {/* Formulario */}
        <div className="px-[26px] py-6">
          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
            NOMBRE COMPLETO
          </div>
          <input
            type="text"
            placeholder="Ej. Martina López"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          <div className="mb-[18px] flex gap-[14px]">
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
                FECHA DE NACIMIENTO
              </div>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                className="w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
              />
            </div>
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">SALA</div>
              <div className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] font-bold text-ink">
                Soles
                <span className="flex-1" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
            ALERGIAS (ETIQUETAS)
          </div>
          <input
            type="text"
            placeholder="Ej. Maní, Lactosa"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">NOTAS MÉDICAS</div>
          <textarea
            placeholder="Indicaciones, medicación, contactos…"
            className="min-h-[90px] w-full resize-y rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B]"
          />
        </div>
      </div>
    </div>
  );
}