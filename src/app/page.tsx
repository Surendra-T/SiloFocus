"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "../components/common/Header";
import { PomodoroTimer } from "../components/timer/PomodoroTimer";
import { Controls } from "../components/timer/Controls";
import { SpotifyEmbed } from "../components/audio/SpotifyEmbed";
import { DoubtSidebar } from "../components/chat/DoubtSidebar";
import { CheckInModal } from "../components/modals/CheckInModal";
import { InterceptorToast } from "../components/modals/InterceptorToast";
import { useIdle } from "../lib/hooks/useIdle";
import { Subject, SessionStats } from "../lib/db/models";
import { MessageSquareText } from "lucide-react";
import { formatClock } from "../lib/utils";

const STUDY_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

type Phase = "STUDY" | "CHECK_IN" | "BREAK";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("STUDY");
  const [subject, setSubject] = useState<Subject>("Physics");
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(STUDY_DURATION);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [nudgeState, setNudgeState] = useState<{ visible: boolean; text: string; wasRunning: boolean } | null>(null);

  const endsAtRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    const savedSubj = localStorage.getItem("silofocus-subject") as Subject;
    if (savedSubj) setSubject(savedSubj);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const playChime = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    } catch(e) {}
  };

  useEffect(() => {
    if (!isRunning) {
      endsAtRef.current = null;
      return;
    }
    
    if (!endsAtRef.current) {
      endsAtRef.current = Date.now() + remaining * 1000;
    }
    
    if (phase === "STUDY" && sessionStartTime === null) {
      setSessionStartTime(Date.now());
    }

    const interval = setInterval(() => {
      if (!endsAtRef.current) return;
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((endsAtRef.current - now) / 1000));
      setRemaining(diff);
      
      document.title = \\ · \ — SiloFocus\;

      if (diff === 0) {
        setIsRunning(false);
        playChime();
        if (phase === "STUDY") setPhase("CHECK_IN");
        else if (phase === "BREAK") { setPhase("STUDY"); setRemaining(STUDY_DURATION); }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, phase, remaining, subject, sessionStartTime]);

  useEffect(() => {
    if (!isRunning) document.title = "SiloFocus";
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) endsAtRef.current = null;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemaining(phase === "STUDY" ? STUDY_DURATION : BREAK_DURATION);
    endsAtRef.current = null;
    if (phase === "STUDY") setSessionStartTime(null);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (phase === "STUDY") {
       // if studied < 1 min, just go to break directly
       if (sessionStartTime && (Date.now() - sessionStartTime) < 60_000) {
         setPhase("BREAK");
         setRemaining(BREAK_DURATION);
       } else {
         setPhase("CHECK_IN");
       }
    } else {
       setPhase("STUDY");
       setRemaining(STUDY_DURATION);
    }
  };

  const handleCheckInSave = async (data: any) => {
    setPhase("BREAK");
    setRemaining(BREAK_DURATION);
    setSessionStartTime(null);
    setIsRunning(true);
    
    const actualDuration = STUDY_DURATION - remaining;
    
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subject, durationMinutes: Math.ceil(actualDuration / 60) })
      });
      fetchStats();
    } catch(e) { console.error(e); }
  };

  const handleCheckInSkip = () => {
    setPhase("BREAK");
    setRemaining(BREAK_DURATION);
    setSessionStartTime(null);
    setIsRunning(true);
  };

  const handleIdle = useCallback(async (idleSeconds: number, reason: string) => {
    if (nudgeState) return; // already showing
    const wasRunning = isRunning;
    setIsRunning(false); // pause immediately
    
    setNudgeState({ visible: true, text: "", wasRunning });
    
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idleTimeSeconds: idleSeconds, currentSubject: subject })
      });
      const data = await res.json();
      setNudgeState(prev => prev ? { ...prev, text: data.nudge || "Time to focus." } : null);
    } catch (e) {
      setNudgeState(prev => prev ? { ...prev, text: "You've been away for a moment. Let's lock back in." } : null);
    }
  }, [isRunning, subject, nudgeState]);

  useIdle({
    enabled: phase === "STUDY" && isRunning && !sidebarOpen,
    onIdle: handleIdle
  });

  const dismissNudge = (resume: boolean) => {
    if (!nudgeState) return;
    if (resume && nudgeState.wasRunning) {
      setIsRunning(true);
      // adjust endsAt so we don't jump time
      endsAtRef.current = Date.now() + remaining * 1000;
    }
    setNudgeState(null);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <Header subject={subject} streak={stats?.currentStreak || 0} />
      
      <main className="flex-1 max-w-xl mx-auto w-full px-6 flex flex-col pt-8">
        {phase === "STUDY" && !isRunning && remaining === STUDY_DURATION && (
          <div className="flex justify-center gap-4 mb-4 z-10">
            {["Physics", "Chemistry", "Mathematics"].map((s) => (
              <button 
                key={s} 
                onClick={() => { setSubject(s as Subject); localStorage.setItem("silofocus-subject", s); }}
                className={\px-4 py-1.5 rounded-full text-sm font-medium transition-colors \\}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <PomodoroTimer 
          remaining={remaining} 
          max={phase === "STUDY" ? STUDY_DURATION : BREAK_DURATION} 
          phase={phase} 
          subject={subject}
        />
        
        <div className="mt-8">
          <Controls 
            running={isRunning} 
            onToggle={toggleTimer} 
            onReset={resetTimer} 
            onSkip={handleSkip} 
            phase={phase} 
          />
        </div>

        <div className="mt-16 flex justify-center gap-8 text-center text-sm font-serif opacity-70">
          <div>
            <div className="text-xl tabular-nums">{stats?.totalHours.toFixed(1) || "0.0"}h</div>
            <div className="uppercase tracking-widest text-[10px]">Total</div>
          </div>
          <div>
            <div className="text-xl tabular-nums">{stats?.avgProductivity.toFixed(1) || "0.0"}</div>
            <div className="uppercase tracking-widest text-[10px]">Avg Prod</div>
          </div>
          <div>
            <div className="text-xl tabular-nums">{stats?.totalSessions || 0}</div>
            <div className="uppercase tracking-widest text-[10px]">Sessions</div>
          </div>
        </div>

        <SpotifyEmbed phase={phase === "STUDY" ? "STUDY" : "BREAK"} />
      </main>

      <button 
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-8 right-8 bg-alabaster dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-full p-4 hover:scale-105 transition-transform"
      >
        <MessageSquareText className="w-6 h-6 text-racing-400" />
      </button>

      <DoubtSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} subject={subject} />
      
      {phase === "CHECK_IN" && <CheckInModal onSave={handleCheckInSave} onSkip={handleCheckInSkip} />}
      
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
