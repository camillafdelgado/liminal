"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSignalMonitor, type SignalState } from "@/lib/useSignalMonitor";
import { useUsageStore } from "@/lib/useUsageStore";

const STATE_LABELS: Record<SignalState, string> = {
  human: "HUMAN SIGNAL",
  anomaly: "ANOMALY DETECTED",
  ai: "AI INPUT FLAGGED",
};

function RingVisualizer({ state }: { state: SignalState }) {
  return (
    <div className="relative flex items-center justify-center py-8">
      <div
        className={`signal-ring signal-ring--outer signal-ring--${state}`}
        aria-hidden
      />
      <div
        className={`signal-ring signal-ring--mid signal-ring--${state}`}
        aria-hidden
      />
      <div
        className={`signal-ring signal-ring--inner signal-ring--${state}`}
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-xs uppercase tracking-[0.35em] signal-label--${state}`}
        >
          {STATE_LABELS[state]}
        </span>
        <span className="mt-3 font-mono text-[10px] text-muted-foreground">
          ring.sync.active
        </span>
      </div>
    </div>
  );
}

export default function SignalMonitorPage() {
  const monthlyPledge = useUsageStore((s) => s.monthlyPledge);
  const logToday = useUsageStore((s) => s.logToday);

  const {
    signalState,
    events,
    sessionHumanPercent,
    sessionAiPercent,
    hasSessionActivity,
    handlePaste,
    handleKeystroke,
    resetSession,
    getFinalHumanPercent,
    formatLogTime,
  } = useSignalMonitor();

  const logRef = useRef<HTMLDivElement>(null);
  const belowPledge = sessionHumanPercent < monthlyPledge;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [events]);

  const handleSyncSession = () => {
    logToday(getFinalHumanPercent());
  };

  return (
    <div
      className={`relative min-h-screen terminal-grid transition-colors duration-700 ${
        belowPledge ? "detect-warning" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F0D0B]" />

      <main className="relative mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {"// biometric.channel"}
            </p>
            <h1 className="font-mono text-2xl font-medium text-[var(--accent)] glow-text md:text-3xl">
              Signal Monitor
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Ring hardware simulation. Typing patterns mapped to finger movement
              and biosignal proxies.
            </p>
          </div>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[var(--accent)]"
          >
            ← Dashboard
          </Link>
        </header>

        <section
          className={`mb-8 rounded-lg border bg-card/80 px-5 py-4 backdrop-blur-sm transition-all duration-500 ${
            belowPledge
              ? "border-destructive/60 glow-warning"
              : "border-border/60"
          }`}
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Session telemetry</span>
            <span>
              pledge floor: {monthlyPledge}% human
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Human
              </p>
              <p
                className={`font-mono text-4xl font-medium ${
                  belowPledge ? "text-destructive" : "text-[var(--accent)]"
                } glow-text`}
              >
                {sessionHumanPercent}%
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                AI
              </p>
              <p className="font-mono text-4xl font-medium text-muted-foreground">
                {sessionAiPercent}%
              </p>
            </div>
          </div>

          <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${sessionHumanPercent}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground/40"
              style={{ left: `${monthlyPledge}%` }}
              title={`Pledge threshold: ${monthlyPledge}%`}
            />
          </div>

          {belowPledge && (
            <p className="mt-4 font-mono text-xs text-destructive">
              ⚠ THRESHOLD BREACH — AI signal exceeds pledge tolerance. Session
              flagged.
            </p>
          )}
        </section>

        <section className="mb-8 rounded-lg border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
          <RingVisualizer state={signalState} />
        </section>

        <section className="mb-8">
          <label
            htmlFor="work-surface"
            className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Work surface — monitored
          </label>
          <textarea
            id="work-surface"
            className="min-h-48 w-full resize-y rounded-lg border border-border/60 bg-[#0F0D0B]/80 px-4 py-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            placeholder="Begin working. Paste, pause-and-burst, and typing velocity are observed silently..."
            spellCheck={false}
            onPaste={handlePaste}
            onKeyDown={handleKeystroke}
          />
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            Events captured in background. No data leaves this session.
          </p>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Event log
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">
              {events.length} entries
            </span>
          </div>
          <div
            ref={logRef}
            className="event-log max-h-56 overflow-y-auto rounded-lg border border-border/40 bg-[#0A0908] px-4 py-3 font-mono text-xs leading-6"
          >
            {events.length === 0 ? (
              <p className="text-muted-foreground/60">
                {"// awaiting signal..."}
              </p>
            ) : (
              events.map((event) => (
                <p key={event.id} className="text-[var(--accent)]">
                  <span className="text-muted-foreground">
                    [{formatLogTime(event.timestamp)}]
                  </span>{" "}
                  {event.type} — AI confidence: {event.confidence}%
                </p>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSyncSession}
            disabled={!hasSessionActivity}
            className="bg-[var(--accent)] font-mono text-xs uppercase tracking-widest text-primary-foreground hover:bg-[var(--accent-muted)] disabled:opacity-40"
          >
            End & sync session
          </Button>
          <Button
            variant="outline"
            onClick={resetSession}
            className="border-border font-mono text-xs uppercase tracking-widest hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
          >
            Reset monitor
          </Button>
        </div>

        <footer className="mt-16 border-t border-border pt-6">
          <p className="font-mono text-xs text-muted-foreground">
            liminal signal monitor v0.1 — near-future biometric interface
          </p>
        </footer>
      </main>
    </div>
  );
}
