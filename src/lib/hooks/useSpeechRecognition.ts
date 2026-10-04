"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => RecognitionInstance;

function getConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser to dictate.",
  "service-not-allowed": "Speech recognition is not permitted in this browser.",
  "no-speech": "No speech detected. Try again.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs a network connection.",
};

/** Thin wrapper over the Web Speech API (SpeechRecognition / webkitSpeechRecognition). */
export function useSpeechRecognition(lang?: string) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  useEffect(() => {
    setSupported(getConstructor() !== null);
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getConstructor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = lang ?? (typeof navigator !== "undefined" ? navigator.language : "en-US");
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setTranscript(text.trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(ERROR_MESSAGES[event.error] ?? `Speech error: ${event.error}`);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    setTranscript("");
    setError(null);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError("Could not start voice dictation.");
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  return { supported, listening, transcript, error, start, stop, toggle };
}
