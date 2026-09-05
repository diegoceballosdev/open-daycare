"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import ChildCard from "@/components/child-card";
import ChildSearch from "@/components/child-search";
import { PlusIcon } from "@/components/icons";
import { children } from "@/data/children";

export default function ChildrenPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          {/* Cabecera */}
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-accent">GESTIÓN</div>
              <h1 className="m-0 font-display text-[30px] font-semibold text-ink">Niños</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
            >
              <PlusIcon />
              Agregar niño
            </button>
          </div>

          <ChildSearch />

          {/* Label de sala */}
          <div className="mb-[14px] flex items-center gap-3">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">SALA SOLES</span>
            <span className="text-[13px] text-ink-faint">{children.length} niños</span>
            <span className="h-px flex-1 bg-divider-strong" />
          </div>

          {/* Grid de tarjetas */}
          <div className="grid grid-cols-2 gap-[14px]">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}