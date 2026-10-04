import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return ${m.toString().padStart(2, "0")}:;
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}
