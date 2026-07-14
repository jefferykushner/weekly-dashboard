import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getWords, addWord, removeWordOnce } from "../lib/db";
import PhoneTabs from "./PhoneTabs";

// App palette for cloud words
const COLORS = ["#5B7FA6", "#4F9E78", "#E0A33E", "#C96F4A", "#8A6FB0", "#7A8B99", "#3F6E5E", "#B58A3C"];

// Deterministic hash so each word keeps its color/orientation between renders
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Spiral-placement word cloud layout (Wordle-style, collision-checked).
function layoutCloud(entries, W, H) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const placed = [];
  const cx = W / 2, cy = H / 2;
  const counts = entries.map((e) => e.count);
  const maxC = Math.max(...counts), minC = Math.min(...counts);
  const minF = 13, maxF = Math.min(72, Math.max(34, W / 10));
  const sizeFor = (c) =>
    maxC === minC ? (minF + maxF) / 2
    : minF + (maxF - minF) * Math.sqrt((c - minC) / (maxC - minC));

  const collides = (r) =>
    placed.some((p) => !(r.x + r.w < p.x || p.x + p.w < r.x || r.y + r.h < p.y || p.y + p.h < r.y));

  const out = [];
  // biggest first so they claim the center
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  for (const e of sorted) {
    const fs = sizeFor(e.count);
    const h = hash(e.word.toLowerCase());
    const vertical = e.count < maxC && h % 4 === 0; // some smaller words go vertical
    ctx.font = `600 ${fs}px 'Space Grotesk', sans-serif`;
    const tw = ctx.measureText(e.word).width;
    const bw = (vertical ? fs * 1.15 : tw) + 6;
    const bh = (vertical ? tw : fs * 1.15) + 4;

    // Archimedean spiral outward from center until a free spot is found
    let spot = null;
    const a = 4, b = 3.2, startAngle = (h % 360) * (Math.PI / 180);
    for (let t = 0; t < 3200; t += 1) {
      const ang = startAngle + t * 0.12;
      const rad = a + b * t * 0.12;
      const x = cx + rad * Math.cos(ang) - bw / 2;
      const y = cy + rad * 0.62 * Math.sin(ang) - bh / 2; // squash vertically for a wide cloud
      if (x < 0 || y < 0 || x + bw > W || y + bh > H) continue;
      const rect = { x, y, w: bw, h: bh };
      if (!collides(rect)) { spot = rect; break; }
    }
    if (!spot) continue; // no room; skip (cloud is full)
    placed.push(spot);
    out.push({
      word: e.word, count: e.count, fs, vertical,
      x: spot.x, y: spot.y, w: bw, h: bh,
      color: COLORS[h % COLORS.length],
    });
  }
  return out;
}

export default function Words() {
  const [rows, setRows] = useState(null);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState("");
  const boxRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 520 });

  const refresh = useCallback(async () => setRows(await getWords()), []);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const measure = () => {
      if (boxRef.current) {
        const r = boxRef.current.getBoundingClientRect();
        setDims({ w: Math.max(320, r.width - 8), h: Math.max(300, r.height - 8) });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // aggregate: case-insensitive counts, keep first-seen casing
  const entries = useMemo(() => {
    if (!rows) return [];
    const map = new Map();
    for (const r of rows) {
      const raw = r.body.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!map.has(key)) map.set(key, { word: raw, count: 0 });
      map.get(key).count++;
    }
    return [...map.values()];
  }, [rows]);

  const cloud = useMemo(
    () => (entries.length ? layoutCloud(entries, dims.w, dims.h) : []),
    [entries, dims]
  );

  const submit = async () => {
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setInput("");
    for (const p of parts) await addWord(p).catch(() => {});
    setFlash(parts.length > 1 ? `Added ${parts.length} words` : "Added");
    setTimeout(() => setFlash(""), 1500);
    refresh();
  };

  const clickWord = async (w) => {
    if (!window.confirm(`Remove one "${w.word}"? (${w.count} total)`)) return;
    await removeWordOnce(w.word).catch(() => {});
    refresh();
  };

  const total = rows ? rows.length : 0;

  return (
    <div className="words-root">
      <header className="words-head">
        <div>
          <span className="kicker">a picture of your days</span>
          <h1>Words</h1>
        </div>
        <div className="words-meta">
          <span className="words-count">{total} word{total === 1 ? "" : "s"} so far</span>
          <Link className="navlink words-back" to="/">dashboard</Link>
        </div>
      </header>

      <div className="words-addbar">
        <input
          value={input}
          placeholder="what was today about? (comma-separate to add several: grateful, patience, Carolyn)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button onClick={submit}>Add</button>
        {flash && <span className="words-flash">{flash}</span>}
      </div>

      <div className="words-canvas" ref={boxRef}>
        {!rows && <div className="words-empty">gathering your words…</div>}
        {rows && entries.length === 0 && (
          <div className="words-empty">
            Your cloud is empty. Add a word or two about today — it grows from here.
          </div>
        )}
        {cloud.map((w) => (
          <button
            key={w.word.toLowerCase()}
            className={"cloud-word" + (w.vertical ? " vert" : "")}
            style={{
              left: w.x, top: w.y, width: w.w, height: w.h,
              fontSize: w.fs, color: w.color,
            }}
            title={`${w.word} — ${w.count}×  (click to remove one)`}
            onClick={() => clickWord(w)}
          >
            {w.word}
          </button>
        ))}
      </div>

      <PhoneTabs active="words" />
    </div>
  );
}
