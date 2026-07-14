// Suggestions for the weekly intention line.
// Mix of short scripture (public domain), intention prompts, and
// lines generated from the user's own data (words, lists).

export const VERSES = [
  "Be still, and know that I am God. — Ps 46:10",
  "This is the day the Lord has made; rejoice in it. — Ps 118:24",
  "Walk by faith, not by sight. — 2 Cor 5:7",
  "Let all that you do be done in love. — 1 Cor 16:14",
  "Do not be anxious about anything. — Phil 4:6",
  "My grace is sufficient for thee. — 2 Cor 12:9",
  "Trust in the Lord with all thine heart. — Prov 3:5",
  "Whatever you do, work at it with all your heart. — Col 3:23",
  "Be strong and of a good courage. — Josh 1:9",
  "A soft answer turneth away wrath. — Prov 15:1",
  "Seek ye first the kingdom of God. — Matt 6:33",
  "Love one another, as I have loved you. — John 13:34",
  "The joy of the Lord is your strength. — Neh 8:10",
  "Come to me, all who are weary, and I will give you rest. — Matt 11:28",
  "Let your light so shine before men. — Matt 5:16",
];

export const PROMPTS = [
  "Steady beats perfect.",
  "One thing at a time, finished.",
  "Presence over productivity this week.",
  "Small steps, kept promises.",
  "Protect the mornings.",
  "Say the encouraging thing out loud.",
  "Slow down enough to notice.",
  "Grace first — for others and yourself.",
  "Start before you feel ready.",
  "Leave things better than you found them.",
  "Listen twice as much as you speak.",
  "Gratitude before frustration.",
  "Do the hard thing first.",
  "Be where your feet are.",
  "This week, choose patience on purpose.",
];

// Deterministic pseudo-random pick, seeded by day + offset,
// so the suggestion is stable all day but shuffles on demand.
function pick(list, seed) {
  return list[seed % list.length];
}

export function buildSuggestions(model, topWords) {
  const out = [];
  // Personal: from the word cloud
  if (topWords && topWords.length) {
    const w = topWords[0];
    out.push(`More "${w}" — it keeps showing up for a reason.`);
    if (topWords[1]) out.push(`A ${topWords[1]} kind of week.`);
  }
  // Personal: nudge one lingering unchecked list item
  if (model && model.panelItems) {
    const open = model.panelItems.filter((t) => !t.done && t.body && t.body.length < 60);
    if (open.length) {
      const item = open[Math.floor(open.length / 2)];
      out.push(`Clear one lingering thing: "${item.body.trim()}"`);
    }
  }
  return out;
}

export function suggestionFor(daySeed, shuffleOffset, personal) {
  // Rotate across three pools: verse, prompt, personal (when available)
  const pools = personal && personal.length
    ? [VERSES, PROMPTS, personal]
    : [VERSES, PROMPTS];
  const which = (daySeed + shuffleOffset) % pools.length;
  const pool = pools[which];
  return pick(pool, Math.floor((daySeed + shuffleOffset) / pools.length) + daySeed);
}
