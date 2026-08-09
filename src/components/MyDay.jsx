import React, { useState, useEffect, useCallback } from "react";
import {
  loadDay, addTask, setDone, setBody, delTask, toggleHabitMark, setTaskMark,
  getChores, getChoreCompletions, completeChore, uncompleteChore,
  getPanels,
} from "../lib/db";
import { supabase } from "../lib/supabase";
import {
  addDays, toISO, DAY_NAMES, MONTHS, eventOccursOn,
  isChoreComplete, choreCycleStart, CHORE_FREQ_LABEL,
} from "../lib/dates";
import PhoneTabs from "./PhoneTabs";
import ConfettiBurst from "./ConfettiBurst";
import ProgressRing from "./ProgressRing";
import { GrowText } from "./parts";

export default function MyDay() {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [newTodo, setNewTodo] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [toasts, setToasts] = useState([]);
  // Chores
  const [chores, setChores] = useState([]);
  const [choreComps, setChoreComps] = useState([]);
  // Panels (project lists)
  const [panels, setPanels] = useState([]);
  const [panelItems, setPanelItems] = useState([]);
  const [expandedPanel, setExpandedPanel] = useState(null);

  const date = addDays(new Date(), offset);
  const iso = toISO(date);
  const isToday = offset === 0;

  const celebrate = (msg) => {
    setConfetti((c) => c + 1);
    const cid = Date.now();
    setToasts((t) => [...t, { id: cid, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== cid)), 2800);
  };

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
    // Chores
    const [ch, cc] = await Promise.all([getChores(), getChoreCompletions()]);
    setChores(ch);
    setChoreComps(cc);
    // Panels + items
    const pnls = await getPanels();
    setPanels(pnls);
    const { data: allPanelItems } = await supabase
      .from("tasks")
      .select("*")
      .eq("kind", "panel")
      .order("created_at", { ascending: true });
    setPanelItems(allPanelItems || []);
  }, [iso]);

  useEffect(() => { refresh(); }, [refresh]);

  // --- handlers ---
  const toggle = (id, done) => {
    setData((d) => ({ ...d, todos: d.todos.map((t) => (t.id === id ? { ...t, done } : t)) }));
    const item = data && data.todos.find((t) => t.id === id);
    if (item && item._recurring) setTaskMark(id, iso, { done }).catch(() => {});
    else setDone(id, done).catch(() => {});
    if (done) setTimeout(() => {
      setData((d) => {
        if (d && d.todos.length > 0 && d.todos.every((t) => t.done)) celebrate("Day cleared! \u{1F389}");
        return d;
      });
    }, 50);
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
    const t = newTodo.trim(); if (!t) return; setNewTodo("");
    const row = await addTask({ kind: "day", body: t, dt: iso });
    setData((d) => ({ ...d, todos: [...d.todos, row] }));
  };
  const addEvent = async () => {
    const t = newEvent.trim(); if (!t) return; setNewEvent("");
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
    if (!on) setTimeout(() => {
      setData((d) => {
        if (d && d.habits.length > 0 && d.habits.every((hb) => d.marked.has(hb.id) || hb.id === id)) celebrate("All habits done! \u{1F4AA}");
        return d;
      });
    }, 50);
  };
  const choreIsDone = (c) => isChoreComplete(c, choreComps);
  const toggleChore = async (c, done) => {
    if (done) {
      const comp = await completeChore(c.id);
      setChoreComps((cc) => [comp, ...cc]);
      setTimeout(() => {
        const allDone = chores.every((ch) => ch.id === c.id || isChoreComplete(ch, [...choreComps, comp]));
        if (allDone && chores.length > 0) celebrate("All chores done! \u{1F3E0}");
      }, 50);
    } else {
      const start = choreCycleStart(c.frequency);
      await uncompleteChore(c.id, start);
      setChoreComps((cc) => {
        const idx = cc.findIndex((x) => x.chore_id === c.id && x.completed_at >= start);
        return idx >= 0 ? [...cc.slice(0, idx), ...cc.slice(idx + 1)] : cc;
      });
    }
  };
  // Panel item toggle
  const togglePanelItem = (id, done) => {
    setPanelItems((items) => items.map((t) => (t.id === id ? { ...t, done } : t)));
    setDone(id, done).catch(() => {});
  };

  const heading = isToday ? "My Day"
    : offset === 1 ? "Tomorrow"
    : offset === -1 ? "Yesterday"
    : DAY_NAMES[(date.getDay() + 6) % 7];

  const activeTodos = data ? data.todos.filter((t) => !t.done) : [];
  const doneTodos = data ? data.todos.filter((t) => t.done) : [];
  const todayEvents = data ? data.events.filter((ev) => eventOccursOn(ev, iso)) : [];
  const dueChores = chores.filter((c) => !choreIsDone(c));
  const doneChores = chores.filter(choreIsDone);

  return (
    <div className="myday-root">
      <header className="myday-head">
        <div className="myday-title">
          <span className="myday-h">{heading}</span>
          <span className="myday-date">{DAY_NAMES[(date.getDay() + 6) % 7]} &middot; {MONTHS[date.getMonth()]} {date.getDate()}</span>
        </div>
        <div className="myday-nav">
          <button onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">&lsaquo;</button>
          {!isToday && <button className="myday-now" onClick={() => setOffset(0)}>today</button>}
          <button onClick={() => setOffset((o) => o + 1)} aria-label="Next day">&rsaquo;</button>
        </div>
      </header>

      {!data ? (
        <div className="myday-loading">loading&hellip;</div>
      ) : (
        <div className="myday-body">

          {/* ---- Events ---- */}
          {todayEvents.length > 0 && (
            <section className="myday-section">
              <div className="myday-label">Events</div>
              {todayEvents.map((ev) => (
                <div className="tevent" key={ev.id}>
                  <span className={"tedot" + (ev.recur && ev.recur !== "none" ? " recurring" : "")} />
                  <GrowText className="tevent-text" value={ev.body} onChange={(v) => editEvent(ev.id, v)} />
                  {ev.recur && ev.recur !== "none" && <span className="trecur" title="Repeats">&#8635;</span>}
                  <button className="tdel" onClick={() => removeEvent(ev.id)} aria-label="Delete">&times;</button>
                </div>
              ))}
            </section>
          )}
          <div className="tadd myday-add-event">
            <input placeholder="+ event" value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEvent(); }} />
          </div>

          {/* ---- To-dos ---- */}
          <section className="myday-section">
            <div className="myday-label">
              To-dos
              {data.todos.length > 0 && <span className="myday-count">{doneTodos.length}/{data.todos.length}</span>}
            </div>
            {activeTodos.map((t) => (
              <div className="ttodo" key={t.id}>
                <button className="tcheck" onClick={() => toggle(t.id, true)} aria-label="Done">
                  <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                </button>
                <GrowText className="ttodo-text" value={t.body} onChange={(v) => editTodo(t.id, v)} />
                {t._recurring && <span className="trecur" title="Repeats">&#8635;</span>}
                <button className="tdel" onClick={() => removeTodo(t.id)} aria-label="Delete">&times;</button>
              </div>
            ))}
            {doneTodos.length > 0 && (
              <div className="tdone-zone">
                <button className="tdone-toggle" onClick={() => setShowDone((s) => !s)}>
                  &#10003; {doneTodos.length} done {showDone ? "\u25BE" : "\u25B8"}
                </button>
                {showDone && doneTodos.map((t) => (
                  <div className="ttodo done" key={t.id}>
                    <button className="tcheck on" onClick={() => toggle(t.id, false)} aria-label="Undo">
                      <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                    </button>
                    <GrowText className="ttodo-text" value={t.body} onChange={(v) => editTodo(t.id, v)} />
                    <button className="tdel" onClick={() => removeTodo(t.id)} aria-label="Delete">&times;</button>
                  </div>
                ))}
              </div>
            )}
            <div className="tadd"><input placeholder="+ to-do" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }} /></div>
          </section>

          {/* ---- Chores ---- */}
          {chores.length > 0 && (
            <section className="myday-section">
              <div className="myday-label">
                Chores
                <ProgressRing done={doneChores.length} total={chores.length} size={28} stroke={2.5} />
              </div>
              {dueChores.map((c) => (
                <button key={c.id} className="thabit" onClick={() => toggleChore(c, true)}>
                  <span className="tcheck"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg></span>
                  <span className="thabit-name">{c.name}</span>
                  <span className="tchore-freq">{CHORE_FREQ_LABEL[c.frequency]}</span>
                </button>
              ))}
              {doneChores.length > 0 && doneChores.map((c) => (
                <button key={c.id} className="thabit on" onClick={() => toggleChore(c, false)}>
                  <span className="tcheck on"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg></span>
                  <span className="thabit-name">{c.name}</span>
                  <span className="tchore-freq">{CHORE_FREQ_LABEL[c.frequency]}</span>
                </button>
              ))}
            </section>
          )}

          {/* ---- Daily Habits ---- */}
          {data.habits.length > 0 && (
            <section className="myday-section">
              <div className="myday-label">
                Daily tracker
                <ProgressRing done={data.habits.filter((h) => data.marked.has(h.id)).length} total={data.habits.length} size={28} stroke={2.5} />
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

          {/* ---- Project lists (collapsed) ---- */}
          {panels.length > 0 && (
            <section className="myday-section">
              <div className="myday-label">Lists</div>
              {panels.map((p) => {
                const items = panelItems.filter((t) => t.panel_id === p.id);
                const active = items.filter((t) => !t.done);
                const done = items.filter((t) => t.done).length;
                const isOpen = expandedPanel === p.id;
                return (
                  <div key={p.id} className="myday-list">
                    <button className="myday-list-head" onClick={() => setExpandedPanel(isOpen ? null : p.id)}>
                      <span className="myday-list-dot" style={{ background: p.accent }} />
                      <span className="myday-list-title">{p.title}</span>
                      {items.length > 0 && <span className="myday-list-count">{done}/{items.length}</span>}
                      <span className="myday-list-arrow">{isOpen ? "\u25BE" : "\u25B8"}</span>
                    </button>
                    {isOpen && (
                      <div className="myday-list-items">
                        {active.map((t) => (
                          <div className="ttodo" key={t.id}>
                            <button className="tcheck" onClick={() => togglePanelItem(t.id, true)} aria-label="Done">
                              <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-8" /></svg>
                            </button>
                            <span className="ttodo-text">{t.body}</span>
                          </div>
                        ))}
                        {done > 0 && <div className="myday-list-done">{done} completed</div>}
                        {active.length === 0 && done === 0 && <div className="myday-list-empty">empty</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

        </div>
      )}

      <ConfettiBurst trigger={confetti} />
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
        </div>
      )}
      <PhoneTabs active="myday" />
    </div>
  );
}
