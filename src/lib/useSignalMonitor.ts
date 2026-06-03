"use client";

import { useCallback, useRef, useState } from "react";
import { triggerAnomalyHaptic, triggerShockHaptic } from "@/lib/haptics";

export type SignalState = "human" | "anomaly" | "ai";

export type FlaggedEvent = {
  id: string;
  timestamp: Date;
  type: string;
  confidence: number;
};

export type PasteWarning = {
  sessionAiPercent: number;
  pledge: number;
};

type WeightSnapshot = {
  humanWeight: number;
  aiWeight: number;
};

const PAUSE_THRESHOLD_MS = 3000;
const BURST_CHARS = 15;
const BURST_WINDOW_MS = 900;
const FAST_TYPING_CPS = 11;
const STATE_DECAY_MS = 4000;
const FLAG_COOLDOWN_MS = 2500;

function formatLogTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function computeHumanPercent(humanWeight: number, aiWeight: number): number {
  const total = humanWeight + aiWeight;
  if (total === 0) return 100;
  return Math.round((humanWeight / total) * 100);
}

function computeAiPercent(humanWeight: number, aiWeight: number): number {
  return 100 - computeHumanPercent(humanWeight, aiWeight);
}

export function useSignalMonitor(monthlyPledge: number) {
  const [signalState, setSignalState] = useState<SignalState>("human");
  const [events, setEvents] = useState<FlaggedEvent[]>([]);
  const [sessionHumanPercent, setSessionHumanPercent] = useState(100);
  const [hasSessionActivity, setHasSessionActivity] = useState(false);
  const [isTextareaLocked, setIsTextareaLocked] = useState(false);
  const [showBreachModal, setShowBreachModal] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [sessionBreached, setSessionBreached] = useState(false);
  const [pasteWarning, setPasteWarning] = useState<PasteWarning | null>(null);
  const [breachFlashActive, setBreachFlashActive] = useState(false);

  const humanWeightRef = useRef(1);
  const aiWeightRef = useRef(0);
  const lastKeystrokeRef = useRef<number | null>(null);
  const burstStartRef = useRef<number | null>(null);
  const burstCharsRef = useRef(0);
  const recentCharsRef = useRef<{ time: number; count: number }[]>([]);
  const stateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseDetectedRef = useRef(false);
  const lastFlaggedRef = useRef<number>(0);
  const preBreachWeightsRef = useRef<WeightSnapshot | null>(null);

  const maxAiPercent = 100 - monthlyPledge;

  const applyWeights = useCallback((humanWeight: number, aiWeight: number) => {
    humanWeightRef.current = humanWeight;
    aiWeightRef.current = aiWeight;
    setSessionHumanPercent(computeHumanPercent(humanWeight, aiWeight));
  }, []);

  const appendEvent = useCallback((type: string, confidence: number) => {
    const entry: FlaggedEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      type,
      confidence,
    };

    setEvents((prev) => [entry, ...prev].slice(0, 50));
    setHasSessionActivity(true);
    return entry;
  }, []);

  const scheduleSignalDecay = useCallback((state: SignalState) => {
    setSignalState(state);

    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }

    stateTimeoutRef.current = setTimeout(() => {
      setSignalState("human");
    }, STATE_DECAY_MS);
  }, []);

  const pushEvent = useCallback(
    (type: string, confidence: number, state: SignalState) => {
      appendEvent(type, confidence);
      scheduleSignalDecay(state);

      if (state === "anomaly") {
        triggerAnomalyHaptic();
      }
    },
    [appendEvent, scheduleSignalDecay]
  );

  const registerSignal = useCallback(
    (aiConfidence: number, type: string, state: SignalState) => {
      const now = Date.now();
      if (now - lastFlaggedRef.current < FLAG_COOLDOWN_MS && type !== "PASTE EVENT") {
        return;
      }
      lastFlaggedRef.current = now;

      const humanContribution = (100 - aiConfidence) / 100;
      const aiContribution = aiConfidence / 100;

      humanWeightRef.current += humanContribution;
      aiWeightRef.current += aiContribution;
      setSessionHumanPercent(
        computeHumanPercent(humanWeightRef.current, aiWeightRef.current)
      );
      pushEvent(type, aiConfidence, state);
    },
    [pushEvent]
  );

  const processPaste = useCallback(
    (confidence: number) => {
      const humanContribution = (100 - confidence) / 100;
      const aiContribution = confidence / 100;

      const projectedHuman = humanWeightRef.current + humanContribution;
      const projectedAi = aiWeightRef.current + aiContribution;
      const projectedAiPercent = computeAiPercent(projectedHuman, projectedAi);

      const crossesThreshold = projectedAiPercent >= maxAiPercent;

      if (!crossesThreshold) {
        applyWeights(projectedHuman, projectedAi);
        appendEvent("PASTE EVENT", confidence);
        setHasSessionActivity(true);
        scheduleSignalDecay("anomaly");
        setPasteWarning({
          sessionAiPercent: projectedAiPercent,
          pledge: monthlyPledge,
        });
        triggerAnomalyHaptic();

        return { breached: false as const, projectedAiPercent };
      }

      preBreachWeightsRef.current = {
        humanWeight: humanWeightRef.current,
        aiWeight: aiWeightRef.current,
      };

      applyWeights(projectedHuman, projectedAi);
      appendEvent("PASTE EVENT", confidence);
      setHasSessionActivity(true);
      setSignalState("ai");
      setPasteWarning(null);
      setIsTextareaLocked(true);
      setShowBreachModal(true);
      setShockwaveActive(true);
      setBreachFlashActive(true);
      triggerShockHaptic();

      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }

      setTimeout(() => setShockwaveActive(false), 2400);

      return { breached: true as const, projectedAiPercent };
    },
    [
      appendEvent,
      applyWeights,
      maxAiPercent,
      monthlyPledge,
      scheduleSignalDecay,
    ]
  );

  const resolveBreachRedo = useCallback(() => {
    const snapshot = preBreachWeightsRef.current;
    if (snapshot) {
      applyWeights(snapshot.humanWeight, snapshot.aiWeight);
    }

    preBreachWeightsRef.current = null;
    setIsTextareaLocked(false);
    setShowBreachModal(false);
    setBreachFlashActive(false);
    setShockwaveActive(false);
    scheduleSignalDecay("anomaly");
  }, [applyWeights, scheduleSignalDecay]);

  const resolveBreachAccept = useCallback(
    (confidence: number) => {
      appendEvent("PLEDGE BREACH — session flagged", confidence);
      setSessionBreached(true);
      preBreachWeightsRef.current = null;
      setIsTextareaLocked(false);
      setShowBreachModal(false);
      setBreachFlashActive(false);
      setShockwaveActive(false);
      setSignalState("ai");
    },
    [appendEvent]
  );

  const handleKeystroke = useCallback(() => {
    if (isTextareaLocked) return;

    const now = Date.now();
    setHasSessionActivity(true);

    if (lastKeystrokeRef.current !== null) {
      const gap = now - lastKeystrokeRef.current;

      if (gap >= PAUSE_THRESHOLD_MS) {
        pauseDetectedRef.current = true;
        burstStartRef.current = now;
        burstCharsRef.current = 0;
      }
    }

    if (burstStartRef.current !== null) {
      burstCharsRef.current += 1;

      if (
        pauseDetectedRef.current &&
        burstCharsRef.current >= BURST_CHARS &&
        now - burstStartRef.current <= BURST_WINDOW_MS
      ) {
        const confidence = 62 + Math.floor(Math.random() * 18);
        registerSignal(confidence, "BURST ANOMALY", "anomaly");
        pauseDetectedRef.current = false;
        burstStartRef.current = null;
        burstCharsRef.current = 0;
      } else if (now - (burstStartRef.current ?? now) > BURST_WINDOW_MS) {
        pauseDetectedRef.current = false;
        burstStartRef.current = null;
        burstCharsRef.current = 0;
      }
    }

    recentCharsRef.current.push({ time: now, count: 1 });
    recentCharsRef.current = recentCharsRef.current.filter(
      (entry) => now - entry.time <= 1000
    );

    const charsPerSecond = recentCharsRef.current.length;

    if (charsPerSecond >= FAST_TYPING_CPS && !pauseDetectedRef.current) {
      const confidence = 48 + Math.floor(Math.random() * 22);
      registerSignal(confidence, "TYPING SURGE", "anomaly");
      recentCharsRef.current = [];
    } else if (charsPerSecond <= 6) {
      humanWeightRef.current += 0.15;
      aiWeightRef.current += 0.02;
      setSessionHumanPercent(
        computeHumanPercent(humanWeightRef.current, aiWeightRef.current)
      );
      setSignalState("human");
    }

    lastKeystrokeRef.current = now;
  }, [isTextareaLocked, registerSignal]);

  const resetSession = useCallback(() => {
    humanWeightRef.current = 1;
    aiWeightRef.current = 0;
    lastKeystrokeRef.current = null;
    burstStartRef.current = null;
    burstCharsRef.current = 0;
    recentCharsRef.current = [];
    pauseDetectedRef.current = false;
    preBreachWeightsRef.current = null;
    setEvents([]);
    setSessionHumanPercent(100);
    setSignalState("human");
    setHasSessionActivity(false);
    setIsTextareaLocked(false);
    setShowBreachModal(false);
    setShockwaveActive(false);
    setSessionBreached(false);
    setPasteWarning(null);
    setBreachFlashActive(false);

    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }
  }, []);

  const getFinalHumanPercent = useCallback(() => {
    return computeHumanPercent(humanWeightRef.current, aiWeightRef.current);
  }, []);

  return {
    signalState,
    events,
    sessionHumanPercent,
    sessionAiPercent: 100 - sessionHumanPercent,
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
  };
}
