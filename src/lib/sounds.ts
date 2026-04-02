"use client";

/**
 * Sound effects using Web Audio API — no external files needed.
 * Generates fun, kid-friendly tones programmatically.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3,
  delay: number = 0
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Silently fail if audio not available
  }
}

/** Correct answer — happy ascending ding */
export function playCorrect() {
  playTone(523, 0.15, "sine", 0.25, 0);      // C5
  playTone(659, 0.15, "sine", 0.25, 0.1);     // E5
  playTone(784, 0.25, "sine", 0.3, 0.2);      // G5
}

/** Wrong answer — soft descending buzz */
export function playWrong() {
  playTone(330, 0.2, "triangle", 0.2, 0);     // E4
  playTone(262, 0.3, "triangle", 0.15, 0.15); // C4
}

/** Tap/select — subtle click */
export function playTap() {
  playTone(880, 0.05, "sine", 0.15, 0);       // A5 quick tap
}

/** Combo hit — rising excitement */
export function playCombo(comboCount: number) {
  const baseFreq = 523 + (comboCount * 50); // Gets higher with more combo
  playTone(baseFreq, 0.1, "sine", 0.2, 0);
  playTone(baseFreq * 1.25, 0.1, "sine", 0.25, 0.08);
  playTone(baseFreq * 1.5, 0.15, "sine", 0.3, 0.16);
}

/** Level complete — triumphant fanfare */
export function playComplete() {
  // C major arpeggio + high finish
  playTone(523, 0.15, "sine", 0.2, 0);        // C5
  playTone(659, 0.15, "sine", 0.2, 0.12);     // E5
  playTone(784, 0.15, "sine", 0.2, 0.24);     // G5
  playTone(1047, 0.3, "sine", 0.3, 0.36);     // C6
  // Harmony
  playTone(523, 0.4, "triangle", 0.1, 0.36);  // C5 undertone
  playTone(784, 0.4, "triangle", 0.1, 0.36);  // G5 undertone
}

/** XP gain — sparkly rising */
export function playXP() {
  playTone(1200, 0.08, "sine", 0.15, 0);
  playTone(1400, 0.08, "sine", 0.15, 0.06);
  playTone(1600, 0.1, "sine", 0.2, 0.12);
}

/** Streak milestone — epic chord */
export function playStreak() {
  playTone(523, 0.4, "sine", 0.15, 0);
  playTone(659, 0.4, "sine", 0.15, 0);
  playTone(784, 0.4, "sine", 0.15, 0);
  playTone(1047, 0.5, "sine", 0.2, 0.2);
}

/** Button press — subtle pop */
export function playPop() {
  playTone(600, 0.06, "sine", 0.12, 0);
  playTone(800, 0.04, "sine", 0.1, 0.04);
}
