// Times on events and to-dos (tasks.at_time, "HH:MM:SS") and their reminders
// (tasks.remind_before, minutes). The iPhone app reads the same two columns and
// schedules the actual notifications.

const pad = (n) => String(n).padStart(2, "0");
const toDb = (h, m) => `${pad(h)}:${pad(m)}:00`;

// Find a clock time in typed text: "2pm", "9:30 am", "7PM", "14:00", "noon", "at 3".
// Returns "HH:MM:00" or null. For a range like "10am to 11:30am" it takes the start.
export function parseTime(text) {
  if (!text) return null;
  const s = String(text);
  let m = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h < 1 || h > 12 || min > 59) return null;
    const pm = m[3].toLowerCase().startsWith("p");
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return toDb(h, min);
  }
  m = s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m) return toDb(parseInt(m[1], 10), parseInt(m[2], 10));
  if (/\bnoon\b/i.test(s)) return toDb(12, 0);
  m = s.match(/(?:\bat|@)\s*(\d{1,2})\b(?!\s*(?:st|nd|rd|th|%|\/|-))/i);
  if (m) {
    let h = parseInt(m[1], 10);
    if (h < 1 || h > 12) return null;
    if (h <= 7) h += 12; // "at 3" means 3pm
    return toDb(h, 0);
  }
  return null;
}

// "19:00:00" -> "7pm", "09:30:00" -> "9:30am"
export function fmtTime(t) {
  if (!t) return "";
  const [hs, ms] = t.split(":");
  const h = parseInt(hs, 10);
  const m = parseInt(ms, 10);
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${pad(m)}${ap}` : `${h12}${ap}`;
}

// "19:00:00" -> "19:00" for <input type="time">
export const toInputTime = (t) => (t ? t.slice(0, 5) : "");
export const fromInputTime = (v) => (v ? `${v}:00` : null);

export const REMIND_OPTIONS = [
  [null, "No reminder"],
  [0, "At the time"],
  [5, "5 min before"],
  [10, "10 min before"],
  [15, "15 min before"],
  [30, "30 min before"],
  [60, "1 hour before"],
  [120, "2 hours before"],
  [1440, "1 day before"],
];

// Default reminder when a time is set: events 15 min ahead, to-dos right at the time.
export const defaultRemind = (kind) => (kind === "event" ? 15 : 0);

// Timed items first, earliest to latest; untimed keep their order after them.
export function byTime(a, b) {
  const ta = a.at_time || "99";
  const tb = b.at_time || "99";
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}
