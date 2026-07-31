import React, { useState } from "react";
import { CHORE_FREQ_LABEL } from "../lib/dates";
import { GrowText } from "./parts";
import ProgressRing from "./ProgressRing";

export default function ChoresPanel({
  chores, completions, isDone,
  onToggle, onAdd, onRename, onDelete, onFreq, onMove, editMode,
}) {
  const [newName, setNewName] = useState("");
  const [newFreq, setNewFreq] = useState("weekly");
  const doneCount = chores.filter((c) => isDone(c)).length;

  const submit = () => {
    const t = newName.trim();
    if (!t) return;
    onAdd(t, newFreq);
    setNewName("");
  };

  // Group by frequency for visual clarity
  const groups = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "biweekly", label: "Every 2 weeks" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <div className="panel chores-panel">
      <div className="panel-head">
        <span className="dot" style={{ background: "#B58A3C" }} />
        <h3>Chores</h3>
        {chores.length > 0 && <ProgressRing done={doneCount} total={chores.length} />}
      </div>

      {chores.length === 0 && !editMode ? (
        <div className="chore-empty">
          <p>Track household tasks that cycle — weekly, biweekly, monthly. They reset automatically.</p>
        </div>
      ) : null}

      <div className="chore-list">
        {groups.map((g) => {
          const items = chores.filter((c) => c.frequency === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key} className="chore-group">
              <div className="chore-group-label">{g.label}</div>
              {items.map((c, idx) => {
                const done = isDone(c);
                return (
                  <ChoreRow
                    key={c.id}
                    chore={c}
                    done={done}
                    editMode={editMode}
                    onToggle={() => onToggle(c, !done)}
                    onRename={(n) => onRename(c.id, n)}
                    onDelete={() => onDelete(c.id)}
                    onFreq={(f) => onFreq(c.id, f)}
                    onUp={idx > 0 ? () => onMove(chores.indexOf(c), -1) : null}
                    onDown={idx < items.length - 1 ? () => onMove(chores.indexOf(c), 1) : null}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="chore-add">
        <input
          value={newName}
          placeholder="+ add chore"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <select value={newFreq} onChange={(e) => setNewFreq(e.target.value)} className="chore-freq-select">
          {Object.entries(CHORE_FREQ_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ChoreRow({ chore, done, editMode, onToggle, onRename, onDelete, onFreq, onUp, onDown }) {
  const [name, setName] = useState(chore.name);
  const [freqMenu, setFreqMenu] = useState(false);
  return (
    <div className={"chore-row" + (done ? " done" : "")}>
      {editMode ? (
        <>
          <span className="reorder">
            <button onClick={onUp} disabled={!onUp} aria-label="Up">▲</button>
            <button onClick={onDown} disabled={!onDown} aria-label="Down">▼</button>
          </span>
          <input
            className="chore-name-edit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { if (name.trim() && name !== chore.name) onRename(name.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
          <div className="move-wrap">
            <button className="chore-freq-btn" onClick={() => setFreqMenu((m) => !m)}>
              {CHORE_FREQ_LABEL[chore.frequency]}
            </button>
            {freqMenu && (
              <div className="move-menu">
                {Object.entries(CHORE_FREQ_LABEL).map(([k, v]) => (
                  <button key={k} className={chore.frequency === k ? "sel" : ""}
                    onClick={() => { setFreqMenu(false); onFreq(k); }}>{v}</button>
                ))}
              </div>
            )}
          </div>
          <button className="del" onClick={onDelete} aria-label="Delete">×</button>
        </>
      ) : (
        <>
          <button
            className={"chore-check" + (done ? " on" : "")}
            onClick={onToggle}
            aria-label={done ? "Mark not done" : "Mark done"}
          >
            <svg viewBox="0 0 16 16" className="tick"><path d="M3 8.5l3 3 7-8" /></svg>
          </button>
          <span className="chore-name">{chore.name}</span>
          <span className="chore-freq-tag">{CHORE_FREQ_LABEL[chore.frequency]}</span>
        </>
      )}
    </div>
  );
}
