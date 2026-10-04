"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export interface PaletteCommand {
  id: string;
  title: string;
  group: string;
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: PaletteCommand[];
  onClose: () => void;
}

/** Cmd/Ctrl+K spotlight: filterable command list with full keyboard navigation. */
export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return commands;
    return commands.filter((c) => {
      const haystack = `${c.title} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const runAt = (index: number) => {
    const command = results[index];
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[14vh]" onKeyDown={onKeyDown}>
      <div className="overlay animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="card relative w-full max-w-xl animate-rise overflow-hidden bg-canvas"
      >
        <div className="flex items-center gap-3 border-b border-edge/70 px-4">
          <Search className="h-4 w-4 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-subtle focus:outline-none"
          />
          <kbd className="rounded border border-edge/80 px-1.5 py-0.5 text-[10px] text-subtle">ESC</kbd>
        </div>

        <ul id="command-list" role="listbox" ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-subtle">No matching commands</li>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <li key={c.id} role="presentation">
                {header && <div className="eyebrow px-3 pb-1 pt-3">{header}</div>}
                <button
                  type="button"
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runAt(i)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-ink transition-colors duration-150",
                    i === active && "bg-ink/[0.07]",
                  )}
                >
                  <span>{c.title}</span>
                  {c.shortcut ? (
                    <kbd className="rounded border border-edge/80 px-1.5 py-0.5 text-[10px] text-subtle">{c.shortcut}</kbd>
                  ) : (
                    i === active && <CornerDownLeft className="h-3.5 w-3.5 text-subtle" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
