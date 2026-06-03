"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { BackNav } from "@/components/back-nav";
import { Button } from "@/components/ui/button";
import { hapticsSupported } from "@/lib/haptics";
import { useSignalMonitor, type SignalState } from "@/lib/useSignalMonitor";
import { useUsageStore } from "@/lib/useUsageStore";

const STATE_LABELS: Record<SignalState, string> = {
  human: "HUMAN SIGNAL",
  anomaly: "ANOMALY DETECTED",
  ai: "AI INPUT FLAGGED",
};

function RingVisualizer({
  state,
  shockwaveActive,
}: {
  state: SignalState;
  shockwaveActive: boolean;
}) {
  return (
    <div className="signal-ring-stage">
      {shockwaveActive && (
        <div className="signal-ring-stage__shockwaves" aria-hidden>
          <div className="signal-shockwave signal-shockwave--1" />
          <div className="signal-shockwave signal-shockwave--2" />
          <div className="signal-shockwave signal-shockwave--3" />
        </div>
      )}
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
      <div className="signal-ring-stage__label">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.35em] signal-label--${state}`}
        >
          {STATE_LABELS[state]}
        </span>
        <span className="mt-2 font-mono text-[10px] text-muted-foreground sm:mt-3">
          ring.sync.active
        </span>
      </div>
    </div>
  );
}

function BreachModal({
  pledge,
  onRedo,
  onAccept,
}: {
  pledge: number;
  onRedo: () => void;
  onAccept: () => void;
}) {
  return (
    <div className="breach-modal-overlay" role="dialog" aria-modal="true">
      <div className="breach-modal p-6">
        <p className="font-mono text-sm uppercase tracking-widest text-destructive">
          ⚠ SIGNAL BREACH DETECTED
        </p>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/85">
          <p>Your ring has flagged an AI input event.</p>
          <p>
            You have exceeded your{" "}
            <span className="font-mono text-[var(--accent)]">{pledge}%</span>{" "}
            human work pledge.
          </p>
          <p>A shock is being sent your way.</p>
          <p className="font-mono text-xs text-muted-foreground">
            This is your consequence.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={onRedo}
            className="w-full bg-[var(--accent)] font-mono text-xs uppercase tracking-widest text-primary-foreground hover:bg-[var(--accent-muted)]"
          >
            I&apos;ll redo this by hand
          </Button>
          <Button
            variant="outline"
            onClick={onAccept}
            className="w-full border-destructive/40 font-mono text-xs uppercase tracking-widest text-destructive hover:bg-destructive/10"
          >
            Log and accept
          </Button>
        </div>
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
    isTextareaLocked,
    showBreachModal,
    shockwaveActive,
    sessionBreached,
    pasteWarning,
    breachFlashActive,
    processPaste,
    resolveBreachRedo,
    resolveBreachAccept,
    handleKeystroke,
    resetSession,
    getFinalHumanPercent,
    formatLogTime,
  } = useSignalMonitor(monthlyPledge);

  const [workText, setWorkText] = useState("");
  const [preBreachText, setPreBreachText] = useState("");
  const [lastPasteConfidence, setLastPasteConfidence] = useState(87);
  const logRef = useRef<HTMLDivElement>(null);
  const [hapticsReady, setHapticsReady] = useState(false);

  const belowPledge = sessionHumanPercent < monthlyPledge;

  useEffect(() => {
    setHapticsReady(hapticsSupported());
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [events]);

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (isTextareaLocked) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const textarea = event.currentTarget;
    const start = textarea.selectionStart ?? workText.length;
    const end = textarea.selectionEnd ?? workText.length;
    const nextText =
      workText.slice(0, start) + pasted + workText.slice(end);

    const confidence = 85 + Math.floor(Math.random() * 11);
    setLastPasteConfidence(confidence);
    setPreBreachText(workText);

    processPaste(confidence);
    setWorkText(nextText);
  };

  const handleRedo = () => {
    setWorkText(preBreachText);
    resolveBreachRedo();
  };

  const handleAccept = () => {
    resolveBreachAccept(lastPasteConfidence);
  };

  const handleReset = () => {
    setWorkText("");
    setPreBreachText("");
    resetSession();
  };

  const handleSyncSession = () => {
    logToday(getFinalHumanPercent());
  };

  return (
    <div
      className={`relative min-h-screen terminal-grid transition-colors duration-700 ${
        breachFlashActive ? "breach-flash" : belowPledge ? "detect-warning" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F0D0B]" />

      {showBreachModal && (
        <BreachModal
          pledge={monthlyPledge}
          onRedo={handleRedo}
          onAccept={handleAccept}
        />
      )}

      <main className="relative mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="sticky top-0 z-30 -mx-6 border-b border-border/50 bg-[#0F0D0B]/90 px-6 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
          <BackNav />
        </div>

        <header className="mb-8 border-b border-border pb-6 pt-6">
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
        </header>

        <section
          className={`mb-8 rounded-lg border bg-card/80 px-5 py-4 backdrop-blur-sm transition-all duration-500 ${
            belowPledge || sessionBreached
              ? "border-destructive/60 glow-warning"
              : "border-border/60"
          }`}
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Session telemetry</span>
            <span>pledge floor: {monthlyPledge}% human</span>
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

          {sessionBreached && (
            <p className="mt-4 font-mono text-xs text-destructive">
              ⚠ PLEDGE BREACH LOGGED — session marked as pledged breached.
            </p>
          )}
          {belowPledge && !sessionBreached && (
            <p className="mt-4 font-mono text-xs text-destructive">
              ⚠ THRESHOLD BREACH — AI signal exceeds pledge tolerance. Session
              flagged.
            </p>
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-lg border border-border/60 bg-card/50 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8">
          <RingVisualizer
            state={signalState}
            shockwaveActive={shockwaveActive}
          />
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
            value={workText}
            onChange={(event) => setWorkText(event.target.value)}
            disabled={isTextareaLocked}
            className={`min-h-48 w-full resize-y rounded-lg border border-border/60 bg-[#0F0D0B]/80 px-4 py-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 ${
              isTextareaLocked
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            placeholder="Begin working. Paste, pause-and-burst, and typing velocity are observed silently..."
            spellCheck={false}
            onPaste={handlePaste}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key.length === 1 || event.key === "Backspace") {
                handleKeystroke();
              }
            }}
          />
          {pasteWarning && !isTextareaLocked && (
            <p className="mt-2 font-mono text-xs text-[var(--accent)]">
              AI input detected — {pasteWarning.sessionAiPercent}% of session.
              Pledge: {pasteWarning.pledge}%
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            Events captured in background. No data leaves this session.
            {hapticsReady
              ? " Shock haptic on pledge breach."
              : " Haptic feedback available on supported mobile browsers."}
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
                <p
                  key={event.id}
                  className={
                    event.type.includes("BREACH")
                      ? "text-destructive"
                      : "text-[var(--accent)]"
                  }
                >
                  <span className="text-muted-foreground">
                    [{formatLogTime(event.timestamp)}]
                  </span>{" "}
                  {event.type.includes("BREACH")
                    ? event.type
                    : `${event.type} — AI confidence: ${event.confidence}%`}
                </p>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSyncSession}
            disabled={!hasSessionActivity || isTextareaLocked}
            className="bg-[var(--accent)] font-mono text-xs uppercase tracking-widest text-primary-foreground hover:bg-[var(--accent-muted)] disabled:opacity-40"
          >
            End & sync session
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isTextareaLocked}
            className="border-border font-mono text-xs uppercase tracking-widest hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 disabled:opacity-40"
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
