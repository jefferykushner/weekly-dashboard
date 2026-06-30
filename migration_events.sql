export const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function getMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const todayISO = () => toISO(new Date());

// Does a (possibly recurring) event fall on the given ISO date?
export function eventOccursOn(ev, iso) {
  if (!ev.dt) return false;
  const recur = ev.recur || "none";
  if (recur === "none") return ev.dt === iso;
  if (iso < ev.dt) return false; // series starts at its anchor date
  const d = new Date(iso + "T00:00:00");
  const wd = (d.getDay() + 6) % 7; // 0 = Mon .. 6 = Sun
  if (recur === "daily") return true;
  if (recur === "weekdays") return wd <= 4;
  if (recur === "weekly") {
    const a = new Date(ev.dt + "T00:00:00");
    return wd === (a.getDay() + 6) % 7;
  }
  return false;
}

export const RECUR_LABEL = {
  none: "Does not repeat",
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Weekly",
};
