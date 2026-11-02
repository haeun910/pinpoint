/** 날짜는 모두 로컬 기준 YYYY-MM-DD 문자열로 다룬다. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** today 기준으로 iso까지 남은 일수 (지났으면 음수) */
export function daysUntil(iso: string, today: string): number {
  const ms = parseISODate(iso).getTime() - parseISODate(today).getTime();
  return Math.round(ms / 86_400_000);
}

const WD = "일월화수목금토";
export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}.${d.getDate()} (${WD[d.getDay()]})`;
}

export function ddayLabel(deadline: string | null, today: string, unknown = false): string {
  if (deadline === null) return unknown ? "일정 확인" : "상시";
  const n = daysUntil(deadline, today);
  if (n < 0) return "마감";
  if (n === 0) return "오늘 마감";
  return `D-${n}`;
}
