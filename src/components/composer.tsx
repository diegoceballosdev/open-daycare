"use client";

import { currentUser } from "@/data/posts";
import { CameraIcon } from "@/components/icons";

export default function Composer({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-6 flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand font-display text-base font-semibold text-white">
        {currentUser.initials}
      </div>
      <span className="flex-1 text-[15px] text-ink-faint">Compartí un momento…</span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <CameraIcon />
      </span>
    </button>
  );
}