"use client";

import { useEffect, useState } from "react";
import { BarChart3, LoaderCircle, RefreshCw, X } from "lucide-react";
import { ModalShell } from "../common/ModalShell";
import MarkdownRenderer from "../chat/MarkdownRenderer";
import type { IntelMetrics } from "../../lib/db/analytics";

interface ExecutiveBriefModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExecutiveBriefModal({ open, onClose }: ExecutiveBriefModalProps) {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<IntelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/intel?tz=${tzOffset}`);
      if (!res.ok) {
        throw new Error("Could not retrieve weekly intelligence summary.");
      }
      const data = await res.json();
      setBrief(data.brief);
      setMetrics(data.metrics);
    } catch (err: any) {
      setError(err?.message || "Failed to load executive brief.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !brief && !loading) {
      fetchBrief();
    }
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose} title="Executive Intel Brief" className="max-w-2xl">
      <div className="flex items-center justify-between border-b border-edge/70 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-glow" />
          <div>
            <h2 className="text-xl font-medium">Executive Intel Brief</h2>
            <p className="text-xs text-subtle">Weekly performance analysis & cognitive bottlenecks</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icon-btn"
            onClick={fetchBrief}
            disabled={loading}
            aria-label="Refresh analysis"
            title="Re-analyze"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto px-6 py-6 space-y-6">
        {metrics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-edge/60 bg-ink/[0.02] p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Total Focus</div>
              <div className="font-serif text-xl font-semibold text-ink">
                {(metrics.totalMinutes / 60).toFixed(1)}h
              </div>
            </div>
            <div className="rounded-xl border border-edge/60 bg-ink/[0.02] p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Sessions</div>
              <div className="font-serif text-xl font-semibold text-ink">{metrics.totalSessions}</div>
            </div>
            <div className="rounded-xl border border-edge/60 bg-ink/[0.02] p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Avg Productivity</div>
              <div className="font-serif text-xl font-semibold text-ink">
                {metrics.avgProductivity}/10
              </div>
            </div>
            <div className="rounded-xl border border-edge/60 bg-ink/[0.02] p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Peak Window</div>
              <div className="font-serif text-xl font-semibold capitalize text-ink">
                {metrics.peakWindow || "—"}
              </div>
            </div>
          </div>
        )}

        {loading && !brief && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-glow mb-3" />
            <p className="text-sm font-medium text-ink">Synthesizing weekly telemetry...</p>
            <p className="text-xs text-subtle mt-1">Gemma 2 is evaluating habits and time-of-day momentum</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-edge/80 bg-oxblood/10 p-4 text-sm text-ink">
            {error}
          </div>
        )}

        {brief && !loading && (
          <div className="rounded-2xl border border-edge/70 bg-panel/50 p-6 shadow-sm">
            <MarkdownRenderer content={brief} />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
