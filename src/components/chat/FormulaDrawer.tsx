"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, Square, X } from "lucide-react";
import { STATIC_FORMULAS } from "../../lib/data/formulas";
import { formulaStore, useGeneratedSheets } from "../../lib/hooks/useFormulaStore";
import { DrawerShell } from "../common/DrawerShell";
import MarkdownRenderer from "./MarkdownRenderer";

interface FormulaDrawerProps {
  open: boolean;
  onClose: () => void;
  subject: string;
}

/** Left slide-over cheat-sheet. Built-in sheets for the default subjects; AI generation for any subject. */
export function FormulaDrawer({ open, onClose, subject }: FormulaDrawerProps) {
  const generated = useGeneratedSheets();
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Switching subject abandons any generation for the previous one.
  useEffect(() => {
    abortRef.current?.abort();
    setDraft("");
    setError(null);
  }, [subject]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const saved = generated[subject];
  const builtIn = STATIC_FORMULAS[subject];
  const content = generating ? draft : (saved ?? builtIn ?? "");

  const generate = async () => {
    if (generating) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setError(null);
    setDraft("");

    let text = "";
    let completed = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "formula", subject, message: "", history: [] }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not generate a sheet right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setDraft(text);
      }
      text += decoder.decode();
      completed = true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
    if (completed && text.trim().length > 40) formulaStore.save(subject, text);
  };

  return (
    <DrawerShell open={open} side="left" title="Formula sheet" onClose={onClose}>
      <div className="flex items-center justify-between border-b border-edge/70 px-5 py-4">
        <div>
          <h2 className="text-xl font-medium">Formula Sheet</h2>
          <p className="max-w-[16rem] truncate text-xs text-subtle">{subject}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close formula sheet">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-edge/70 px-5 py-3">
        {generating ? (
          <button type="button" className="btn-ghost" onClick={() => abortRef.current?.abort()}>
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={() => void generate()}>
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
        )}
        {saved && !generating && (
          <button type="button" className="btn-ghost" onClick={() => formulaStore.clear(subject)}>
            <RotateCcw className="h-4 w-4" />
            {builtIn ? "Reset to default" : "Clear"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
        {error && <p className="mb-4 rounded-xl border border-edge/80 px-4 py-3 text-sm text-subtle">{error}</p>}
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          !generating && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="h-6 w-6 text-glow" />
              <p className="max-w-[16rem] text-sm text-subtle">
                No built-in sheet for “{subject}”. Generate one with Gemma 2 and it will be saved for next time.
              </p>
            </div>
          )
        )}
        {generating && !draft && <p className="text-sm text-subtle">Composing your sheet…</p>}
      </div>
    </DrawerShell>
  );
}
