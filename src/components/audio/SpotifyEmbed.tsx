import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export function SpotifyEmbed({ phase }: { phase: "STUDY" | "BREAK" }) {
  const [collapsed, setCollapsed] = useState(false);
  const url = phase === "STUDY" 
    ? process.env.NEXT_PUBLIC_SPOTIFY_STUDY_PLAYLIST || "0vvXsWCC9xrXsKd4FyS8kM"
    : process.env.NEXT_PUBLIC_SPOTIFY_BREAK_PLAYLIST || "37i9dQZF1DXa2PvUpywmOO";

  return (
    <div className="w-full max-w-xl mx-auto mt-8 bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl overflow-hidden transition-all duration-300">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
        <span>Ambience · {phase === "STUDY" ? "Lo-Fi Study" : "Acoustic Break"}</span>
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
      <div className={cn("transition-all duration-500 overflow-hidden", collapsed ? "h-0 opacity-0" : "h-[152px] opacity-100")}>
        <iframe 
          key={url}
          className="w-full"
          src={`https://open.spotify.com/embed/playlist/${url}?utm_source=generator&theme=0`} 
          width="100%" 
          height="152" 
          frameBorder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy" 
        />
      </div>
    </div>
  );
}
