import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { captureInbox, captureEvent, flushQueue, queuedCount } from "../lib/db";
import { toISO } from "../lib/dates";

export default function Capture() {
  const [mode, setMode] = useState("dump"); // "dump" | "event"
  const [text, setText] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [recent, setRecent] = useState([]);
  const [queued, setQueued] = useState(queuedCount());
  const [flash, setFlash] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
    const onOnline = async () => {
      const sent = await flushQueue();
      setQueued(queuedCount());
      if (sent) setFlash(`Synced ${sent} item${sent > 1 ? "s" : ""}`);
    };
    window.addEventListener("online", onOnline);
    onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const add = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    const label = mode === "event" ? `${t}  ·  ${date}` : t;
    setRecent((r) => [label, ...r].slice(0, 8));
    const { offline } =
      mode === "event" ? await captureEvent(t, date) : await captureInbox(t);
    setQueued(queuedCount());
    setFlash(offline ? "Saved offline — will sync" : mode === "event" ? "Event captured" : "Captured");
    setTimeout(() => setFlash(""), 1600);
    inputRef.current && inputRef.current.focus();
  };

  return (
    <div className="cap-root">
      <header className="cap-head">
        <span className="cap-title">Capture</span>
        <Link className="cap-link" to="/">dashboard &rarr;</Link>
      </header>

      <div className="cap-modes">
        <button className={mode === "dump" ? "on" : ""} onClick={() => setMode("dump")}>Brain dump</button>
        <button className={mode === "event" ? "on" : ""} onClick={() => setMode("event")}>Event</button>
      </div>

      <div className="cap-box">
        <textarea
          ref={inputRef}
          className="cap-input"
          placeholder={mode === "event" ? "what is the appointment? (e.g. 2pm dentist)" : "get it out of your head..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }}
        />

        {mode === "event" && (
          <label className="cap-date">
            <span>on</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}

        <button className="cap-add" onClick={add}>
          {mode === "event" ? "Add to that day" : "Capture"}
        </button>

        <div className="cap-status">
          {flash && <span className="cap-flash">{flash}</span>}
          {queued > 0 && <span className="cap-queued">{queued} waiting to sync</span>}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="cap-recent">
          <div className="cap-recent-label">just captured</div>
          {recent.map((r, i) => <div className="cap-recent-item" key={i}>{r}</div>)}
        </div>
      )}
    </div>
  );
}
