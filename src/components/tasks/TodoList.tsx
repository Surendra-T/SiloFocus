"use client";

import { useState } from "react";
import { Check, ChevronUp, ChevronDown, Trash2, Plus, ListTodo } from "lucide-react";
import { tasksStore, useTasksStore, type TaskItem } from "../../lib/hooks/useTasksStore";
import { cn } from "../../lib/utils";

export function TodoList() {
  const tasks = useTasksStore();
  const [newText, setNewText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const added = tasksStore.add(newText.trim());
    if (added) setNewText("");
  };

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <section className="card p-5 space-y-4" aria-label="Task Checklist">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-glow" />
          <h2 className="eyebrow">Session Objectives</h2>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span>
              {completedCount} of {tasks.length} completed
            </span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => tasksStore.clearCompleted()}
                className="hover:text-ink transition-colors underline underline-offset-2"
              >
                Clear completed
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="relative flex items-center">
        <Plus className="absolute left-3.5 h-4 w-4 text-subtle pointer-events-none" />
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add a new objective... (press Enter)"
          className="field pl-9 pr-4 py-2 text-sm bg-panel/40"
        />
      </form>

      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <p className="text-center py-5 text-xs text-subtle italic">
            No active objectives. Define 2-3 targets for this focus block.
          </p>
        )}

        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-ink/[0.03] transition-colors"
          >
            <button
              type="button"
              onClick={() => tasksStore.toggle(task.id)}
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
                task.done
                  ? "border-accent bg-accent text-onaccent"
                  : "border-edge/80 hover:border-glow bg-transparent",
              )}
              aria-label={task.done ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.done && <Check className="h-3 w-3 stroke-[3]" />}
            </button>

            <span
              className={cn(
                "flex-1 text-sm text-ink select-none transition-all duration-300",
                task.done && "line-through text-subtle opacity-60",
              )}
            >
              {task.text}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => tasksStore.move(task.id, -1)}
                disabled={idx === 0}
                aria-label="Move task up"
                className="icon-btn h-6 w-6 disabled:opacity-20"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => tasksStore.move(task.id, 1)}
                disabled={idx === tasks.length - 1}
                aria-label="Move task down"
                className="icon-btn h-6 w-6 disabled:opacity-20"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => tasksStore.remove(task.id)}
                aria-label="Delete task"
                className="icon-btn h-6 w-6 hover:text-oxblood"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
