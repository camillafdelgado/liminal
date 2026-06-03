import type { SignalState } from "@/lib/useSignalMonitor";

const PATTERNS: Record<Exclude<SignalState, "human">, number | number[]> = {
  anomaly: [60, 40, 60],
  ai: [100, 50, 100, 50, 160],
};

export function triggerDetectionHaptic(state: SignalState): void {
  if (state === "human") return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(PATTERNS[state]);
}

export function hapticsSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}
