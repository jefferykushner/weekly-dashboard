import React, { useEffect, useState } from "react";

const EMOJIS = ["🎉", "✨", "⭐", "🌟", "💪", "🔥", "🥳", "👏"];
const COLORS = ["#E0A33E", "#4F9E78", "#DD6B53", "#6E8BA6", "#9B7BB5", "#f4d088"];

function Particle({ x, emoji, color, delay }) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 100;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist - 40; // bias upward
  const rot = Math.random() * 360;
  const scale = 0.6 + Math.random() * 0.6;
  return (
    <span
      className="confetti-particle"
      style={{
        left: x,
        animationDelay: delay + "ms",
        "--dx": dx + "px",
        "--dy": dy + "px",
        "--rot": rot + "deg",
        "--scale": scale,
        color: color,
        fontSize: emoji ? 18 * scale : 10,
      }}
    >
      {emoji || "●"}
    </span>
  );
}

export default function ConfettiBurst({ trigger }) {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (trigger > 0) {
      const id = Date.now();
      const particles = Array.from({ length: 24 }, (_, i) => ({
        key: id + "-" + i,
        x: "50%",
        emoji: i < 6 ? EMOJIS[i % EMOJIS.length] : null,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 150,
      }));
      setBursts((b) => [...b, { id, particles }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1800);
    }
  }, [trigger]);

  if (!bursts.length) return null;
  return (
    <div className="confetti-container" aria-hidden="true">
      {bursts.map((b) =>
        b.particles.map((p) => <Particle key={p.key} {...p} />)
      )}
    </div>
  );
}
