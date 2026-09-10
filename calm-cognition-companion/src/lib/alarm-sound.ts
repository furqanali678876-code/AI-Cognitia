/**
 * Loud, repeating two-tone alarm built with the Web Audio API so it needs no
 * audio files and keeps ringing until the person answers the reminder.
 */
let context: AudioContext | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let vibrateInterval: ReturnType<typeof setInterval> | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function chime(volume: number) {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, 0.42].forEach((offset, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = index === 0 ? 880 : 660;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.02, volume), now + offset + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.38);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.4);
  });
}

function canVibrate() {
  return (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    (navigator.userActivation?.hasBeenActive ?? false)
  );
}

export function startAlarm({ volume = 0.9, vibrate = true }: { volume?: number; vibrate?: boolean }) {
  stopAlarm();
  chime(volume);
  interval = setInterval(() => chime(volume), 1100);
  if (vibrate && canVibrate()) {
    navigator.vibrate?.([600, 300, 600]);
    vibrateInterval = setInterval(() => navigator.vibrate?.([600, 300, 600]), 2000);
  }
}

export function stopAlarm() {
  if (interval) clearInterval(interval);
  interval = null;
  if (vibrateInterval) clearInterval(vibrateInterval);
  vibrateInterval = null;
  if (canVibrate()) navigator.vibrate?.(0);
}

/** Browsers require a gesture before audio can play — call this on first tap. */
export function primeAudio() {
  ensureContext();
}
