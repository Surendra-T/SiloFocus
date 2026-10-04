import { Subject } from "../../lib/db/models";
import { cn } from "../../lib/utils";
import { useTheme } from "../../lib/hooks/useTheme";
import { Moon, Sun, Flame } from "lucide-react";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme" className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
      <Sun className={cn("absolute w-5 h-5 transition-transform duration-500 ease-silk", theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
      <Moon className={cn("absolute w-5 h-5 transition-transform duration-500 ease-silk", theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0")} />
    </button>
  );
}

export function Header({ subject, streak }: { subject: Subject; streak: number }) {
  return (
    <header className="flex items-center justify-between py-6 px-8 border-b border-stone-200/50 dark:border-stone-800/50 mb-8">
      <div className="flex items-center gap-6">
        <h1 className="font-serif text-2xl tracking-tight font-medium">SiloFocus</h1>
        <div className="h-4 w-px bg-brass-light dark:bg-brass-dark" />
        <div className="flex gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-200/50 dark:bg-stone-800/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-racing-400"></span>
            {subject}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-200/50 dark:bg-stone-800/50 flex items-center gap-1 text-brass-dark dark:text-brass-light">
            <Flame className="w-3.5 h-3.5" />
            {streak}-day streak
          </span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
