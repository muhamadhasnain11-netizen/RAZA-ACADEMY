// Class times are entered and shown in UK time.
export function ukToUtc(d, t) {
  const g = new Date(`${d}T${t}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(g).map((x) => [x.type, x.value]));
  const asLondon = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(g.getTime() - (asLondon - g.getTime())).toISOString();
}
export const fmtUK = (x) => new Date(x).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const timeUK = (x) => new Date(x).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
export const dayUK = (x) => new Date(x).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
