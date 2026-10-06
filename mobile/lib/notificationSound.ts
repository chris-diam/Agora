import { createAudioPlayer } from "expo-audio";

// Synthesized the same two-note chime as the web app's lib/notificationSound.ts
// into a bundled WAV asset (see assets/notification.wav) — expo-audio plays
// local sound assets rather than synthesizing tones at runtime the way the
// Web Audio API does, so there's nothing to replicate dynamically here.
// A fresh player per call avoids overlap/replay issues if messages arrive
// in quick succession; it's released right after it finishes.
export const playMessageSound = () => {
  try {
    const player = createAudioPlayer(require("../assets/notification.wav"));
    player.play();
    setTimeout(() => player.remove(), 1000);
  } catch {
    // Best-effort — never breaks the actual message-received handling.
  }
};
