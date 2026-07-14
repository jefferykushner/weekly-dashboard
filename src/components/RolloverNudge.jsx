import React from "react";
import { MONTHS } from "../lib/dates";

function fmt(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function RolloverNudge({ items, onMove, onMoveTo, onKeep, onDrop, onClose }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="nudge-overlay" role="dialog" aria-modal="true">
      <div className="nudge">
        <div className="nudge-head">
          <h2>Still want these?</h2>
          <p>{items.length} thing{items.length > 1 ? "s" : ""} from earlier never got checked off.</p>
        </div>
        <div className="nudge-list">
          {items.map((it) => (
            <div className="nudge-item" key={it.id}>
              <div className="nudge-when">{fmt(it.dt)}</div>
              <div className="nudge-body">{it.body}</div>
              <div className="nudge-actions">
                <button className="nudge-move" onClick={() => onMove(it)}>Move to today</button>
                <label className="nudge-date">
                  pick a date
                  <input type="date" onChange={(e) => { if (e.target.value) onMoveTo(it, e.target.value); }} />
                </label>
                <button className="nudge-keep" onClick={() => onKeep(it)}>Leave it</button>
                <button className="nudge-drop" onClick={() => onDrop(it)}>Done / drop</button>
              </div>
            </div>
          ))}
        </div>
        <button className="nudge-close" onClick={onClose}>Deal with the rest later</button>
      </div>
    </div>
  );
}
