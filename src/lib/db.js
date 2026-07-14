import { supabase } from "./supabase";
import { toISO, addDays } from "./dates";

// ---------------------------------------------------------------
//  Offline capture queue
//  If a capture fails (no signal in a tunnel), we stash it in
//  localStorage and flush it the next time we are online.
//  Queue items carry their full payload so events sync too.
// ---------------------------------------------------------------
const QKEY = "capture_queue_v1";

const readQueue = () => {
  try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); }
  catch { return []; }
};
const writeQueue = (q) => localStorage.setItem(QKEY, JSON.stringify(q));

export function queuedCount() {
  return readQueue().length;
}

// Insert one captured item. Always optimistic: never blocks the user.
async function captureItem(payload) {
  try {
    const { error } = await supabase.from("tasks").insert(payload);
    if (error) throw error;
    return { offline: false };
  } catch (e) {
    const q = readQueue();
    q.push({ ...payload, at: Date.now() });
    writeQueue(q);
    return { offline: true };
  }
}

// Quick brain-dump capture.
export async function captureInbox(body) {
  const text = body.trim();
  if (!text) return { offline: false };
  return captureItem({ kind: "inbox", body: text });
}

// Capture a dated event/appointment straight from the phone.
export async function captureEvent(body, dt) {
  const text = body.trim();
  if (!text) return { offline: false };
  return captureItem({ kind: "event", body: text, dt });
}

