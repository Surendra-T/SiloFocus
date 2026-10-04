"use client";

import { createPersistentStore } from "../store/createPersistentStore";

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
}

interface TasksState {
  tasks: TaskItem[];
}

export const MAX_TASKS = 100;
export const MAX_TASK_LENGTH = 200;

function isTask(value: unknown): value is TaskItem {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === "string" && typeof t.text === "string" && typeof t.done === "boolean" && typeof t.createdAt === "number";
}

const store = createPersistentStore<TasksState>("silofocus-tasks-v1", { tasks: [] }, (raw) => ({
  tasks: Array.isArray(raw.tasks) ? raw.tasks.filter(isTask).slice(0, MAX_TASKS) : [],
}));

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const tasksStore = {
  get: () => store.get().tasks,
  add(text: string): boolean {
    const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_TASK_LENGTH);
    if (!clean || store.get().tasks.length >= MAX_TASKS) return false;
    store.set((s) => ({ tasks: [...s.tasks, { id: newId(), text: clean, done: false, createdAt: Date.now() }] }));
    return true;
  },
  toggle(id: string) {
    store.set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: t.done ? undefined : Date.now() } : t,
      ),
    }));
  },
  edit(id: string, text: string) {
    const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_TASK_LENGTH);
    if (!clean) return;
    store.set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, text: clean } : t)) }));
  },
  remove(id: string) {
    store.set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  move(id: string, direction: -1 | 1) {
    store.set((s) => {
      const index = s.tasks.findIndex((t) => t.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= s.tasks.length) return {};
      const next = [...s.tasks];
      [next[index], next[target]] = [next[target], next[index]];
      return { tasks: next };
    });
  },
  clearCompleted() {
    store.set((s) => ({ tasks: s.tasks.filter((t) => !t.done) }));
  },
};

export function useTasksStore(): TaskItem[] {
  return store.useStore().tasks;
}
