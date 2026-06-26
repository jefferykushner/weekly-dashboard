import React, { useState } from "react";
import { DAY_NAMES } from "../lib/dates";

// A single check-off item. Text is always editable in place (low friction).
export function Row({ item, onToggle, onEdit, onRemove, compact, accent }) {
  const [text, setText] = useState(item.body);
  return (
    <div className={"row" + (item.done ? " done" : "") + (compact ? " compact" : "")}>
      <button
        className={"check" + (item.done ? " on" : "")}
        style={item.done ? { background: accent || "var(--done)", borderColor: accent || "var(--done)" } : undefined}
        onClick={() => onToggle(!item.done)}
        aria-label={item.done ? "Mark not done" : "Mark done"}
      >
        <svg viewBox="0 0 16 16" className="tick"><path d="M3 8.5l3 3 7-8" /></svg>
      </button>
      <input
        className="row-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== item.body) onEdit(text); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      <button className="del" onClick={onRemove} aria-label="Delete">×</button>
    </div>
  );
}

// Fast-capture input: type, Enter, it clears and keeps focus.
export function AddRow({ placeholder, onAdd, subtle, event }) {
  const [v, setV] = useState("");
  const submit = () => {
    const t = v.trim();
    if (!t) return;
    onAdd(t);
    setV("");
  };
  return (
    <div className={"add" + (subtle ? " subtle" : "") + (event ? " event" : "")}>
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
    </div>
  );
}

// An event / appointment: no checkbox, no rollover. Just a noted thing on a day.
export function EventRow({ item, onEdit, onRemove }) {
  const [text, setText] = useState(item.body);
  return (
    <div className="erow">
      <span className="edot" />
      <input
        className="etext"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== item.body) onEdit(text); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      <button className="del" onClick={onRemove} aria-label="Delete">×</button>
    </div>
  );
}

export function Panel({ title, accent, items, onToggle, onEdit, onRemove, onAdd, big }) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <div className={"panel" + (big ? " big" : "")}>
      <div className="panel-head">
        <span className="dot" style={{ background: accent }} />
        <h3>{title}</h3>
        {items.length > 0 && <span className="count">{done}/{items.length}</span>}
      </div>
      <div className="progress"><span style={{ width: pct + "%", background: accent }} /></div>
      <div className="items">
        {items.map((it) => (
          <Row key={it.id} item={it} accent={accent}
            onToggle={(d) => onToggle(it.id, d)}
            onEdit={(t) => onEdit(it.id, t)}
            onRemove={() => onRemove(it.id)} />
        ))}
      </div>
      <AddRow placeholder="+ add" onAdd={onAdd} />
    </div>
  );
}

export function DayColumn({
  name, date, isToday, items, events,
  onToggle, onEdit, onRemove, onAdd,
  onAddEvent, onEditEvent, onRemoveEvent,
}) {
  const done = items.filter((i) => i.done).length;
  return (
    <div className={"day" + (isToday ? " today" : "")}>
      <div className="day-head">
        <span className="day-name">{name}</span>
        <span className="day-num">{date.getDate()}</span>
      </div>

      <div className="day-body">
        {events.length > 0 && (
          <div className="day-events">
            {events.map((ev) => (
              <EventRow key={ev.id} item={ev}
                onEdit={(t) => onEditEvent(ev.id, t)}
                onRemove={() => onRemoveEvent(ev.id)} />
            ))}
          </div>
        )}
        <AddRow placeholder="+ event" onAdd={onAddEvent} subtle event />

        {items.length > 0 && <div className="day-divider" />}

        <div className="day-items">
          {items.map((it) => (
            <Row key={it.id} item={it} compact
              onToggle={(d) => onToggle(it.id, d)}
              onEdit={(t) => onEdit(it.id, t)}
              onRemove={() => onRemove(it.id)} />
          ))}
        </div>
        <AddRow placeholder="+ to-do" onAdd={onAdd} subtle />
      </div>

      {items.length > 0 && <div className="day-foot">{done}/{items.length}</div>}
    </div>
  );
}

export { DAY_NAMES };
