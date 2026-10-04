import { X, Copy, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { cn } from "../../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function DoubtSidebar({ open, onClose, subject }: { open: boolean; onClose: () => void; subject: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const msg = input;
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: msg }];
    setMessages(newHistory);
    setStreaming(true);

    abortCtrlRef.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, subject, history: messages }),
        signal: abortCtrlRef.current.signal
      });

      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: answer }];
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to local tutor." }]);
      }
    } finally {
      setStreaming(false);
      abortCtrlRef.current = null;
    }
  };

  return (
    <div className={cn("fixed inset-y-0 right-0 w-full sm:w-[440px] bg-alabaster dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 shadow-2xl transition-transform duration-500 ease-silk z-50 flex flex-col", open ? "translate-x-0" : "translate-x-full")}>
      <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
        <h2 className="font-serif text-lg">Doubt Solver</h2>
        <div className="flex gap-2">
          <button onClick={() => setMessages([])} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full"><Trash2 className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={cn("max-w-[90%]", m.role === "user" ? "ml-auto bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 p-3 rounded-2xl rounded-tr-sm" : "mr-auto text-stone-800 dark:text-stone-200")}>
            {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <div className="whitespace-pre-wrap">{m.content}</div>}
          </div>
        ))}
        {streaming && <div className="w-2 h-4 bg-brass animate-pulse" />}
      </div>
      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a doubt... (Enter to send)"
          className="w-full bg-transparent border border-stone-300 dark:border-stone-700 rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-racing"
          rows={3}
        />
        {streaming && (
          <button onClick={() => abortCtrlRef.current?.abort()} className="mt-2 text-sm text-red-500">Stop Generation</button>
        )}
      </div>
    </div>
  );
}
