// lib/datetime.ts

/** Current local time as "2026-09-30T14:05" (the format <input type="datetime-local"> expects). */
export const nowLocalDateTime = (timeZone?: string): string =>
  new Date()
    .toLocaleString('sv-SE', timeZone ? { timeZone } : undefined) // "2026-09-30 14:05:37"
    .slice(0, 16)
    .replace(' ', 'T');

/** DB/API value → input value: "2026-09-29 01:26:24" → "2026-09-29T01:26" */
export const toDateTimeInputValue = (v: string | null | undefined): string =>
  v ? v.replace(' ', 'T').slice(0, 16) : '';

/** Input value → DB value: "2026-09-29T01:26" → "2026-09-29 01:26:00" */
export const toDbDateTime = (v: string): string =>
  v ? `${v.replace('T', ' ')}:00` : '';