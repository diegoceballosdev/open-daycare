"use client";

import { useState } from "react";

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
}

// ¿Es año bisiesto?
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Días que tiene un mes (con el año para febrero)
function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

// Valida fecha de nacimiento en formato dd/mm/aaaa: día/mes/año reales y no futura
function isValidBirthDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  if (year < 1) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthDate = new Date(year, month - 1, day);
  if (birthDate > startOfToday) return false;

  return true;
}

// Modal "Agregar niño": replica pixel a pixel el mock references/pantallas/agregar-nino.dc.html
export default function AddChildModal({ open, onClose }: AddChildModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  const nameError = name.trim() === "";
  const birthDateError = !isValidBirthDate(birthDate.trim());
  const isFormValid = !nameError && !birthDateError;

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
          <button
            type="button"
            onClick={onClose}
            disabled={!isFormValid}
            className="text-[15px] font-extrabold text-accent disabled:cursor-not-allowed disabled:text-ink-faint"
          >
            Guardar
          </button>
        </div>

        {/* Formulario */}
        <div className="px-[26px] py-6">
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
                nameError ? "border-[#E5484D]" : "border-field-border"
              }`}
            />
            {nameError && (
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
                  birthDateError ? "border-[#E5484D]" : "border-field-border"
                }`}
              />
              {birthDateError && (
                <div className="mt-1.5 text-[13px] font-semibold text-[#E5484D]">
                  Fecha inválida (formato dd/mm/aaaa)
                </div>
              )}
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
      </div>
    </div>
  );
}