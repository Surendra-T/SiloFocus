"use client";

import { useEffect } from "react";
import { createPersistentStore, oneOf } from "../store/createPersistentStore";

export const PALETTE_IDS = ["heritage", "dark-academia", "wabi-sabi", "nordic", "obsidian"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export const HEADING_FONTS = ["palette", "serif", "sans", "roman"] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];

export interface PaletteMeta {
  id: PaletteId;
  name: string;
  tagline: string;
  dark: boolean;
  /** [canvas, ink, accent] preview swatches. */
  swatch: readonly [string, string, string];
}

export const PALETTES: readonly PaletteMeta[] = [
  { id: "heritage", name: "Old Money Heritage", tagline: "Racing green & brass", dark: false, swatch: ["#FAF8F5", "#1E3A2F", "#B08D57"] },
  { id: "dark-academia", name: "Dark Academia", tagline: "Parchment on espresso", dark: true, swatch: ["#1C1614", "#E9DDC6", "#D6B278"] },
  { id: "wabi-sabi", name: "Kyoto Wabi-Sabi", tagline: "Sandstone & bamboo", dark: false, swatch: ["#F4EFEA", "#262421", "#6B7047"] },
  { id: "nordic", name: "Nordic Mono", tagline: "Stark black & white", dark: false, swatch: ["#FFFFFF", "#000000", "#D6D3D1"] },
  { id: "obsidian", name: "Midnight Obsidian", tagline: "OLED black & amber", dark: true, swatch: ["#000000", "#ECE8E1", "#E8AA55"] },
] as const;

export interface ThemeState {
  palette: PaletteId;
  headingFont: HeadingFont;
  grain: boolean;
}

export const THEME_STORAGE_KEY = "silofocus-theme-v2";

const DEFAULT_THEME: ThemeState = { palette: "heritage", headingFont: "palette", grain: false };

const themeStore = createPersistentStore<ThemeState>(THEME_STORAGE_KEY, DEFAULT_THEME, (raw, d) => ({
  palette: oneOf(raw.palette, PALETTE_IDS, d.palette),
  headingFont: oneOf(raw.headingFont, HEADING_FONTS, d.headingFont),
  grain: raw.grain === true,
}));

export function applyThemeToDocument(state: ThemeState): void {
  const root = document.documentElement;
  const meta = PALETTES.find((p) => p.id === state.palette) ?? PALETTES[0];
  root.dataset.palette = meta.id;
  if (state.headingFont === "palette") delete root.dataset.heading;
  else root.dataset.heading = state.headingFont;
  root.classList.toggle("dark", meta.dark);
  root.style.colorScheme = meta.dark ? "dark" : "light";
}

export function useThemeStore() {
  const theme = themeStore.useStore();

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return {
    palette: theme.palette,
    headingFont: theme.headingFont,
    grain: theme.grain,
    setPalette: (palette: PaletteId) => themeStore.set({ palette }),
    setHeadingFont: (headingFont: HeadingFont) => themeStore.set({ headingFont }),
    setGrain: (grain: boolean) => themeStore.set({ grain }),
  };
}
