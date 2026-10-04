"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface DrawerShellProps {
  open: boolean;
  side: "left" | "right";
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Docked slide-over. Closed drawers are inert/invisible so they never trap keyboard focus. */
export function DrawerShell({ open, side, title, onClose, children }: DrawerShellProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside
      aria-label={title}
      aria-hidden={!open}
      inert={!open || undefined}
      className={cn(
        "fixed inset-y-0 z-40 flex w-full flex-col bg-canvas shadow-2xl transition-[transform,visibility] duration-500 ease-silk sm:w-[440px]",
        side === "right" ? "right-0 border-l border-edge/70" : "left-0 border-r border-edge/70",
        open ? "visible translate-x-0" : cn("invisible", side === "right" ? "translate-x-full" : "-translate-x-full"),
      )}
    >
      {children}
    </aside>
  );
}
