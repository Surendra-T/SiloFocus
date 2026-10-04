"use client";

import { useEffect, useRef } from "react";
import { formatClock } from "../utils";

interface FaviconOptions {
  seconds: number;
  /** 0..1 fraction of the ring to fill. */
  progress: number;
  subject: string;
  running: boolean;
}

/** Keeps the tab title and an off-screen 32x32 canvas favicon in sync with the timer. */
export function useDynamicFavicon({ seconds, progress, subject, running }: FaviconOptions): void {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    document.title = `(${formatClock(seconds)}) SiloFocus • ${subject}`;
  }, [seconds, subject]);

  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      canvasRef.current = canvas;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string): string => {
      const raw = css.getPropertyValue(name).trim();
      return raw ? `rgb(${raw.split(/\s+/).join(",")})` : fallback;
    };

    ctx.clearRect(0, 0, 32, 32);
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = color("--c-canvas", "#ffffff");
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(16, 16, 11, 0, Math.PI * 2);
    ctx.strokeStyle = color("--c-edge", "#bbbbbb");
    ctx.stroke();

    const fraction = Math.min(1, Math.max(0, progress));
    if (fraction > 0) {
      ctx.beginPath();
      ctx.arc(16, 16, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
      ctx.strokeStyle = color("--c-glow", "#b08d57");
      ctx.stroke();
    }
    if (running) {
      ctx.beginPath();
      ctx.arc(16, 16, 3, 0, Math.PI * 2);
      ctx.fillStyle = color("--c-accent", "#1e3a2f");
      ctx.fill();
    }

    let link = document.getElementById("silo-favicon") as HTMLLinkElement | null;
    if (!link) link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = canvas.toDataURL("image/png");
  }, [seconds, progress, running]);
}
