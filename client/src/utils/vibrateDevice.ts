export function vibrateDevice(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;

  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    navigator.vibrate([200, 100, 200]);
    return;
  }

  // iOS blocks navigator.vibrate by design; this is only a best-effort user-gesture fallback.
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.001;
    oscillator.frequency.value = 1;
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 150);
  } catch {
    // Visual shake remains the reliable fallback on iOS.
  }
}
