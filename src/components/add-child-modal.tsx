"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addChild, type AddChildState } from "@/app/ninos/actions";
import { isValidBirthDate } from "@/lib/child-validation";

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
  rooms: { id: string; name: string }[];
}

const initialState: AddChildState = {};

// Modal "Agregar niño": replica el mock references/pantallas/agregar-nino.dc.html
// y persiste vía la Server Action addChild.
export default function AddChildModal({ open, onClose, rooms }: AddChildModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(addChild, initialState);

  const defaultRoom = rooms.find((room) => room.name === "Soles")?.id ?? rooms[0]?.id ?? "";

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [room, setRoom] = useState(defaultRoom);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim() === "";
  const birthDateError = !isValidBirthDate(birthDate.trim());
  const roomError = room === "";
  const isFormValid = !nameError && !birthDateError && !roomError;

  // Los errores solo se muestran después del primer intento de guardado
  const showNameError = submitted && nameError;
  const showBirthDateError = submitted && birthDateError;
  const showRoomError = submitted && roomError;

  // En éxito: cierra el modal y refresca la lista de /ninos.
  // onClose viene memoizado desde el padre, así la identidad es estable y
  // el efecto corre una única vez por alta (state.success se resetea en cada
  // dispatch pendiente), sin generar bucle de refrescos.
  useEffect(() => {
    if (!state.success) return;
    onClose();
    router.refresh();
  }, [state.success, onClose, router]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!isFormValid) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("birthDate", birthDate);
    formData.set("room", room);
    formData.set("allergies", allergies);
    formData.set("notes", notes);
    startTransition(() => formAction(formData));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
        <form onSubmit={handleSubmit}>
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
          <button type="button" onClick={onClose} className="text-[15px] font-bold text-ink-muted">
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">Agregar niño</span>
          <button
            type="submit"
            disabled={isPending}
            className="text-[15px] font-extrabold text-accent disabled:cursor-not-allowed disabled:text-ink-faint"
          >
            {isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {/* Formulario */}
        <div className="px-[26px] py-6">
          {state.error && (
            <p className="mb-[14px] rounded-[12px] bg-red-50 p-[12px_14px] text-[14px] font-semibold text-red-600">
              {state.error}
            </p>
          )}

          <div className="mb-[18px]">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
              NOMBRE COMPLETO
            </div>
            <input
              type="text"
              placeholder="Ej. Martina López"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] ${
                showNameError ? "border-[#E5484D]" : "border-field-border"
              }`}
            />
            {showNameError && (
              <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">El nombre es obligatorio</div>
            )}
          </div>

          <div className="mb-[18px] flex gap-[14px]">
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
                FECHA DE NACIMIENTO
              </div>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={`w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B] ${
                  showBirthDateError ? "border-[#E5484D]" : "border-field-border"
                }`}
              />
              {showBirthDateError && (
                <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">
                  Fecha inválida (formato dd/mm/aaaa)
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">SALA</div>
              <div className="relative">
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={`w-full appearance-none rounded-[14px] border-[1.5px] bg-white px-4 py-[13px] text-[15px] font-bold text-ink outline-none ${
                    showRoomError ? "border-[#E5484D]" : "border-field-border"
                  }`}
                >
                  {rooms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {showRoomError && (
                <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">La sala es obligatoria</div>
              )}
            </div>
          </div>

          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">
            ALERGIAS (ETIQUETAS)
          </div>
          <input
            type="text"
            placeholder="Ej. Maní, Lactosa"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
          />

          <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-ink-muted">NOTAS MÉDICAS</div>
          <textarea
            placeholder="Indicaciones, medicación, contactos…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[90px] w-full resize-y rounded-[14px] border-[1.5px] border-field-border bg-white px-4 py-[13px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B]"
          />
        </div>
        </form>
      </div>
    </div>
  );
}