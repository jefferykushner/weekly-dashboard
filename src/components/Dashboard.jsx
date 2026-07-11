import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  getMonday, addDays, toISO, todayISO, DAY_NAMES, MONTHS, eventOccursOn,
} from "../lib/dates";
import {
  loadWeek, addTask, setDone, setBody, delTask, setDate,
  setTheme, toggleHabitMark, getPanels, getHabits,
  addHabit, renameHabit, deleteHabit, moveToDay, moveToPanel, persistHabitOrder, setRecur,
  addPanel, renamePanel, deletePanel, persistPanelOrder,
} from "../lib/db";
import { Panel, DayColumn, Row, AddRow, EditableName } from "./parts";
import RolloverNudge from "./RolloverNudge";

const DEFAULT_PANELS = [
  { title: "Work", accent: "#6E8BA6", position: 0 },
  { title: "Personal", accent: "#9B7BB5", position: 1 },
  { title: "Reminders", accent: "#DD6B53", position: 2 },
];
const DEFAULT_HABITS = ["Meds", "Water", "Move", "Sleep by 11"];

const markKey = (h, d) => `${h}|${d}`;

export default function Dashboard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [model, setModel] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [themeDraft, setThemeDraft] = useState("");
  const [habitEdit, setHabitEdit] = useState(false); // unified edit mode (panels + habits)
  const editMode = habitEdit;
  const setEditMode = setHabitEdit;

  const mon = getMonday(addDays(new Date(), weekOffset * 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const startISO = toISO(mon);
  const today = todayISO();

  // first-run seeding
  const ensureSeed = useCallback(async () => {
    const panels = await getPanels();
    if (panels.length === 0) {
      await supabase.from("panels").insert(DEFAULT_PANELS);
    }
    const habits = await getHabits();
    if (habits.length === 0) {
      await supabase.from("habits").insert(DEFAULT_HABITS.map((name, i) => ({ name, position: i })));
    }
  }, []);

  const refresh = useCallback(async () => {
    const d = await loadWeek(mon);
    const markSet = new Set(d.marks.map((m) => markKey(m.habit_id, m.dt)));
    setModel({
      theme: d.theme,
      panels: d.panels,
      habits: d.habits,
      marks: markSet,
      priorities: d.priorities,
      panelItems: d.panelItems,
      dayInWeek: d.dayInWeek,
      events: d.events,
      inbox: d.inbox,
    });
    setThemeDraft(d.theme || "");
    setOverdue(d.overdue);
  }, [startISO]);

  useEffect(() => {
    (async () => {
      await ensureSeed();
      await refresh();
    })();
  }, [refresh, ensureSeed]);

  // theme debounce
  useEffect(() => {
    if (!model) return;
    const t = setTimeout(() => {
      if (themeDraft !== model.theme) setTheme(startISO, themeDraft).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [themeDraft]); // eslint-disable-line

  if (!model) {
    return (
      <div className="dash-root" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>opening your week…</div>
      </div>
    );
  }

  // ---- optimistic mutators ----
  const patchList = (key, fn) => setModel((m) => ({ ...m, [key]: fn(m[key]) }));
  const toggleIn = (key) => (id, done) => {
    patchList(key, (l) => l.map((x) => (x.id === id ? { ...x, done } : x)));
    setDone(id, done).catch(() => {});
  };
  const editIn = (key) => (id, body) => {
    patchList(key, (l) => l.map((x) => (x.id === id ? { ...x, body } : x)));
    setBody(id, body).catch(() => {});
  };
  const removeIn = (key) => (id) => {
    patchList(key, (l) => l.filter((x) => x.id !== id));
    delTask(id).catch(() => {});
  };
  const addIn = (key, payload) => async (body) => {
    const row = await addTask({ ...payload, body });
    patchList(key, (l) => [...l, row]);
  };

  // Brain dump: checking an item clears it from view (brief fade first).
  // The row stays in the database marked done, but the dump only shows live thoughts.
  const [leavingIds, setLeavingIds] = useState(() => new Set());
  const checkOffInbox = (id, done) => {
    if (!done) {
      toggleIn("inbox")(id, false);
      return;
    }
    setDone(id, true).catch(() => {});
    setLeavingIds((s) => new Set(s).add(id));
    setTimeout(() => {
      setModel((m) => ({ ...m, inbox: m.inbox.filter((x) => x.id !== id) }));
      setLeavingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }, 850);
  };

  // Clear completed items out of a list or day (deletes them).
  const clearDone = (key, match) => () => {
    const goners = model[key].filter((x) => x.done && match(x));
    patchList(key, (l) => l.filter((x) => !(x.done && match(x))));
    goners.forEach((g) => delTask(g.id).catch(() => {}));
  };

  // ---- nudge handlers ----
  const nudgeMove = async (it) => {
    setOverdue((o) => o.filter((x) => x.id !== it.id));
    await setDate(it.id, today).catch(() => {});
    setDirty(true);
  };
  const nudgeKeep = (it) => setOverdue((o) => o.filter((x) => x.id !== it.id));
  const nudgeDrop = async (it) => {
    setOverdue((o) => o.filter((x) => x.id !== it.id));
    await setDone(it.id, true).catch(() => {});
    setDirty(true);
  };
  const closeNudge = async () => {
    setOverdue([]);
    if (dirty) { setDirty(false); await refresh(); }
  };

  // ---- habit management ----
  const onAddHabit = async (name) => {
    const pos = model.habits.length ? Math.max(...model.habits.map((h) => h.position || 0)) + 1 : 0;
    const row = await addHabit(name, pos);
    setModel((m) => ({ ...m, habits: [...m.habits, row] }));
  };
  const onRenameHabit = (id, name) => {
    setModel((m) => ({ ...m, habits: m.habits.map((h) => (h.id === id ? { ...h, name } : h)) }));
    renameHabit(id, name).catch(() => {});
  };
  const onDeleteHabit = (id) => {
    setModel((m) => ({ ...m, habits: m.habits.filter((h) => h.id !== id) }));
    deleteHabit(id).catch(() => {});
  };
  const onMoveHabit = (index, dir) => {
    const arr = [...model.habits];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    const reordered = arr.map((h, i) => ({ ...h, position: i }));
    setModel((m) => ({ ...m, habits: reordered }));
    persistHabitOrder(reordered.map((h) => h.id)).catch(() => {});
  };

  // ---- panel management ----
  const PANEL_COLORS = ["#6E8BA6", "#9B7BB5", "#DD6B53", "#4F9E78", "#C49B95", "#7FA6C9", "#B58A3C"];
  const onAddPanel = async () => {
    const pos = model.panels.length ? Math.max(...model.panels.map((p) => p.position || 0)) + 1 : 0;
    const accent = PANEL_COLORS[model.panels.length % PANEL_COLORS.length];
    const row = await addPanel("New list", accent, pos);
    setModel((m) => ({ ...m, panels: [...m.panels, row] }));
  };
  const onRenamePanel = (id, title) => {
    setModel((m) => ({ ...m, panels: m.panels.map((p) => (p.id === id ? { ...p, title } : p)) }));
    renamePanel(id, title).catch(() => {});
  };
  const onDeletePanel = (id) => {
    if (!window.confirm("Delete this list and everything in it?")) return;
    setModel((m) => ({
      ...m,
      panels: m.panels.filter((p) => p.id !== id),
      panelItems: m.panelItems.filter((t) => t.panel_id !== id),
    }));
    deletePanel(id).catch(() => {});
  };
  const onMovePanel = (index, dir) => {
    const arr = [...model.panels];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    const reordered = arr.map((p, i) => ({ ...p, position: i }));
    setModel((m) => ({ ...m, panels: reordered }));
    persistPanelOrder(reordered.map((p) => p.id)).catch(() => {});
  };

  // ---- move a brain-dump item onto a day ----
  const dayOptions = weekDates.map((d, i) => ({
    iso: toISO(d),
    label: `${DAY_NAMES[i]} ${d.getDate()}`,
    isToday: toISO(d) === today,
  }));
  const moveInboxToDay = (id, iso) => {
    setModel((m) => {
      const item = m.inbox.find((x) => x.id === id);
      const inbox = m.inbox.filter((x) => x.id !== id);
      const inWeek = iso >= startISO && iso <= toISO(addDays(mon, 6));
      const dayInWeek = inWeek && item
        ? [...m.dayInWeek, { ...item, kind: "day", dt: iso, done: false }]
        : m.dayInWeek;
      return { ...m, inbox, dayInWeek };
    });
    moveToDay(id, iso).catch(() => {});
  };

  const moveInboxToPanel = (id, panel_id) => {
    setModel((m) => {
      const item = m.inbox.find((x) => x.id === id);
      const inbox = m.inbox.filter((x) => x.id !== id);
      const panelItems = item
        ? [...m.panelItems, { ...item, kind: "panel", panel_id, dt: null, done: false }]
        : m.panelItems;
      return { ...m, inbox, panelItems };
    });
    moveToPanel(id, panel_id).catch(() => {});
  };

  const onRecurEvent = (id, recur) => {
    setModel((m) => ({ ...m, events: m.events.map((e) => (e.id === id ? { ...e, recur } : e)) }));
    setRecur(id, recur).catch(() => {});
  };

  const weekLabel = `${MONTHS[mon.getMonth()]} ${mon.getDate()} – ${MONTHS[addDays(mon, 6).getMonth()]} ${addDays(mon, 6).getDate()}`;

  return (
    <div className="dash-root">
      <div className="binding" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => <span key={i} className="coil" />)}
      </div>

      <div className="page">
        <header className="topbar">
          <div className="brand">
            <span className="kicker">the week of</span>
            <span className="weeklabel">{weekLabel}</span>
          </div>
          <div className="theme">
            <span className="kicker">intention</span>
            <input
              className="theme-input"
              value={themeDraft}
              placeholder="what's this week about?"
              onChange={(e) => setThemeDraft(e.target.value)}
            />
          </div>
          <div className="nav">
            <button className={"edit-toggle" + (editMode ? " on" : "")} onClick={() => setEditMode((e) => !e)}>
              {editMode ? "done" : "edit"}
            </button>
            <Link className="navlink" to="/capture" title="Phone capture">capture</Link>
            <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">‹</button>
            <button className={weekOffset === 0 ? "now" : ""} onClick={() => setWeekOffset(0)}>today</button>
            <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">›</button>
            <button className="signout" onClick={() => supabase.auth.signOut()} title="Sign out">⏻</button>
          </div>
        </header>

        <section className="week">
          {weekDates.map((d, i) => {
            const iso = toISO(d);
            const items = model.dayInWeek.filter((t) => t.dt === iso);
            const events = model.events.filter((ev) => eventOccursOn(ev, iso));
            return (
              <DayColumn
                key={iso}
                name={DAY_NAMES[i]}
                date={d}
                isToday={iso === today}
                items={items}
                events={events}
                onToggle={toggleIn("dayInWeek")}
                onEdit={editIn("dayInWeek")}
                onRemove={removeIn("dayInWeek")}
                onAdd={addIn("dayInWeek", { kind: "day", dt: iso })}
                onAddEvent={addIn("events", { kind: "event", dt: iso })}
                onEditEvent={editIn("events")}
                onRemoveEvent={removeIn("events")}
                onRecurEvent={onRecurEvent}
                onClearDone={clearDone("dayInWeek", (x) => x.dt === iso)}
              />
            );
          })}
        </section>

        <section className="lower">
          {/* Daily tracker */}
          <div className="panel habits">
            <div className="panel-head">
              <span className="dot" style={{ background: "var(--done)" }} />
              <h3>Daily tracker</h3>
            </div>
            <div className="habit-grid">
              <div className="habit-corner" />
              {weekDates.map((d, i) => (
                <div key={i} className={"habit-daycol" + (toISO(d) === today ? " today" : "")}>{DAY_NAMES[i][0]}</div>
              ))}
              {model.habits.map((h, idx) => (
                <React.Fragment key={h.id}>
                  <div className="habit-name">
                    {editMode
                      ? <EditableName
                          value={h.name}
                          onSave={(n) => onRenameHabit(h.id, n)}
                          onDelete={() => onDeleteHabit(h.id)}
                          onUp={() => onMoveHabit(idx, -1)}
                          onDown={() => onMoveHabit(idx, 1)}
                          canUp={idx > 0}
                          canDown={idx < model.habits.length - 1}
                        />
                      : h.name}
                  </div>
                  {weekDates.map((d) => {
                    const iso = toISO(d);
                    const on = model.marks.has(markKey(h.id, iso));
                    return (
                      <button
                        key={iso}
                        className={"habit-cell" + (on ? " on" : "") + (iso === today ? " today" : "")}
                        aria-label={`${h.name} ${iso}`}
                        disabled={editMode}
                        onClick={() => {
                          setModel((m) => {
                            const s = new Set(m.marks);
                            on ? s.delete(markKey(h.id, iso)) : s.add(markKey(h.id, iso));
                            return { ...m, marks: s };
                          });
                          toggleHabitMark(h.id, iso, !on).catch(() => {});
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            {editMode && <AddRow placeholder="+ add habit" onAdd={onAddHabit} subtle />}
          </div>

          {/* Brain dump */}
          <div className="panel braindump">
            <div className="panel-head">
              <span className="dot" style={{ background: "var(--ink)" }} />
              <h3>Brain dump</h3>
              <span className="hint">park it, sort later</span>
            </div>
            <div className="items">
              {model.inbox.filter((it) => !it.done || leavingIds.has(it.id)).map((it) => (
                <Row
                  key={it.id} item={it}
                  leaving={leavingIds.has(it.id)}
                  dayOptions={dayOptions}
                  onMove={(iso) => moveInboxToDay(it.id, iso)}
                  panelOptions={model.panels.map((p) => ({ id: p.id, title: p.title }))}
                  onMovePanel={(pid) => moveInboxToPanel(it.id, pid)}
                  onToggle={(d) => checkOffInbox(it.id, d)}
                  onEdit={(t) => editIn("inbox")(it.id, t)}
                  onRemove={() => removeIn("inbox")(it.id)}
                />
              ))}
            </div>
            <AddRow placeholder="dump anything…" onAdd={addIn("inbox", { kind: "inbox" })} />
          </div>

          {/* Your lists — renameable, reorderable */}
          {model.panels.map((p, idx) => (
            <Panel
              key={p.id}
              title={p.title}
              accent={p.accent}
              editMode={editMode}
              onRename={(t) => onRenamePanel(p.id, t)}
              onDelete={() => onDeletePanel(p.id)}
              onLeft={() => onMovePanel(idx, -1)}
              onRight={() => onMovePanel(idx, 1)}
              canLeft={idx > 0}
              canRight={idx < model.panels.length - 1}
              items={model.panelItems.filter((t) => t.panel_id === p.id)}
              onToggle={toggleIn("panelItems")}
              onEdit={editIn("panelItems")}
              onRemove={removeIn("panelItems")}
              onAdd={addIn("panelItems", { kind: "panel", panel_id: p.id })}
              onClearDone={clearDone("panelItems", (x) => x.panel_id === p.id)}
            />
          ))}

          {editMode && (
            <button className="panel add-panel" onClick={onAddPanel}>＋ add list</button>
          )}
        </section>
      </div>

      <RolloverNudge
        items={overdue}
        onMove={nudgeMove}
        onKeep={nudgeKeep}
        onDrop={nudgeDrop}
        onClose={closeNudge}
      />
    </div>
  );
}
