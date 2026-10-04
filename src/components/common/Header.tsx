"use client";

import { BarChart3, Command, Flame, Maximize2, Settings, Sigma } from "lucide-react";
import type { PaletteId } from "../../lib/hooks/useThemeStore";
import { SubjectBadge } from "./SubjectBadge";
import { ThemeSelector } from "./ThemeSelector";

interface HeaderProps {
  subject: string;
  recentSubjects: string[];
  streak: number;
  palette: PaletteId;
  onSubjectChange: (subject: string) => void;
  onPaletteChange: (palette: PaletteId) => void;
  onToggleZen: () => void;
  onOpenSettings: () => void;
  onOpenBrief: () => void;
  onOpenFormulas: () => void;
  onOpenPalette: () => void;
}

export function Header({
  subject,
  recentSubjects,
  streak,
  palette,
  onSubjectChange,
  onPaletteChange,
  onToggleZen,
  onOpenSettings,
  onOpenBrief,
  onOpenFormulas,
  onOpenPalette,
}: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-6">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="text-2xl font-medium">SiloFocus</h1>
        <span aria-hidden="true" className="hidden h-4 w-px bg-glow/60 sm:block" />
        <div className="flex min-w-0 items-center gap-2">
          <SubjectBadge subject={subject} recent={recentSubjects} onChange={onSubjectChange} />
          <span
            className="hidden items-center gap-1 rounded-full border border-edge/80 px-3 py-1 text-xs font-medium text-glow sm:inline-flex"
            title="Consecutive study days"
          >
            <Flame className="h-3.5 w-3.5" />
            {streak}-day streak
          </span>
        </div>
      </div>

      <nav aria-label="Workspace tools" className="flex items-center gap-0.5">
        <button type="button" className="icon-btn" onClick={onOpenBrief} aria-label="Open Executive Brief" title="Executive Brief">
          <BarChart3 className="h-[18px] w-[18px]" />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenFormulas} aria-label="Open formula drawer" title="Formulas">
          <Sigma className="h-[18px] w-[18px]" />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenPalette} aria-label="Open command palette" title="Command palette (Ctrl/Cmd+K)">
          <Command className="h-[18px] w-[18px]" />
        </button>
        <ThemeSelector palette={palette} onChange={onPaletteChange} />
        <button type="button" className="icon-btn" onClick={onToggleZen} aria-label="Enter Zen mode" title="Zen mode (F)">
          <Maximize2 className="h-[18px] w-[18px]" />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Open settings" title="Settings">
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </nav>
    </header>
  );
}
