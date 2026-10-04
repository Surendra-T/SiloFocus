"use client";

import { Download, Volume2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { soundEngine } from "../../lib/audio/soundEngine";
import {
  CHIME_PRESETS,
  TICK_PRESETS,
  useSettingsStore,
  type ChimeSetting,
  type TickSetting,
} from "../../lib/hooks/useSettingsStore";
import { HEADING_FONTS, PALETTES, useThemeStore, type HeadingFont } from "../../lib/hooks/useThemeStore";
import { ModalShell } from "./ModalShell";
import { Switch } from "./Switch";

const TICK_LABELS: Record<TickSetting, string> = {
  off: "Silent",
  grandfather: "Grandfather Clock",
  pocket: "Pocket Watch",
  soft: "Soft Tactile",
};
const CHIME_LABELS: Record<ChimeSetting, string> = {
  bowl: "Kyoto Singing Bowl",
  shinkansen: "Shinkansen Chime",
  bell: "Desk Bell",
};
const FONT_LABELS: Record<HeadingFont, string> = {
  palette: "Follow palette",
  serif: "Editorial serif",
  sans: "Clean sans-serif",
  roman: "Classic Roman",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-edge/60 pt-6 first:border-t-0 first:pt-0">
      <h3 className="eyebrow">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="text-xs text-subtle">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round(value * 100)}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="h-1 w-36 cursor-pointer accent-accent"
    />
  );
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onExportJournal: () => void;
}

export function SettingsPanel({ open, onClose, onExportJournal }: SettingsPanelProps) {
  const { settings, update } = useSettingsStore();
  const theme = useThemeStore();

  const preview = (kind: "tick" | "chime") => {
    soundEngine.unlock();
    window.setTimeout(() => {
      if (kind === "tick") {
        const preset = settings.tickPreset;
        if (preset !== "off") {
          soundEngine.tick(preset);
          window.setTimeout(() => soundEngine.tick(preset), 600);
        }
      } else {
        soundEngine.chime(settings.chimePreset);
      }
    }, 80);
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Settings" className="max-w-lg">
      <div className="flex items-center justify-between px-6 pb-2 pt-6">
        <h2 className="text-2xl font-medium">Settings</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings" data-autofocus>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6 px-6 pb-6 pt-4">
        <Section title="Appearance">
          <div className="grid grid-cols-5 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => theme.setPalette(p.id)}
                aria-pressed={theme.palette === p.id}
                aria-label={p.name}
                title={p.name}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl border transition-all duration-300 ease-silk",
                  theme.palette === p.id ? "border-glow ring-1 ring-glow" : "border-edge/80 hover:border-subtle",
                )}
              >
                <span className="flex -space-x-1.5">
                  {p.swatch.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <Row label="Heading typeface">
            <select
              value={theme.headingFont}
              onChange={(e) => theme.setHeadingFont(e.target.value as HeadingFont)}
              className="rounded-full border border-edge/80 bg-transparent px-3 py-1.5 text-sm text-ink focus:outline-none"
              aria-label="Heading typeface"
            >
              {HEADING_FONTS.map((f) => (
                <option key={f} value={f} className="bg-canvas">
                  {FONT_LABELS[f]}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Atmospheric grain" hint="Subtle film-grain overlay">
            <Switch checked={theme.grain} onChange={theme.setGrain} label="Atmospheric grain" />
          </Row>
        </Section>

        <Section title="Sound">
          <Row label="Mute all sound">
            <Switch checked={settings.muted} onChange={(muted) => update({ muted })} label="Mute all sound" />
          </Row>
          <Row label="Master volume">
            <VolumeSlider label="Master volume" value={settings.masterVolume} onChange={(masterVolume) => update({ masterVolume })} />
          </Row>
          <Row label="Clock tick" hint="Plays each second while studying">
            <div className="flex items-center gap-2">
              <select
                value={settings.tickPreset}
                onChange={(e) => update({ tickPreset: e.target.value as TickSetting })}
                aria-label="Tick sound"
                className="rounded-full border border-edge/80 bg-transparent px-3 py-1.5 text-sm text-ink focus:outline-none"
              >
                {TICK_PRESETS.map((t) => (
                  <option key={t} value={t} className="bg-canvas">
                    {TICK_LABELS[t]}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-btn" aria-label="Preview tick" onClick={() => preview("tick")} disabled={settings.tickPreset === "off"}>
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </Row>
          <Row label="Tick volume">
            <VolumeSlider label="Tick volume" value={settings.tickVolume} onChange={(tickVolume) => update({ tickVolume })} />
          </Row>
          <Row label="Session chime" hint="Plays when a block ends">
            <div className="flex items-center gap-2">
              <select
                value={settings.chimePreset}
                onChange={(e) => update({ chimePreset: e.target.value as ChimeSetting })}
                aria-label="Chime sound"
                className="rounded-full border border-edge/80 bg-transparent px-3 py-1.5 text-sm text-ink focus:outline-none"
              >
                {CHIME_PRESETS.map((c) => (
                  <option key={c} value={c} className="bg-canvas">
                    {CHIME_LABELS[c]}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-btn" aria-label="Preview chime" onClick={() => preview("chime")}>
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </Row>
          <Row label="Chime volume">
            <VolumeSlider label="Chime volume" value={settings.chimeVolume} onChange={(chimeVolume) => update({ chimeVolume })} />
          </Row>
        </Section>

        <Section title="Focus">
          <Row label="Socratic Active Recall on Break" hint="Gemma 2 asks one question before each break">
            <Switch checked={settings.socratic} onChange={(socratic) => update({ socratic })} label="Socratic Active Recall on Break" />
          </Row>
        </Section>

        <Section title="Journal">
          <Row label="Daily journal" hint="Focus blocks, tasks and doubts as Markdown">
            <button type="button" className="btn-ghost" onClick={onExportJournal}>
              <Download className="h-4 w-4" />
              Export .md
            </button>
          </Row>
        </Section>
      </div>
    </ModalShell>
  );
}
