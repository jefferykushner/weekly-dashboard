import React, { useState, useEffect, useCallback } from "react";
import { loadDay, addTask, setDone, setBody, delTask, toggleHabitMark, setTaskMark } from "../lib/db";
import { addDays, toISO, DAY_NAMES, MONTHS, eventOccursOn } from "../lib/dates";
import PhoneTabs from "./PhoneTabs";
import { GrowText } from "./parts";

export default function Today() {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [newTodo, setNewTodo] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [newEvent, setNewEvent] = useState("");

  const date = addDays(new Date(), offset);
  const iso = toISO(date);
  const isToday = offset === 0;

  const refresh = useCallback(async () => {
    const d = await loadDay(iso);
    const markMap = new Map(d.todoMarks.map((m) => [m.task_id, m]));
    const recs = d.recTodos
      .filter((t) => eventOccursOn(t, iso))
      .map((t) => {
        const mk = markMap.get(t.id);
        return { ...t, done: !!(mk && mk.done), _recurring: true, _removed: !!(mk && mk.removed) };
      })
      .filter((t) => !t._removed);
    setData({ ...d, todos: [...d.todos, ...recs] });
  }, [iso]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = (id, done) => {
    setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === id ? { ...t, done } : t)) }));
    const item = data && data.todos.find((t) => t.id === id);
    if (item && item._recurring) setTaskMark(id, iso, { done }).catch(() => {});
    else setDone(id, done).catch(() => {});
  };
  const editTodo = (id, body) => {
    setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === id ? { ...t, body } : t)) }));
    setBody(id, body).catch(() => {});
  };
  const editEvent = (id, body) => {
    setData((d) => ({ ...d, events: d.events.map((t) => (t.id === id ? { ...t, body } : t)) }));
    setBody(id, body).catch(() => {});
  };
  const removeTodo = (id) => {
    const item = data && data.todos.find((t) => t.id === id);
    setData((d) => ({ ...d, todos: d.todos.filter((t) => t.id !== id) }));
    if (item && item._recurring) setTaskMark(id, iso, { removed: true }).catch(() => {});
    else delTask(id).catch(() => {});
  };
  const removeEvent = (id) => {
    setData((d) => ({ ...d, events: d.events.filter((t) => t.id !== id) }));
    delTask(id).catch(() => {});
  };
  const addTodo = async () => {
    const t = newTodo.trim();
    if (!t) return;
    setNewTodo("");
    const row = await addTask({ kind: "day", body: t, dt: iso });
    setData((d) => ({ ...d, todos: [...d.todos, row] }));
  };
  const addEvent = async () => {
    const t = newEvent.trim();
    if (!t) return;
    setNewEvent("");
    const row = await addTask({ kind: "event", body: t, dt: iso });
    setData((d) => ({ ...d, events: [...d.events, row] }));
  };

  const toggleHabit = (id) => {
    const on = data.marked.has(id);
    setData((d) => {
      const s = new Set(d.marked);
      on ? s.delete(id) : s.add(id);
      return { ...d, marked: s };
    });
    toggleHabitMark(id, iso, !on).catch(() => {});
  };

  const heading = isToday
    ? "Today"
    : offset === 1 ? "Tomorrow"
    : offset === -1 ? "Yesterday"
    : DAY_NAMES[(date.getDay() + 6) % 7];

  return (
    <div className="tday-root">
      <header className="tday-head">
        <div className="tday-title">
          <span className="tday-h">{heading}</span>
          <span className="tday-date">{DAY_NAMES[(date.getDay() + 6) % 7]} · {MONTHS[date.getMonth()]} {date.getDate()}</span>
        </div>
        <div className="tday-nav">
          <button onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">‹</button>
          {!isToday && <button className="tday-now" onClick={() => setOffset(0)}>today</button>}
          <button onClick={() => setOffset((o) => o + 1)} aria-label="Next day">›</button>
        </div>
      </header>

      {!data ? (
        <div className="tday-loading">loading…</div>
      ) : (
        <div className="tday-body">
          <section className="tday-section">
            <div className="tday-label">Events</div>
            {data.events.filter((ev) => eventOccursOn(ev, iso)).map((ev) => (
              <div className="tevent" key={ev.id}>
                <span className={"tedot" + (ev.recur && ev.recur !== "none" ? " recurring" : "")} />
                <GrowText className="tevent-text" value={ev.body} onChange={(v) => editEvent(ev.id, v)} />
                {ev.recur && ev.recur !== "none" && <span className="trecur" title="Repeats">↻</span>}
                <button className="tdel" onClick={() => removeEvent(ev.id)} aria-label="Delete">×</button>
              </div>
            ))}
            <div className="tadd">
              <input placeholder="+ event" value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addEvent(); }} />
            </div>
          </section>

          <section className="tday-section">
            <div className="tday-label">
              To-dos
              {data.todos.length > 0 && (
                <span className="tday-count">{data.todos.filter((t) => t.done).length}/{data.todos.length}</span>
              )}
            </div>
            {data.todos.filter((t) => !t.done).map((t) => (
              <div className="ttodo" key={t.id}>
                <button className="tcheck" onClick={() => toggle(t.id, true)} aria-label="Toggle done">
                  <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                </button>
                <GrowText className="ttodo-text" value={t.body} onChange={(v) => editTodo(t.id, v)} />
                {t._recurring && <span className="trecur" title="Repeats — × skips just this day">↻</span>}
                <button className="tdel" onClick={() => removeTodo(t.id)} aria-label="Delete">×</button>
              </div>
            ))}
            {data.todos.some((t) => t.done) && (
              <div className="tdone-zone">
                <button className="tdone-toggle" onClick={() => setShowDone((s) => !s)}>
                  ✓ {data.todos.filter((t) => t.done).length} done {showDone ? "▾" : "▸"}
                </button>
                {showDone && data.todos.filter((t) => t.done).map((t) => (
                  <div className="ttodo done" key={t.id}>
                    <button className="tcheck on" onClick={() => toggle(t.id, false)} aria-label="Toggle done">
                      <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                    </button>
                    <GrowText className="ttodo-text" value={t.body} onChange={(v) => editTodo(t.id, v)} />
                    <button className="tdel" onClick={() => removeTodo(t.id)} aria-label="Delete">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="tadd">
              <input placeholder="+ to-do" value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }} />
            </div>
          </section>

          {data.habits.length > 0 && (
            <section className="tday-section">
              <div className="tday-label">
                Daily tracker
                <span className="tday-count">{data.habits.filter((h) => data.marked.has(h.id)).length}/{data.habits.length}</span>
              </div>
              {data.habits.map((h) => {
                const on = data.marked.has(h.id);
                return (
                  <button key={h.id} className={"thabit" + (on ? " on" : "")} onClick={() => toggleHabit(h.id)}>
                    <span className={"tcheck" + (on ? " on" : "")}>
                      <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                    </span>
                    <span className="thabit-name">{h.name}</span>
                  </button>
                );
              })}
            </section>
          )}
        </div>
      )}

      <PhoneTabs active="today" />
    </div>
  );
}
