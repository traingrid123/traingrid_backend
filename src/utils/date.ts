import dayjs from "dayjs";

export function nowIso(): string {
  return dayjs().toISOString();
}
