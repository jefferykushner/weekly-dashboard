import React, { useState, useEffect, useRef } from "react";
import { DAY_NAMES, RECUR_LABEL } from "../lib/dates";

// Auto-growing, wrapping text field used for every editable item.
// Enter commits (blurs) instead of inserting a newline, preserving the quick flow.
export function GrowText({ value, onChange, onCommit, placeholder, className }) {
  const ref = useRef(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(() => { resize(); }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => { onChange(e.target.value); resize(); }}
      onBlur={onCommit}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
    />
  );
}

// A single check-off item. Text is always editable in place (low friction).
// If onMove is passed, a "→" control appears with day + list targets (used by brain dump).
export function Row({ item, onToggle, onEdit, onRemove, compact, accent, dayOptions, onMove, panelOptions, onMovePanel, leaving, todoCtl }) {
  const [text, setText] = useState(item.body);
  const [menu, setMenu] = useState(false);
  const isSeries = !!item._recurring;
  return (
    <div className={"row" + (item.done ? " done" : "") + (compact ? " compact" : "") + (leaving ? " leaving" : "")}>
      <button
        className={"check" + (item.done ? " on" : "")}
        style={item.done ? { background: accent || "var(--done)", borderColor: accent || "var(--done)" } : undefined}
        onClick={() => onToggle(!item.done)}
        aria-label={item.done ? "Mark not done" : "Mark done"}
      >
        <svg viewBox="0 0 16 16" className="tick"><path d="M3 8.5l3 3 7-8" /></svg>
      </button>
      <GrowText
        className="row-text"
        value={text}
        onChange={setText}
        onCommit={() => { if (text !== item.body) onEdit(text); }}
      />
            {todoCtl && (
        <div className="move-wrap">
          <button className={"move" + (isSeries ? " recurring-mark" : "")} onClick={() => setMenu((m) => !m)} aria-label="Options" title={isSeries ? "Repeats — options" : "Reschedule / repeat"}>{isSeries ? "↻" : "⤳"}</button>
          {menu && (
            <div className="move-menu">
              {!isSeries && (
                <>
                  <div className="move-menu-label">move to</div>
                  {todoCtl.dayOptions.map((d) => (
                    <button key={d.iso} onClick={() => { setMenu(false); todoCtl.onReschedule(d.iso); }}>
                      {d.label}{d.isToday ? " · today" : ""}
                    </button>
                  ))}
                  <input
                    className="menu-date"
                    type="date"
                    onChange={(e) => { if (e.target.value) { setMenu(false); todoCtl.onReschedule(e.target.value); } }}
                  />
                </>
              )}
              <div className="move-menu-label">repeat</div>
              {["none", "daily", "weekdays", "weekly"].map((v) => (
                <button key={v} className={(item.recur || "none") === v ? "sel" : ""}
                  onClick={() => { setMenu(false); todoCtl.onRecur(v); }}>
                  {RECUR_LABEL[v]}
                </button>
              ))}
              {isSeries && (
                <>
                  <div className="move-menu-label">this series</div>
                  <button onClick={() => { setMenu(false); todoCtl.onSkipDay(); }}>Skip just this day</button>
                  <button className="danger" onClick={() => { setMenu(false); todoCtl.onDeleteSeries(); }}>Delete series</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {onMove && (
        <div className="move-wrap">
          <button className="move" onClick={() => setMenu((m) => !m)} aria-label="Move" title="Move to a day or list">⤳</button>
          {menu && (
            <div className="move-menu">
              <div className="move-menu-label">to a day</div>
              {dayOptions.map((d) => (
                <button key={d.iso} onClick={() => { setMenu(false); onMove(d.iso); }}>
                  {d.label}{d.isToday ? " · today" : ""}
                </button>
              ))}
              {panelOptions && panelOptions.length > 0 && (
                <>
                  <div className="move-menu-label">to a list</div>
                  {panelOptions.map((p) => (
                    <button key={p.id} onClick={() => { setMenu(false); onMovePanel(p.id); }}>
                      {p.title}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
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

// An event / appointment: no checkbox, no rollover. Optionally recurring.
export function EventRow({ item, onEdit, onRemove, onRecur }) {
  const [text, setText] = useState(item.body);
  const [menu, setMenu] = useState(false);
  const recur = item.recur || "none";
  const recurring = recur !== "none";
  return (
    <div className="erow">
      <span className={"edot" + (recurring ? " recurring" : "")} />
      <GrowText
        className="etext"
        value={text}
        onChange={setText}
        onCommit={() => { if (text !== item.body) onEdit(text); }}
      />
      {onRecur && (
        <div className="move-wrap">
          <button
            className={"recur-btn" + (recurring ? " on" : "")}
            onClick={() => setMenu((m) => !m)}
            title={RECUR_LABEL[recur]}
            aria-label="Set repeat"
          >↻</button>
          {menu && (
            <div className="move-menu">
              <div className="move-menu-label">repeat</div>
              {["none", "daily", "weekdays", "weekly"].map((v) => (
                <button key={v} className={recur === v ? "sel" : ""} onClick={() => { setMenu(false); onRecur(v); }}>
                  {RECUR_LABEL[v]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button className="del" onClick={onRemove} aria-label="Delete">×</button>
    </div>
  );
}

export function Panel({
  title, accent, items, onToggle, onEdit, onRemove, onAdd, big,
  editMode, onRename, onDelete, onLeft, onRight, canLeft, canRight, onClearDone,
}) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const [tDraft, setTDraft] = useState(title);
  const [showDone, setShowDone] = useState(false);
  const active = items.filter((i) => !i.done);
  const finished = items.filter((i) => i.done);
  return (
    <div className={"panel" + (big ? " big" : "")}>
      {editMode && onRename ? (
        <div className="panel-edit-head">
          <span className="reorder-h">
            <button onClick={onLeft} disabled={!canLeft} aria-label="Move left">◀</button>
            <button onClick={onRight} disabled={!canRight} aria-label="Move right">▶</button>
          </span>
          <input
            className="panel-rename"
            value={tDraft}
            onChange={(e) => setTDraft(e.target.value)}
            onBlur={() => { if (tDraft.trim() && tDraft !== title) onRename(tDraft.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
          <button className="del" onClick={onDelete} aria-label="Delete list">×</button>
        </div>
      ) : (
        <div className="panel-head">
          <span className="dot" style={{ background: accent }} />
          <h3>{title}</h3>
          {items.length > 0 && <span className="count">{done}/{items.length}</span>}
        </div>
      )}
      <div className="progress"><span style={{ width: pct + "%", background: accent }} /></div>
      <div className="items">
        {active.map((it) => (
          <Row key={it.id} item={it} accent={accent}
            onToggle={(d) => onToggle(it.id, d)}
            onEdit={(t) => onEdit(it.id, t)}
            onRemove={() => onRemove(it.id)} />
        ))}
        {finished.length > 0 && (
          <div className="done-zone">
            <div className="done-bar">
              <button className="done-toggle" onClick={() => setShowDone((s) => !s)}>
                ✓ {finished.length} done {showDone ? "▾" : "▸"}
              </button>
              {onClearDone && (
                <button className="done-clear" onClick={onClearDone} title="Remove completed items">clear</button>
              )}
            </div>
            {showDone && finished.map((it) => (
              <Row key={it.id} item={it} accent={accent}
                onToggle={(d) => onToggle(it.id, d)}
                onEdit={(t) => onEdit(it.id, t)}
                onRemove={() => onRemove(it.id)} />
            ))}
          </div>
        )}
      </div>
      <AddRow placeholder="+ add" onAdd={onAdd} />
    </div>
  );
}

export function DayColumn({
  name, date, isToday, items, events,
  onToggle, onEdit, onRemove, onAdd,
  onAddEvent, onEditEvent, onRemoveEvent, onRecurEvent, onClearDone,
  dayOptions, onReschedule, onRecurTodo, onSkipDay, onDeleteSeries,
}) {
  const done = items.filter((i) => i.done).length;
  const [showDone, setShowDone] = useState(false);
  const active = items.filter((i) => !i.done);
  const finished = items.filter((i) => i.done);
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
                onRemove={() => onRemoveEvent(ev.id)}
                onRecur={(r) => onRecurEvent(ev.id, r)} />
            ))}
          </div>
        )}
        <AddRow placeholder="+ event" onAdd={onAddEvent} subtle event />

        {items.length > 0 && <div className="day-divider" />}

        <div className="day-items">
          {active.map((it) => (
            <Row key={(it._recurring ? it.id + it._dt : it.id)} item={it} compact
              todoCtl={{
                dayOptions,
                onReschedule: (iso) => onReschedule(it.id, iso),
                onRecur: (v) => onRecurTodo(it.id, v),
                onSkipDay: () => onSkipDay(it),
                onDeleteSeries: () => onDeleteSeries(it.id),
              }}
              onToggle={(d) => onToggle(it, d)}
              onEdit={(t) => onEdit(it.id, t)}
              onRemove={() => onRemove(it)} />
          ))}
          {finished.length > 0 && (
            <div className="done-zone">
              <div className="done-bar">
                <button className="done-toggle" onClick={() => setShowDone((s) => !s)}>
                  ✓ {finished.length} done {showDone ? "▾" : "▸"}
                </button>
                {onClearDone && (
                  <button className="done-clear" onClick={onClearDone} title="Remove completed items">clear</button>
                )}
              </div>
              {showDone && finished.map((it) => (
                <Row key={(it._recurring ? it.id + it._dt : it.id)} item={it} compact
                  onToggle={(d) => onToggle(it, d)}
                  onEdit={(t) => onEdit(it.id, t)}
                  onRemove={() => onRemove(it)} />
              ))}
            </div>
          )}
        </div>
        <AddRow placeholder="+ to-do" onAdd={onAdd} subtle />
      </div>

      {items.length > 0 && <div className="day-foot">{done}/{items.length}</div>}
    </div>
  );
}

export { DAY_NAMES };

// Editable label used for managing habit names (with optional reorder arrows).
export function EditableName({ value, onSave, onDelete, placeholder, onUp, onDown, canUp, canDown }) {
  const [v, setV] = useState(value);
  return (
    <div className="name-edit">
      {(onUp || onDown) && (
        <span className="reorder">
          <button onClick={onUp} disabled={!canUp} aria-label="Move up">▲</button>
          <button onClick={onDown} disabled={!canDown} aria-label="Move down">▼</button>
        </span>
      )}
      <input
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== value) onSave(v); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      <button className="del" onClick={onDelete} aria-label="Delete">×</button>
    </div>
  );
}