// Try to push any queued captures to the server.
export async function flushQueue() {
  let q = readQueue();
  if (!q.length) return 0;
  const remaining = [];
  let sent = 0;
  for (const item of q) {
    const { at, ...payload } = item;
    try {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) throw error;
      sent++;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return sent;
}

// ---------------------------------------------------------------
//  Generic task helpers
// ---------------------------------------------------------------
export async function addTask({ kind, body, dt = null, panel_id = null, position = 0 }) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ kind, body, dt, panel_id, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setDone(id, done) {
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function setBody(id, body) {
  const { error } = await supabase.from("tasks").update({ body }).eq("id", id);
  if (error) throw error;
}

export async function setDate(id, dt) {
  const { error } = await supabase.from("tasks").update({ dt }).eq("id", id);
  if (error) throw error;
}

export async function delTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// Move a brain-dump item onto a specific day (becomes a checkable to-do).
export async function moveToDay(id, iso) {
  const { error } = await supabase
    .from("tasks")
    .update({ kind: "day", dt: iso, done: false })
    .eq("id", id);
  if (error) throw error;
}

// Move a brain-dump item into one of the project lists.
export async function moveToPanel(id, panel_id) {
  const { error } = await supabase
    .from("tasks")
    .update({ kind: "panel", panel_id, dt: null, done: false })
    .eq("id", id);
  if (error) throw error;
}

// Set an event's recurrence ('none' | 'daily' | 'weekdays' | 'weekly').
export async function setRecur(id, recur) {
  const { error } = await supabase.from("tasks").update({ recur }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------
//  Week / theme
// ---------------------------------------------------------------
export async function getTheme(weekStartISO) {
  const { data } = await supabase
    .from("weeks")
    .select("theme")
    .eq("week_start", weekStartISO)
    .maybeSingle();
  return data ? data.theme : "";
}

export async function setTheme(weekStartISO, theme) {
  const { error } = await supabase
    .from("weeks")
    .upsert({ week_start: weekStartISO, theme }, { onConflict: "user_id,week_start" });
  if (error) throw error;
}

// ---------------------------------------------------------------
//  Habits
// ---------------------------------------------------------------
export async function getHabits() {
  const { data } = await supabase.from("habits").select("*").order("position");
  return data || [];
}

export async function getHabitMarks(fromISO, toDateISO) {
  const { data } = await supabase
    .from("habit_marks")
    .select("habit_id, dt")
    .gte("dt", fromISO)
    .lte("dt", toDateISO);
  return data || [];
}

export async function toggleHabitMark(habit_id, dt, on) {
  if (on) {
    const { error } = await supabase.from("habit_marks").insert({ habit_id, dt });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("habit_marks").delete().eq("habit_id", habit_id).eq("dt", dt);
    if (error) throw error;
  }
}

export async function addHabit(name, position) {
  const { data, error } = await supabase
    .from("habits")
    .insert({ name, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameHabit(id, name) {
  const { error } = await supabase.from("habits").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteHabit(id) {
  // habit_marks cascade-delete via the foreign key
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw error;
}

// Write a new ordering: each habit's position becomes its index in the list.
export async function persistHabitOrder(orderedIds) {
  await Promise.all(
    orderedIds.map((id, i) => supabase.from("habits").update({ position: i }).eq("id", id))
  );
}

// ---------------------------------------------------------------
//  Panels
// ---------------------------------------------------------------
export async function getPanels() {
  const { data } = await supabase.from("panels").select("*").order("position");
  return data || [];
}

export async function addPanel(title, accent, position) {
  const { data, error } = await supabase
    .from("panels")
    .insert({ title, accent, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renamePanel(id, title) {
  const { error } = await supabase.from("panels").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deletePanel(id) {
  // tasks with this panel_id cascade-delete via the foreign key
  const { error } = await supabase.from("panels").delete().eq("id", id);
  if (error) throw error;
}

export async function persistPanelOrder(orderedIds) {
  await Promise.all(
    orderedIds.map((id, i) => supabase.from("panels").update({ position: i }).eq("id", id))
  );
}

// ---------------------------------------------------------------
//  Bulk load for the dashboard
// ---------------------------------------------------------------
export async function loadWeek(weekStart) {
  const startISO = toISO(weekStart);
  const endISO = toISO(addDays(weekStart, 6));
  const today = toISO(new Date());

  const [panels, habits, marks, theme, allTasks, todoMarks] = await Promise.all([
    getPanels(),
    getHabits(),
    getHabitMarks(startISO, endISO),
    getTheme(startISO),
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true })
      .then((r) => r.data || []),
    getTaskMarks(startISO, endISO),
  ]);

  const priorities = allTasks.filter((t) => t.kind === "priority" && t.dt === startISO);
  const panelItems = allTasks.filter((t) => t.kind === "panel");
  const inbox = allTasks.filter((t) => t.kind === "inbox" && !t.done);
  const isRec = (t) => t.recur && t.recur !== "none";
  const dayInWeek = allTasks.filter((t) => t.kind === "day" && !isRec(t) && t.dt >= startISO && t.dt <= endISO);
  const recurringTodos = allTasks.filter((t) => t.kind === "day" && isRec(t));
  const events = allTasks.filter((t) => t.kind === "event"); // all events; recurrence is computed per day
  // overdue = a dated one-off TO-DO before today, still not done (events/recurring never roll over)
  const overdue = allTasks.filter((t) => t.kind === "day" && !isRec(t) && !t.done && t.dt && t.dt < today);

  return { startISO, endISO, panels, habits, marks, theme, priorities, panelItems, inbox, dayInWeek, recurringTodos, todoMarks, events, overdue };
}

// ---------------------------------------------------------------
//  Recurring to-do occurrences
// ---------------------------------------------------------------
export async function getTaskMarks(fromISO, toISO) {
  const { data } = await supabase
    .from("task_marks")
    .select("task_id, dt, done, removed")
    .gte("dt", fromISO)
    .lte("dt", toISO);
  return data || [];
}

export async function setTaskMark(task_id, dt, patch) {
  const { error } = await supabase
    .from("task_marks")
    .upsert({ task_id, dt, ...patch }, { onConflict: "task_id,dt" });
  if (error) throw error;
}

// ---------------------------------------------------------------
//  Word cloud
// ---------------------------------------------------------------
export async function getWords() {
  const { data } = await supabase.from("words").select("id, body, created_at").order("created_at");
  return data || [];
}

export async function addWord(body) {
  const { data, error } = await supabase.from("words").insert({ body }).select().single();
  if (error) throw error;
  return data;
}

// Remove ONE occurrence of a word (most recent first).
export async function removeWordOnce(body) {
  const { data } = await supabase
    .from("words")
    .select("id")
    .ilike("body", body)
    .order("created_at", { ascending: false })
    .limit(1);
  if (data && data.length) {
    const { error } = await supabase.from("words").delete().eq("id", data[0].id);
    if (error) throw error;
    return true;
  }
  return false;
}

// Load a single day's events + to-dos + habit state (for the phone Today view).
// Returns ALL events; the caller decides which occur on the day (recurrence).
export async function loadDay(iso) {
  const [dayRes, eventsRes, habits, marksRes, todoMarks] = await Promise.all([
    supabase.from("tasks").select("*").eq("kind", "day").order("created_at", { ascending: true }),
    supabase.from("tasks").select("*").eq("kind", "event").order("created_at", { ascending: true }),
    getHabits(),
    supabase.from("habit_marks").select("habit_id").eq("dt", iso),
    getTaskMarks(iso, iso),
  ]);
  const all = dayRes.data || [];
  const isRec = (t) => t.recur && t.recur !== "none";
  const marked = new Set((marksRes.data || []).map((m) => m.habit_id));
  return {
    todos: all.filter((t) => !isRec(t) && t.dt === iso),
    recTodos: all.filter(isRec),
    todoMarks,
    events: eventsRes.data || [],
    habits,
    marked,
  };
}