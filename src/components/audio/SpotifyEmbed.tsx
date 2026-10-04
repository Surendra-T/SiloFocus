"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";

const STUDY_PLAYLIST = process.env.NEXT_PUBLIC_SPOTIFY_STUDY_PLAYLIST || "0vvXsWCC9xrXsKd4FyS8kM";
const BREAK_PLAYLIST = process.env.NEXT_PUBLIC_SPOTIFY_BREAK_PLAYLIST || "37i9dQZF1DXa2PvUpywmOO";
const COLLAPSE_KEY = "silofocus-spotify-collapsed";

/** Rounded Spotify embed that crossfades between study and break playlists and can be collapsed. */
export function SpotifyEmbed({ phase }: { phase: "STUDY" | "BREAK" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [shownPhase, setShownPhase] = useState(phase);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (phase === shownPhase) return;
    setFading(true);
    const swap = window.setTimeout(() => {
      setShownPhase(phase);
      setFading(false);
    }, 300);
    return () => window.clearTimeout(swap);
  }, [phase, shownPhase]);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  };

  const playlist = shownPhase === "STUDY" ? STUDY_PLAYLIST : BREAK_PLAYLIST;

  return (
    <section className="card overflow-hidden" aria-label="Music">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors duration-300 hover:bg-ink/5"
      >
        <span className="text-sm text-ink">
          <span className="eyebrow mr-3">Ambience</span>
          {shownPhase === "STUDY" ? "Lo-Fi & Classical Study" : "Acoustic Break"}
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-subtle" /> : <ChevronUp className="h-4 w-4 text-subtle" />}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[height,opacity] duration-500 ease-silk",
          collapsed ? "h-0 opacity-0" : "h-[152px]",
          !collapsed && (fading ? "opacity-0" : "opacity-100"),
        )}
      >
        <iframe
          key={playlist}
          title="Spotify player"
          className="block w-full rounded-b-2xl"
          src={`https://open.spotify.com/embed/playlist/${playlist}?utm_source=generator`}
          width="100%"
          height="152"
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          tabIndex={collapsed ? -1 : 0}
        />
      </div>
    </section>
  );
}
