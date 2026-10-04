"use client";

import { useState } from "react";
import { CloudRain, Pause, Play, Waves, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { soundEngine, type AmbientKind } from "../../lib/audio/soundEngine";
import { useSettingsStore } from "../../lib/hooks/useSettingsStore";

const SOUNDSCAPES: Array<{ kind: AmbientKind; label: string; hint: string; Icon: LucideIcon }> = [
  { kind: "brown", label: "Brown Noise", hint: "Deep focus rumble", Icon: Waves },
  { kind: "pink", label: "Pink Noise", hint: "Balanced masking", Icon: Wind },
  { kind: "rain", label: "Rain", hint: "Soft procedural rainfall", Icon: CloudRain },
];

/** Procedural soundscapes with smooth fades and independent volume sliders. */
export function AmbientSoundControls() {
  const { settings, update } = useSettingsStore();
  const [on, setOn] = useState<Record<AmbientKind, boolean>>(() => ({
    brown: soundEngine.isAmbientRunning("brown"),
    pink: soundEngine.isAmbientRunning("pink"),
    rain: soundEngine.isAmbientRunning("rain"),
  }));

  const toggle = (kind: AmbientKind) => {
    if (on[kind]) {
      soundEngine.stopAmbient(kind);
    } else {
      soundEngine.setAmbientVolume(kind, settings.ambientVolumes[kind]);
      soundEngine.startAmbient(kind);
    }
    setOn((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  const setVolume = (kind: AmbientKind, volume: number) => {
    soundEngine.setAmbientVolume(kind, volume);
    update({ ambientVolumes: { ...settings.ambientVolumes, [kind]: volume } });
  };

  return (
    <section className="card p-5" aria-label="Ambient soundscapes">
      <h2 className="eyebrow mb-4">Soundscapes</h2>
      <ul className="space-y-4">
        {SOUNDSCAPES.map(({ kind, label, hint, Icon }) => (
          <li key={kind} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => toggle(kind)}
              aria-pressed={on[kind]}
              aria-label={`${on[kind] ? "Stop" : "Play"} ${label}`}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-silk",
                on[kind] ? "border-accent bg-accent text-onaccent" : "border-edge/80 text-subtle hover:text-ink",
              )}
            >
              {on[kind] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-ink">
                <Icon className="h-3.5 w-3.5 text-subtle" />
                {label}
              </div>
              <div className="text-xs text-subtle">{hint}</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.ambientVolumes[kind] * 100)}
              onChange={(e) => setVolume(kind, Number(e.target.value) / 100)}
              aria-label={`${label} volume`}
              className="h-1 w-28 cursor-pointer accent-accent"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
