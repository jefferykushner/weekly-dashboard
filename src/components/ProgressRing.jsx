import React from "react";

export default function ProgressRing({ done, total, size = 38, stroke = 3.5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  const offset = circ * (1 - pct);
  const complete = pct >= 1;

  return (
    <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--line)" strokeWidth={stroke}
      />
      <circle
        className={"progress-ring-fill" + (complete ? " complete" : "")}
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={complete ? "var(--done)" : "var(--today)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        className="progress-ring-text"
      >
        {complete ? "✓" : `${done}`}
      </text>
    </svg>
  );
}
