"use client";

import { useEffect, useState } from "react";
import { Brain, ArrowRight, LoaderCircle, CheckCircle2, X } from "lucide-react";
import { ModalShell } from "../common/ModalShell";

interface SocraticModalProps {
  open: boolean;
  subject: string;
  onComplete: () => void;
}

export function SocraticModal({ open, subject, onComplete }: SocraticModalProps) {
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuestion(null);
      setAnswer("");
      setFeedback(null);
      setError(null);
      loadQuestion();
    }
  }, [open, subject]);

  const loadQuestion = async () => {
    setLoadingQuestion(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      if (!res.ok) throw new Error("Could not formulate a challenge question.");
      const data = await res.json();
      setQuestion(data.question);
    } catch (err: any) {
      setError(err?.message || "Active recall generation failed.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || evaluating || !question) return;

    setEvaluating(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          subject,
          question,
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      setFeedback(data.evaluation || "Great work committing to an answer.");
    } catch (err) {
      setFeedback("Thought captured. Active recall consolidated.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onComplete}
      title="Socratic Active Recall"
      className="max-w-lg"
      closeOnOverlay={false}
    >
      <div className="flex items-center justify-between border-b border-edge/70 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 text-glow" />
          <div>
            <h2 className="text-xl font-medium">Active Recall Check</h2>
            <p className="text-xs text-subtle">30-second consolidation for {subject}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-medium text-subtle hover:text-ink transition-colors"
        >
          Skip to Break
        </button>
      </div>

      <div className="p-6 space-y-5">
        {loadingQuestion && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <LoaderCircle className="h-7 w-7 animate-spin text-glow mb-3" />
            <p className="text-sm font-medium text-ink">Formulating Socratic challenge...</p>
            <p className="text-xs text-subtle mt-1">Retrieval practice boosts long-term retention by 50%</p>
          </div>
        )}

        {error && (
          <div className="space-y-4 text-center py-6">
            <p className="text-sm text-subtle">{error}</p>
            <button type="button" onClick={onComplete} className="btn-primary">
              Proceed to Break
            </button>
          </div>
        )}

        {question && !feedback && (
          <form onSubmit={submitAnswer} className="space-y-4">
            <div className="rounded-xl border border-edge/70 bg-ink/[0.02] p-4">
              <p className="eyebrow mb-1">Challenge Question</p>
              <p className="font-serif text-lg font-medium text-ink leading-relaxed">
                {question}
              </p>
            </div>

            <div>
              <label htmlFor="socratic-answer" className="sr-only">
                Your Answer
              </label>
              <textarea
                id="socratic-answer"
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain in 1 or 2 concise sentences..."
                className="field resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onComplete}
                className="btn-ghost"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={!answer.trim() || evaluating}
                className="btn-primary"
              >
                {evaluating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    Submit Recall
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {feedback && (
          <div className="space-y-5 py-2 animate-rise">
            <div className="flex items-start gap-3 rounded-xl border border-edge/80 bg-accent/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="eyebrow mb-1">Mentor Evaluation</p>
                <p className="font-serif text-base text-ink leading-relaxed">{feedback}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onComplete}
                className="btn-primary min-w-36"
              >
                Enjoy Your Break
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
