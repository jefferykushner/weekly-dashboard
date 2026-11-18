import React, { useState, useEffect, useRef, useMemo } from "react";
import { addDays, toISO, DAY_NAMES, MONTHS } from "../lib/dates";

// One-at-a-time brain dump triage. Each crumb gets a single decision:
// a day, a list, done, delete, or skip-for-now. Keyboard first:
//   T today · M tomorrow · 1-9 list · D done · Delete/Backspace delete · S or → skip · Esc close
// Typing in the text box edits the crumb; Enter saves the edit.

function niceDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const wd = DAY_NAMES[(d.getDay() + 6) % 7];
  return `${wd} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function capturedLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return `captured ${when}`;
}

export default function SortCrumbs({ items, panels, onDay, onPanel, onDone, onDelete, onEdit, onClose }) {
  // Snapshot the queue when opened, so crumbs captured mid-sort don't reshuffle it.
  const [queue] = useState(() => items.map((i) => i.id));
  const [idx, setIdx] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState("");
  const textRef = useRef(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  // Skip past anything that disappeared (e.g. deleted elsewhere).
  let cur = null;
  let at = idx;
  while (at < queue.length && !(cur = byId.get(queue[at]))) at++;
  const finished = at >= queue.length;

  useEffect(() => { if (at !== idx) setIdx(at); }, [at, idx]);
  useEffect(() => { setDraft(cur ? cur.body : ""); }, [cur && cur.id]);

  const todayIso = toISO(new Date());
  const tomorrowIso = toISO(addDays(new Date(), 1));
  const lists = panels.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const saveEdit = () => {
    if (cur && draft.trim() && draft !== cur.body) onEdit(cur.id, draft.trim());
  };

  const next = (msg, counted = true) => {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? "" : f)), 1100);
    if (counted) setSorted((n) => n + 1);
    setIdx((i) => i + 1);
  };

  const act = {
    day: (iso, label) => { saveEdit(); onDay(cur.id, iso); next(`→ ${label}`); },
    panel: (p) => { saveEdit(); onPanel(cur.id, p.id); next(`→ ${p.title}`); },
    done: () => { onDone(cur.id); next("✓ done"); },
    del: () => { onDelete(cur.id); next("deleted"); },
    skip: () => { saveEdit(); setSkipped((n) => n + 1); next("skipped", false); },
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); saveEdit(); onClose(); return; }
      if (finished || !cur) return;
      const tag = e.target && e.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return; // typing an edit or a date
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "t") act.day(todayIso, "today");
      else if (k === "m") act.day(tomorrowIso, "tomorrow");
      else if (k === "d") act.done();
      else if (k === "s" || e.key === "ArrowRight") act.skip();
      else if (e.key === "Delete" || e.key === "Backspace") act.del();
      else if (/^[1-9]$/.test(e.key) && lists[+e.key - 1]) act.panel(lists[+e.key - 1]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="sort-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) { saveEdit(); onClose(); } }}>
      <div className="sort-card">
        <div className="sort-head">
          <span className="sort-title">Sort crumbs</span>
          {!finished && <span className="sort-count">{Math.min(idx + 1, queue.length)} of {queue.length}</span>}
          <button className="sort-x" onClick={() => { saveEdit(); onClose(); }} aria-label="Close">×</button>
        </div>
        <div className="sort-progress"><span style={{ width: `${(Math.min(idx, queue.length) / Math.max(queue.length, 1)) * 100}%` }} /></div>

        {finished ? (
          <div className="sort-done">
            <div className="sort-done-big">{skipped ? "Pass done" : "All sorted"}</div>
            <p>
              {sorted} crumb{sorted === 1 ? "" : "s"} sorted
              {skipped ? ` · ${skipped} skipped for later` : ". Your head (and your dump) is clear."}
            </p>
            <button className="sort-btn primary" onClick={onClose}>Back to the week</button>
          </div>
        ) : (
          <>
            <textarea
              ref={textRef}
              className="sort-text"
              value={draft}
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
            />
            <div className="sort-meta">{capturedLabel(cur.created_at)} · click the text to edit it</div>

            <div className="sort-label">When</div>
            <div className="sort-row">
              <button className="sort-btn primary" onClick={() => act.day(todayIso, "today")}>Today <kbd>T</kbd></button>
              <button className="sort-btn" onClick={() => act.day(tomorrowIso, "tomorrow")}>Tomorrow <kbd>M</kbd></button>
              <label className="sort-btn sort-pick">
                Pick a day
                <input type="date" min={todayIso} onChange={(e) => { if (e.target.value) act.day(e.target.value, niceDate(e.target.value)); }} />
              </label>
            </div>

            {lists.length > 0 && (
              <>
                <div className="sort-label">Or put it in a list</div>
                <div className="sort-row wrap">
                  {lists.map((p, i) => (
                    <button key={p.id} className="sort-chip" onClick={() => act.panel(p)}>
                      <span className="sort-dot" style={{ background: p.accent }} />
                      {p.title}
                      {i < 9 && <kbd>{i + 1}</kbd>}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="sort-row sort-bottom">
              <button className="sort-btn done" onClick={act.done}>✓ Done <kbd>D</kbd></button>
              <button className="sort-btn danger" onClick={act.del}>Delete <kbd>Del</kbd></button>
              <button className="sort-btn ghost" onClick={act.skip}>Skip for now <kbd>S</kbd></button>
            </div>
          </>
        )}
        <div className="sort-flash">{flash}</div>
      </div>
    </div>
  );
}
