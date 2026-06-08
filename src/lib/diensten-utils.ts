import type { Dienst } from "./diensten.functions";

export const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
export const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function parseDate(d: string) {
  // YYYY-MM-DD
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd);
}

export function formatDate(d: string) {
  const dt = parseDate(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function dayName(d: string) {
  return DAYS[parseDate(d).getDay()];
}

export type DienstCategory = "ochtend" | "avond" | "feest" | "other";

export function categorize(d: Dienst): DienstCategory {
  if (d.titel.trim()) return "feest";
  const hour = parseInt(d.aanwezig_tijd.slice(0, 2), 10);
  if (hour < 12) return "ochtend";
  if (hour >= 16) return "avond";
  return "other";
}

export function dienstKey(d: Dienst) {
  return `${d.datum}|${d.dienst_tijd}`;
}
