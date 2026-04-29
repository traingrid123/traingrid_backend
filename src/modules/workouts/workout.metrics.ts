import { WeekDay, WorkoutLog } from "@prisma/client";
import dayjs from "dayjs";

function ratio(completed: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((completed / total) * 100).toFixed(2));
}

function computeCurrentStreak(dates: Date[]) {
  if (!dates.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(dates.map((value) => dayjs(value).format("YYYY-MM-DD")))
  ).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());

  let streak = 0;
  let cursor = dayjs();

  for (const entry of uniqueDays) {
    const diff = cursor.startOf("day").diff(dayjs(entry).startOf("day"), "day");
    if (diff === 0 || diff === 1 || (streak === 0 && diff === 1)) {
      streak += 1;
      cursor = dayjs(entry);
      continue;
    }
    break;
  }

  return streak;
}

function computeLongestStreak(dates: Date[]) {
  if (!dates.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(dates.map((value) => dayjs(value).format("YYYY-MM-DD")))
  ).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = dayjs(uniqueDays[index - 1]);
    const currentDay = dayjs(uniqueDays[index]);
    if (currentDay.diff(previous, "day") === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function toWeekDay(value: dayjs.Dayjs): WeekDay {
  return value.format("dddd").toUpperCase() as WeekDay;
}

export function estimateAssignedWorkouts(params: {
  startDate: Date;
  workoutDays: Array<{ dayOfWeek: WeekDay | null; isRestDay: boolean }>;
  now?: Date;
}) {
  const nonRestDays = params.workoutDays.filter((day) => !day.isRestDay);
  if (!nonRestDays.length) {
    return 0;
  }

  const now = dayjs(params.now ?? new Date()).endOf("day");
  const start = dayjs(params.startDate).startOf("day");

  if (now.isBefore(start)) {
    return 0;
  }

  const hasExplicitWeekdays = nonRestDays.some((day) => Boolean(day.dayOfWeek));
  if (!hasExplicitWeekdays) {
    const weeks = Math.max(1, now.diff(start, "week") + 1);
    return weeks * nonRestDays.length;
  }

  const scheduledWeekdays = new Set(
    nonRestDays
      .map((day) => day.dayOfWeek)
      .filter((value): value is WeekDay => Boolean(value))
  );

  let assigned = 0;
  let cursor = start;
  while (cursor.isBefore(now) || cursor.isSame(now, "day")) {
    if (scheduledWeekdays.has(toWeekDay(cursor))) {
      assigned += 1;
    }
    cursor = cursor.add(1, "day");
  }

  return assigned;
}

export function computeWorkoutMetrics(
  logs: Array<
    WorkoutLog & { workoutDay: { title: string | null; dayOfWeek: WeekDay | null } | null }
  >,
  assignedWorkouts: number
) {
  const sorted = [...logs].sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
  const completed = sorted.filter((item) => item.isCompleted);
  const completedDates = completed.map((item) => item.loggedAt);
  const skippedTypes = new Map<string, number>();
  sorted
    .filter((item) => !item.isCompleted)
    .forEach((item) => {
      const key = item.workoutDay?.title?.trim() || "General workout";
      skippedTypes.set(key, (skippedTypes.get(key) ?? 0) + 1);
    });

  const missedCount = Math.max(0, assignedWorkouts - completed.length);
  const weeklyFrequency = completed.filter((item) =>
    dayjs(item.loggedAt).isAfter(dayjs().subtract(7, "day"))
  ).length;

  return {
    completionPercent: ratio(completed.length, assignedWorkouts),
    assignedWorkouts,
    completedWorkouts: completed.length,
    missedWorkouts: missedCount,
    weeklyFrequency,
    currentStreak: computeCurrentStreak(completedDates),
    longestStreak: computeLongestStreak(completedDates),
    lastWorkoutDate: completed[0]?.loggedAt ?? null,
    mostSkippedWorkoutType:
      Array.from(skippedTypes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    inactivityDays: completed[0] ? dayjs().diff(dayjs(completed[0].loggedAt), "day") : null
  };
}

export function computeDropOffRisk(completionPercent: number, inactivityDays: number | null) {
  if (inactivityDays !== null && inactivityDays >= 7) {
    return "HIGH" as const;
  }

  if (completionPercent < 50 || (inactivityDays !== null && inactivityDays >= 4)) {
    return "MEDIUM" as const;
  }

  return "LOW" as const;
}
