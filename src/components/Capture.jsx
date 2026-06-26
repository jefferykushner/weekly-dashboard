import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { captureInbox, flushQueue, queuedCount } from "../lib/db";

export default function Capture() {
  const [text, setText] = useState("");
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
    setRecent((r) => [t, ...r].slice(0, 8));
    const { offline } = await captureInbox(t);
    setQueued(queuedCount());
    setFlash(offline ? "Saved offline — will sync" : "Captured");
    setTimeout(() => setFlash(""), 1600);
    inputRef.current && inputRef.current.focus();
  };

  return (
    <div className="cap-root">
      <header className="cap-head">
        <span className="cap-title">Brain dump</span>
        <Link className="cap-link" to="/">dashboard →</Link>
      </header>

      <div className="cap-box">
        <textarea
          ref={inputRef}
          className="cap-input"
          placeholder="get it out of your head…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }}
        />
        <button className="cap-add" onClick={add}>Capture</button>
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
