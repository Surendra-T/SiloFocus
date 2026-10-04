"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "../../lib/utils";
import { PALETTES, type PaletteId } from "../../lib/hooks/useThemeStore";

interface ThemeSelectorProps {
  palette: PaletteId;
  onChange: (palette: PaletteId) => void;
}

/** Popover switcher for the five Haute palettes. */
export function ThemeSelector({ palette, onChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="icon-btn"
        aria-label="Choose colour palette"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Palette"
        onClick={() => setOpen((o) => !o)}
      >
        <Palette className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Colour palettes"
          className="card absolute right-0 top-full z-40 mt-2 w-72 animate-rise space-y-1 bg-canvas p-2"
        >
          {PALETTES.map((p) => {
            const active = p.id === palette;
            return (
              <li key={p.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300 hover:bg-ink/5",
                    active && "bg-ink/5",
                  )}
                >
                  <span className="flex -space-x-1.5" aria-hidden="true">
                    {p.swatch.map((c) => (
                      <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{p.name}</span>
                    <span className="block text-xs text-subtle">{p.tagline}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-glow" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
