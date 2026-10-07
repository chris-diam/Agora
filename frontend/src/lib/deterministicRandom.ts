// A tiny string hash turned into a stable "random" number in [0, 1) — used
// for things like a pinned note's tilt angle, where the value must look
// random across different cards but stay identical for the same card on
// every re-render (a real Math.random() would make cards jitter on every
// state update/re-fetch).
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  // Normalize the 32-bit signed int to [0, 1).
  return (hash >>> 0) / 4294967296;
}

// Maps a seed to a value in [min, max) — convenience wrapper for the
// common "pick a number in this range" case (tilt degrees, offsets, etc).
export function seededRange(seed: string, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}
