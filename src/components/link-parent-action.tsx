"use client";

import { useState } from "react";
import type { ChildWithRoom } from "@/components/child-card";
import { PlusIcon } from "@/components/icons";
import LinkParentModal from "@/components/link-parent-modal";

interface LinkParentActionProps {
  child: ChildWithRoom;
}

// Única parte interactiva del perfil: botón para vincular otro padre y su modal.
export default function LinkParentAction({ child }: LinkParentActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 pt-2">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-photo-ink">
          <PlusIcon />
        </span>
        <span className="text-[14.5px] font-extrabold text-accent-edit">Vincular otro padre</span>
      </button>

      <LinkParentModal child={child} open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
