"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Copy, LoaderCircle, Mic, MicOff, Sparkles, Square, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { toSpeakableText } from "../../lib/utils/speech";
import { useSpeechRecognition } from "../../lib/hooks/useSpeechRecognition";
import type { DoubtEntry } from "../../lib/hooks/useJournalStore";
import { DrawerShell } from "../common/DrawerShell";
import MarkdownRenderer from "./MarkdownRenderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface DoubtSidebarProps {
  open: boolean;
  onClose: () => void;
  subject: string;
  onDoubtResolved: (entry: DoubtEntry) => void;
}

const STORAGE_KEY = "silofocus-doubts-v1";
const SUGGESTIONS = ["Explain this step by step", "Why does this formula work?", "Give me a practice problem"];

export function DoubtSidebar({ open, onClose, subject, onDoubtResolved }: DoubtSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [speaking, setSpeaking] = useState<{ index: number; loading: boolean } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const speechToken = useRef(0);
  const dictationBase = useRef("");

  const mic = useSpeechRecognition();

  // Restore the session's thread.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(
            parsed.filter(
              (m): m is Message =>
                !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
            ),
          );
        }
      }
    } catch {
      /* ignore corrupt session data */
    }
  }, []);

  useEffect(() => {
    if (streaming) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* storage unavailable */
    }
  }, [messages, streaming]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  // Dictation: live-write the transcript after whatever was typed before starting.
  useEffect(() => {
    if (!mic.transcript) return;
    const base = dictationBase.current;
    setInput(base + (base && !base.endsWith(" ") ? " " : "") + mic.transcript);
  }, [mic.transcript]);

  const stopSpeech = useCallback(() => {
    speechToken.current += 1;
    if (audioRef.current) {
      audioRef.current.audio.pause();
      URL.revokeObjectURL(audioRef.current.url);
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  useEffect(() => {
    if (!open) {
      stopSpeech();
      mic.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(
    () => () => {
      stopSpeech();
      abortRef.current?.abort();
    },
    [stopSpeech],
  );

  const send = async (override?: string) => {
    const question = (override ?? input).trim();
    if (!question || streaming) return;
    if (mic.listening) mic.stop();
    setInput("");
    dictationBase.current = "";

    const history = messages
      .filter((m) => !m.error && m.content.trim())
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let answer = "";
    let failed = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, subject, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "The tutor is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const snapshot = answer;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }
      answer += decoder.decode();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        if (!answer) setMessages((prev) => prev.slice(0, -1));
      } else {
        failed = true;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: message, error: true };
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
    if (!failed && answer.trim()) {
      onDoubtResolved({ subject, question, answeredAt: new Date().toISOString() });
    }
  };

  const speakWithBrowser = (text: string, index: number, token: number) => {
    if (token !== speechToken.current) return;
    if (!("speechSynthesis" in window)) {
      setSpeaking(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => token === speechToken.current && setSpeaking(null);
    utterance.onerror = () => token === speechToken.current && setSpeaking(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking({ index, loading: false });
  };

  const speak = async (index: number) => {
    if (speaking?.index === index) {
      stopSpeech();
      return;
    }
    stopSpeech();
    const text = toSpeakableText(messages[index]?.content ?? "");
    if (!text) return;
    const token = speechToken.current;
    setSpeaking({ index, loading: true });

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (token !== speechToken.current) return;
      if (res.ok && (res.headers.get("content-type") ?? "").includes("audio")) {
        const blob = await res.blob();
        if (token !== speechToken.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        const cleanup = () => {
          if (token !== speechToken.current) return;
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setSpeaking(null);
        };
        audio.onended = cleanup;
        audio.onerror = cleanup;
        audioRef.current = { audio, url };
        await audio.play();
        setSpeaking({ index, loading: false });
        return;
      }
      speakWithBrowser(text, index, token);
    } catch {
      speakWithBrowser(text, index, token);
    }
  };

  const copy = async (index: number) => {
    try {
      await navigator.clipboard.writeText(messages[index].content);
      setCopied(index);
      window.setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const toggleMic = () => {
    if (!mic.listening) dictationBase.current = input;
    mic.toggle();
  };

  const clear = () => {
    abortRef.current?.abort();
    stopSpeech();
    setMessages([]);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <DrawerShell open={open} side="right" title="Doubt solver" onClose={onClose}>
      <div className="flex items-center justify-between border-b border-edge/70 px-5 py-4">
        <div>
          <h2 className="text-xl font-medium">Doubt Solver</h2>
          <p className="max-w-[16rem] truncate text-xs text-subtle">{subject}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="icon-btn" onClick={clear} aria-label="Clear conversation" disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close doubt solver">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-5 py-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="h-6 w-6 text-glow" />
            <p className="max-w-[16rem] text-sm text-subtle">
              Dump a problem, type it or dictate it. Gemma 2 will walk through it step by step.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          return m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-ink/[0.07] px-4 py-3 text-sm text-ink">
              {m.content}
            </div>
          ) : (
            <div key={i} className="group max-w-full">
              {m.error ? (
                <p className="rounded-xl border border-edge/80 px-4 py-3 text-sm text-subtle">{m.content}</p>
              ) : m.content ? (
                <MarkdownRenderer content={m.content} />
              ) : (
                <div className="h-4 w-24 animate-shimmer rounded bg-gradient-to-r from-edge/40 via-edge to-edge/40 bg-[length:200%_100%]" />
              )}
              {streaming && isLast && m.content && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-glow align-middle" />}
              {!m.error && m.content && !(streaming && isLast) && (
                <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    className={cn("icon-btn h-8 w-8", speaking?.index === i && "text-glow opacity-100")}
                    onClick={() => void speak(i)}
                    aria-label={speaking?.index === i ? "Stop reading aloud" : "Read answer aloud"}
                    aria-pressed={speaking?.index === i}
                  >
                    {speaking?.index === i && speaking.loading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : speaking?.index === i ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <button type="button" className="icon-btn h-8 w-8" onClick={() => void copy(i)} aria-label="Copy answer">
                    {copied === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-edge/70 p-4">
        {mic.error && <p className="mb-2 text-xs text-subtle">{mic.error}</p>}
        <div className="flex items-end gap-2 rounded-2xl border border-edge/80 px-3 py-2 transition-colors duration-300 focus-within:border-glow">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              dictationBase.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={Math.min(6, Math.max(2, input.split("\n").length))}
            maxLength={4000}
            placeholder={mic.listening ? "Listening…" : "Ask a doubt…  (Enter to send)"}
            aria-label="Your question"
            className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm text-ink placeholder:text-subtle focus:outline-none"
          />
          <button
            type="button"
            className={cn("icon-btn shrink-0", mic.listening && "bg-glow/15 text-glow")}
            onClick={toggleMic}
            disabled={!mic.supported}
            aria-pressed={mic.listening}
            aria-label={mic.listening ? "Stop dictation" : "Start voice dictation"}
            title={mic.supported ? "Voice dictation" : "Voice dictation isn't supported in this browser"}
          >
            {mic.listening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
          </button>
          {streaming ? (
            <button type="button" className="btn-primary h-9 w-9 shrink-0 p-0" onClick={() => abortRef.current?.abort()} aria-label="Stop generating">
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button type="button" className="btn-primary h-9 w-9 shrink-0 p-0" onClick={() => void send()} disabled={!input.trim()} aria-label="Send question">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}
