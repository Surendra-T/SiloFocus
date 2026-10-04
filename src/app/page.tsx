"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Header } from "../components/common/Header";
import { PomodoroTimer } from "../components/timer/PomodoroTimer";
import { Controls } from "../components/timer/Controls";
import { TodoList } from "../components/tasks/TodoList";
import { SpotifyEmbed } from "../components/audio/SpotifyEmbed";
import { AmbientSoundControls } from "../components/audio/AmbientSoundControls";
import { DoubtSidebar } from "../components/chat/DoubtSidebar";
import { FormulaDrawer } from "../components/chat/FormulaDrawer";
import { CheckInModal } from "../components/modals/CheckInModal";
import { SocraticModal } from "../components/modals/SocraticModal";
import { ExecutiveBriefModal } from "../components/modals/ExecutiveBriefModal";
import { InterceptorToast } from "../components/modals/InterceptorToast";
import { SettingsPanel } from "../components/common/SettingsPanel";
import { CommandPalette, type PaletteCommand } from "../components/common/CommandPalette";
import { GrainOverlay } from "../components/common/GrainOverlay";

import { useSettingsStore, setSubject } from "../lib/hooks/useSettingsStore";
import { useThemeStore } from "../lib/hooks/useThemeStore";
import { useTasksStore } from "../lib/hooks/useTasksStore";
import { useJournalToday, journalStore } from "../lib/hooks/useJournalStore";
import { downloadJournal } from "../lib/utils/exportJournal";
import { soundEngine } from "../lib/audio/soundEngine";
import { useTimer, type TickInfo } from "../lib/hooks/useTimer";
import { useIdle } from "../lib/hooks/useIdle";
import { useDynamicFavicon } from "../lib/hooks/useDynamicFavicon";
import { MessageSquareText, Sigma, Minimize2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function Home() {
  const { settings, update: updateSettings } = useSettingsStore();
  const theme = useThemeStore();
  const tasks = useTasksStore();
  const todayJournal = useJournalToday();

  // Dialog and drawer state
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Interceptor and reflection state
  const [nudgeState, setNudgeState] = useState<{ visible: boolean; text: string; wasRunning: boolean } | null>(null);
  const [socraticActive, setSocraticActive] = useState(false);
  const [streak, setStreak] = useState(0);

  // Sync sound engine levels
  useEffect(() => {
    soundEngine.configure({
      muted: settings.muted,
      masterVolume: settings.masterVolume,
      tickVolume: settings.tickVolume,
      chimeVolume: settings.chimeVolume,
    });
  }, [settings.muted, settings.masterVolume, settings.tickVolume, settings.chimeVolume]);

  // Fetch streak from /api/sessions
  const fetchStreak = useCallback(async () => {
    try {
      const tz = new Date().getTimezoneOffset();
      const res = await fetch(`/api/sessions?tz=${tz}`);
      if (res.ok) {
        const data = await res.json();
        setStreak(data.currentStreak || 0);
      }
    } catch {
      // offline / failure handled gracefully
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Timer callbacks
  const handleTick = useCallback(
    (info: TickInfo) => {
      if (info.phase === "STUDY" && settings.tickPreset !== "off") {
        soundEngine.tick(settings.tickPreset);
      }
    },
    [settings.tickPreset],
  );

  const handleStudyComplete = useCallback(() => {
    soundEngine.chime(settings.chimePreset);
    if (settings.socratic) {
      setSocraticActive(true);
    }
  }, [settings.chimePreset, settings.socratic]);

  const handleBreakComplete = useCallback(() => {
    soundEngine.chime(settings.chimePreset);
  }, [settings.chimePreset]);

  // Main timer engine
  const timer = useTimer(
    {
      studyMin: settings.studyMin,
      breakMin: settings.breakMin,
      flow: settings.flow,
    },
    {
      onTick: handleTick,
      onStudyComplete: handleStudyComplete,
      onBreakComplete: handleBreakComplete,
    },
  );

  // Dynamic favicon & tab title
  useDynamicFavicon({
    seconds: timer.seconds,
    progress: timer.progress,
    subject: settings.subject,
    running: timer.running,
  });

  // Idle and tab-abandonment interceptor
  const handleIdle = useCallback(
    async (idleSeconds: number) => {
      if (nudgeState) return;
      const wasRunning = timer.running;
      timer.pause();
      setNudgeState({ visible: true, text: "", wasRunning });

      try {
        const res = await fetch("/api/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idleTimeSeconds: idleSeconds, currentSubject: settings.subject }),
        });
        const data = await res.json();
        setNudgeState((prev) => (prev ? { ...prev, text: data.nudge || "Time to refocus." } : null));
      } catch {
        setNudgeState((prev) =>
          prev ? { ...prev, text: "You've been away for a moment. Let's finish what we started." } : null,
        );
      }
    },
    [timer, settings.subject, nudgeState],
  );

  useIdle({
    enabled: timer.phase === "STUDY" && timer.running && !doubtOpen && !formulaOpen,
    onIdle: handleIdle,
  });

  const dismissNudge = (resume: boolean) => {
    if (!nudgeState) return;
    if (resume && nudgeState.wasRunning) {
      soundEngine.unlock();
      timer.start();
    }
    setNudgeState(null);
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Zen mode 'F')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setZenMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Save session to MongoDB & journal store
  const handleCheckInSave = async (data: { moodScore: number; productivityScore: number; notes: string }) => {
    const minutes = Math.max(1, Math.round(timer.lastStudySec / 60));
    timer.startBreak({ autoStart: true });

    // Save locally to journal immediately
    journalStore.addFocusBlock({
      subject: settings.subject,
      minutes,
      completedAt: new Date().toISOString(),
      mood: data.moodScore,
      productivity: data.productivityScore,
      notes: data.notes,
    });

    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: settings.subject,
          durationMinutes: minutes,
          moodScore: data.moodScore,
          productivityScore: data.productivityScore,
          notes: data.notes,
        }),
      });
      fetchStreak();
    } catch (err) {
      console.error("Failed to persist session to database", err);
    }
  };

  const handleCheckInSkip = () => {
    timer.startBreak({ autoStart: true });
  };

  // Export journal handler
  const handleExportJournal = () => {
    downloadJournal(todayJournal, tasks);
  };

  // Commands for spotlight palette
  const commands: PaletteCommand[] = useMemo(
    () => [
      {
        id: "timer-toggle",
        title: timer.running ? "Pause Timer" : "Start Timer",
        group: "Timer",
        shortcut: "Space",
        run: () => {
          soundEngine.unlock();
          timer.toggle();
        },
      },
      {
        id: "timer-reset",
        title: "Reset Timer",
        group: "Timer",
        run: () => timer.reset(),
      },
      {
        id: "timer-study",
        title: "Switch to Study Mode",
        group: "Timer",
        run: () => timer.startStudy(false),
      },
      {
        id: "timer-break",
        title: "Switch to Break Mode",
        group: "Timer",
        run: () => timer.startBreak({ autoStart: false }),
      },
      {
        id: "toggle-flow",
        title: settings.flow ? "Disable Flowmodoro (Countdown)" : "Enable Flowmodoro (Count-up)",
        group: "Timer",
        run: () => updateSettings({ flow: !settings.flow }),
      },
      {
        id: "toggle-zen",
        title: zenMode ? "Exit Zen Mode" : "Enter Monastic Zen Mode",
        group: "View",
        shortcut: "F",
        run: () => setZenMode((prev) => !prev),
      },
      {
        id: "open-brief",
        title: "Open Executive Intel Brief",
        group: "Insights",
        run: () => setBriefOpen(true),
      },
      {
        id: "open-formulas",
        title: "Open Formula Sheet",
        group: "Study Tools",
        run: () => setFormulaOpen(true),
      },
      {
        id: "open-doubts",
        title: "Open Doubt Solver",
        group: "Study Tools",
        run: () => setDoubtOpen(true),
      },
      {
        id: "export-journal",
        title: "Export Daily Journal (Markdown)",
        group: "Workspace",
        run: handleExportJournal,
      },
      {
        id: "open-settings",
        title: "Open Settings",
        group: "Workspace",
        run: () => setSettingsOpen(true),
      },
      // Palettes
      {
        id: "palette-heritage",
        title: "Palette: Old Money Heritage",
        group: "Appearance",
        run: () => theme.setPalette("heritage"),
      },
      {
        id: "palette-dark-academia",
        title: "Palette: Dark Academia",
        group: "Appearance",
        run: () => theme.setPalette("dark-academia"),
      },
      {
        id: "palette-wabi-sabi",
        title: "Palette: Kyoto Wabi-Sabi",
        group: "Appearance",
        run: () => theme.setPalette("wabi-sabi"),
      },
      {
        id: "palette-nordic",
        title: "Palette: Nordic Mono",
        group: "Appearance",
        run: () => theme.setPalette("nordic"),
      },
      {
        id: "palette-obsidian",
        title: "Palette: Midnight Obsidian",
        group: "Appearance",
        run: () => theme.setPalette("obsidian"),
      },
      // Topologies
      {
        id: "topo-radial",
        title: "Topology: Editorial Radial",
        group: "Timepiece",
        run: () => updateSettings({ topology: "radial" }),
      },
      {
        id: "topo-flip",
        title: "Topology: Split-Flap Clock",
        group: "Timepiece",
        run: () => updateSettings({ topology: "flip" }),
      },
      {
        id: "topo-analog",
        title: "Topology: Bauhaus Analog",
        group: "Timepiece",
        run: () => updateSettings({ topology: "analog" }),
      },
      {
        id: "topo-linear",
        title: "Topology: Linear Pillar",
        group: "Timepiece",
        run: () => updateSettings({ topology: "linear" }),
      },
    ],
    [timer, settings.flow, zenMode, theme, updateSettings],
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-glow/20">
      <GrainOverlay enabled={theme.grain} />

      {/* Monastic Zen Mode overlay exit button */}
      {zenMode && (
        <button
          type="button"
          onClick={() => setZenMode(false)}
          className="fixed top-6 right-6 z-50 btn-ghost bg-canvas/80 backdrop-blur-md shadow-sm gap-2"
          aria-label="Exit Zen Mode (F)"
        >
          <Minimize2 className="h-4 w-4" />
          <span>Exit Zen (F)</span>
        </button>
      )}

      {/* Standard Header (fades out during Zen Mode) */}
      <div
        className={cn(
          "transition-opacity duration-500",
          zenMode ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        <Header
          subject={settings.subject}
          recentSubjects={settings.recentSubjects}
          streak={streak}
          palette={theme.palette}
          onSubjectChange={(subj) => setSubject(subj)}
          onPaletteChange={(pal) => theme.setPalette(pal)}
          onToggleZen={() => setZenMode(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenBrief={() => setBriefOpen(true)}
          onOpenFormulas={() => setFormulaOpen(true)}
          onOpenPalette={() => setCommandPaletteOpen(true)}
        />
      </div>

      {/* Main Focus Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 w-full max-w-2xl mx-auto">
        {/* Timepiece & Controls */}
        <div
          className={cn(
            "w-full flex flex-col items-center transition-all duration-500 ease-silk",
            zenMode ? "my-auto scale-110 sm:scale-125" : "my-0",
          )}
        >
          <PomodoroTimer
            seconds={timer.seconds}
            progress={timer.progress}
            phase={timer.phase}
            running={timer.running}
            flow={timer.flowStudy}
            topology={settings.topology}
            onTopologyChange={zenMode ? undefined : (t) => updateSettings({ topology: t })}
          />

          <div className="mt-6 w-full">
            <Controls
              phase={timer.phase}
              running={timer.running}
              flow={settings.flow}
              studyMin={settings.studyMin}
              breakMin={settings.breakMin}
              onToggle={() => {
                soundEngine.unlock();
                timer.toggle();
              }}
              onReset={() => timer.reset()}
              onTakeMoment={() => {
                soundEngine.unlock();
                if (timer.phase === "STUDY") {
                  if (timer.getElapsedSec() >= 60) {
                    timer.enterCheckIn();
                    handleStudyComplete();
                  } else {
                    timer.startBreak({ autoStart: true });
                  }
                } else {
                  timer.startStudy(false);
                }
              }}
              onDurationsChange={(s, b) => updateSettings({ studyMin: s, breakMin: b })}
              onFlowChange={(f) => updateSettings({ flow: f })}
            />
          </div>
        </div>

        {/* Ancillary Panels (Hidden during Zen mode) */}
        <div
          className={cn(
            "w-full space-y-6 mt-12 transition-all duration-500",
            zenMode ? "opacity-0 pointer-events-none translate-y-8" : "opacity-100 translate-y-0",
          )}
        >
          <TodoList />
          <AmbientSoundControls />
          <SpotifyEmbed phase={timer.phase === "STUDY" ? "STUDY" : "BREAK"} />
        </div>
      </main>

      {/* Floating Action Buttons for Drawers (Hidden in Zen mode) */}
      {!zenMode && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-30">
          <button
            type="button"
            onClick={() => setFormulaOpen(true)}
            className="btn-ghost bg-canvas/90 shadow-glow rounded-full p-3.5 border-edge/80 hover:border-glow hover:scale-105"
            aria-label="Open formula drawer"
            title="Formula Sheet"
          >
            <Sigma className="h-5 w-5 text-glow" />
          </button>
          <button
            type="button"
            onClick={() => setDoubtOpen(true)}
            className="btn-primary shadow-glow rounded-full p-3.5 hover:scale-105"
            aria-label="Open doubt solver"
            title="Ask a Doubt"
          >
            <MessageSquareText className="h-5 w-5 text-onaccent" />
          </button>
        </div>
      )}

      {/* Drawers */}
      <FormulaDrawer
        open={formulaOpen && !zenMode}
        onClose={() => setFormulaOpen(false)}
        subject={settings.subject}
      />
      <DoubtSidebar
        open={doubtOpen && !zenMode}
        onClose={() => setDoubtOpen(false)}
        subject={settings.subject}
        onDoubtResolved={(doubt) => journalStore.addDoubt(doubt)}
      />

      {/* Modals & Dialogs */}
      {timer.phase === "CHECK_IN" && (
        <CheckInModal onSave={handleCheckInSave} onSkip={handleCheckInSkip} />
      )}

      <SocraticModal
        open={socraticActive}
        subject={settings.subject}
        onComplete={() => setSocraticActive(false)}
      />

      <ExecutiveBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onExportJournal={handleExportJournal}
      />

      <CommandPalette
        open={commandPaletteOpen}
        commands={commands}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Procrastination Interceptor Toast */}
      {nudgeState && nudgeState.visible && (
        <InterceptorToast
          nudge={nudgeState.text}
          onResume={() => dismissNudge(true)}
          onDismiss={() => dismissNudge(false)}
        />
      )}
    </div>
  );
}
