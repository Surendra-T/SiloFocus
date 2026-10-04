"use client";

import { useEffect, useRef } from "react";

export type IdleReason = "hidden" | "inactive";

interface UseIdleOptions {
  enabled: boolean;
  /** No keyboard/mouse input for this long while the tab is visible. */
  idleThresholdMs?: number;
  /** Tab hidden or window unfocused for this long. */
  hiddenThresholdMs?: number;
  onIdle: (idleSeconds: number, reason: IdleReason) => void;
}

/**
 * Detects abandonment during a study session. Fires once per episode and re-arms on activity.
 * Focus moving into a cross-origin iframe (the Spotify player) counts as activity, not absence.
 */
export function useIdle({ enabled, idleThresholdMs = 60_000, hiddenThresholdMs = 30_000, onIdle }: UseIdleOptions) {
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (!enabled) return;

    let lastActive = Date.now();
    let awaySince: number | null = document.visibilityState === "hidden" ? Date.now() : null;
    let fired = false;
    let lastInput = 0;

    const iframeFocused = () => document.activeElement instanceof HTMLIFrameElement;

    const markActive = () => {
      lastActive = Date.now();
      awaySince = null;
      fired = false;
    };

    const onInput = () => {
      const now = Date.now();
      if (now - lastInput < 1000) return;
      lastInput = now;
      markActive();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") awaySince = awaySince ?? Date.now();
      else markActive();
    };

    const onBlur = () => {
      window.setTimeout(() => {
        if (document.visibilityState === "hidden") return;
        if (iframeFocused()) {
          markActive();
          return;
        }
        awaySince = awaySince ?? Date.now();
      }, 0);
    };

    const inputEvents = ["mousemove", "keydown", "pointerdown", "wheel", "touchstart"] as const;
    inputEvents.forEach((e) => window.addEventListener(e, onInput, { passive: true }));
    window.addEventListener("focus", markActive);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      if (fired) return;
      const now = Date.now();

      if (awaySince !== null) {
        if (document.visibilityState !== "hidden" && iframeFocused()) {
          markActive();
          return;
        }
        if (now - awaySince >= hiddenThresholdMs) {
          fired = true;
          onIdleRef.current(Math.floor((now - awaySince) / 1000), "hidden");
          return;
        }
      }
      if (now - lastActive >= idleThresholdMs) {
        fired = true;
        onIdleRef.current(Math.floor((now - lastActive) / 1000), "inactive");
      }
    }, 1000);

    return () => {
      inputEvents.forEach((e) => window.removeEventListener(e, onInput));
      window.removeEventListener("focus", markActive);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [enabled, idleThresholdMs, hiddenThresholdMs]);
}
