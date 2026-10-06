// A short two-note chime played on an incoming message — synthesized with
// the Web Audio API rather than shipping an audio file, so there's nothing
// to fetch/cache and no licensing to worry about. One shared AudioContext,
// created lazily on first use: browsers block audio before any user
// gesture has happened on the page, and constructing it eagerly at module
// load (before login) would throw in some browsers.
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
};

const playTone = (ctx: AudioContext, frequency: number, startTime: number, duration: number) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  // Quick fade in/out avoids an audible click at the start/end of the tone.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Best-effort — never throws, since a missed notification sound should
// never break the actual feature (the toast/chat-head still appears).
export const playMessageSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.12); // A5
    playTone(ctx, 1318.5, now + 0.1, 0.18); // E6
  } catch {
    // Ignore — autoplay restrictions or an unsupported browser.
  }
};
