// Sale windows are entered and displayed in store time (Europe/Istanbul,
// permanently UTC+3 — no DST since 2016). Parsing with an explicit offset
// keeps schedules deterministic wherever the server runs.

const ISTANBUL_OFFSET = "+03:00";

// "2026-07-04T12:30" (datetime-local input) → Date, or null when invalid.
export function parseIstanbulInput(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  const date = new Date(`${input}:00${ISTANBUL_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const inputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Date → "2026-07-04T12:30" for a datetime-local input, in store time.
export function toIstanbulInputValue(date: Date): string {
  const parts = Object.fromEntries(
    inputFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export const istanbulDateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});
