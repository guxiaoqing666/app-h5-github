import type { Checkin, StudyTask } from "../types";

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return todayKey(date);
}

export function formatDateCN(dateKey: string | null) {
  if (!dateKey) return "待官方确认";
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function daysUntil(dateKey: string | null) {
  if (!dateKey) return null;
  const start = new Date(`${todayKey()}T00:00:00`).getTime();
  const target = new Date(`${dateKey}T00:00:00`).getTime();
  return Math.ceil((target - start) / 86_400_000);
}

export function isThisWeek(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = current.getDay() || 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return date >= monday && date <= sunday;
}

export function calculateStreak(checkins: Checkin[]) {
  const dates = new Set(checkins.map((item) => item.checkin_date));
  let cursor = todayKey();
  let streak = 0;

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function completedMinutes(tasks: StudyTask[]) {
  return tasks
    .filter((task) => task.status === "done")
    .reduce((sum, task) => sum + task.duration_minutes, 0);
}
