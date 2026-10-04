import { useEffect, useRef } from "react";

interface UseIdleOptions {
  enabled: boolean;
  idleThresholdMs?: number;
  hiddenThresholdMs?: number;
  onIdle: (idleSeconds: number, reason: "hidden" | "inactive") => void;
}

export function useIdle({
  enabled,
  idleThresholdMs = 60_000,
  hiddenThresholdMs = 30_000,
  onIdle,
}: UseIdleOptions) {
  const lastActiveRef = useRef(Date.now());
  const hiddenStartRef = useRef<number | null>(null);
  const onIdleRef = useRef(onIdle);
  const firedRef = useRef(false);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) {
      firedRef.current = false;
      return;
    }

    lastActiveRef.current = Date.now();
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => { throttleTimer = null; }, 1000);
      lastActiveRef.current = Date.now();
      firedRef.current = false; // re-arm on activity
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenStartRef.current = Date.now();
      } else {
        hiddenStartRef.current = null;
        handleActivity();
      }
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleActivity);
    window.addEventListener("blur", () => {
      if (document.visibilityState !== "hidden" && !hiddenStartRef.current) {
        hiddenStartRef.current = Date.now();
      }
    });

    const interval = setInterval(() => {
      if (firedRef.current) return;
      const now = Date.now();
      
      // Check hidden
      if (hiddenStartRef.current && now - hiddenStartRef.current >= hiddenThresholdMs) {
        firedRef.current = true;
        onIdleRef.current(Math.floor((now - hiddenStartRef.current) / 1000), "hidden");
        return;
      }
      
      // Check idle
      if (now - lastActiveRef.current >= idleThresholdMs) {
        firedRef.current = true;
        onIdleRef.current(Math.floor((now - lastActiveRef.current) / 1000), "inactive");
      }
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("blur", handleActivity);
      clearInterval(interval);
    };
  }, [enabled, idleThresholdMs, hiddenThresholdMs]);
}
