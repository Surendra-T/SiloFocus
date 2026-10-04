import type { DayLog } from "../hooks/useJournalStore";
import { localDateKey } from "../hooks/useJournalStore";
import type { TaskItem } from "../hooks/useTasksStore";

const cell = (value: string | number | undefined): string =>
  value === undefined || value === "" ? "–" : String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

function sameLocalDay(timestamp: number, key: string): boolean {
  return localDateKey(new Date(timestamp)) === key;
}

/** Compiles the day's focus blocks, tasks and resolved doubts into a markdown document. */
export function buildJournalMarkdown(dateKey: string, day: DayLog, tasks: TaskItem[]): string {
  const totalMinutes = day.blocks.reduce((sum, b) => sum + b.minutes, 0);
  const completedToday = tasks.filter((t) => t.done && t.completedAt !== undefined && sameLocalDay(t.completedAt, dateKey));
  const open = tasks.filter((t) => !t.done);

  const lines: string[] = [`# SiloFocus Daily Journal - ${dateKey}`, ""];

  lines.push("## Summary", "");
  lines.push(`- **Focus blocks completed:** ${day.blocks.length}`);
  lines.push(`- **Total study minutes:** ${totalMinutes} (${(totalMinutes / 60).toFixed(1)} h)`);
  lines.push(`- **Tasks completed:** ${completedToday.length}`);
  lines.push(`- **Doubts resolved:** ${day.doubts.length}`, "");

  lines.push("## Focus Blocks", "");
  if (day.blocks.length === 0) {
    lines.push("_No focus blocks completed yet._", "");
  } else {
    lines.push("| Time | Subject | Minutes | Mood | Productivity | Notes |", "| --- | --- | ---: | ---: | ---: | --- |");
    for (const b of day.blocks) {
      const time = new Date(b.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      lines.push(`| ${time} | ${cell(b.subject)} | ${b.minutes} | ${cell(b.mood)} | ${cell(b.productivity)} | ${cell(b.notes)} |`);
    }
    lines.push("");
  }

  lines.push("## Tasks", "");
  if (completedToday.length === 0 && open.length === 0) {
    lines.push("_No tasks recorded._", "");
  } else {
    for (const t of completedToday) lines.push(`- [x] ${t.text}`);
    for (const t of open) lines.push(`- [ ] ${t.text}`);
    lines.push("");
  }

  lines.push("## Doubts Resolved", "");
  if (day.doubts.length === 0) {
    lines.push("_No doubts asked today._", "");
  } else {
    day.doubts.forEach((d, i) => lines.push(`${i + 1}. **${d.subject}** — ${d.question.replace(/\s+/g, " ").trim()}`));
    lines.push("");
  }

  return lines.join("\n");
}

/** Builds the journal and triggers a client-side .md download. */
export function downloadJournal(day: DayLog, tasks: TaskItem[], dateKey: string = localDateKey()): void {
  const markdown = buildJournalMarkdown(dateKey, day, tasks);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `SiloFocus Daily Journal - ${dateKey}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
