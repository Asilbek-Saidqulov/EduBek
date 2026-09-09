"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionStatus, UseMultiplayerOptions } from "@/hooks/use-multiplayer";
import type { LeaderboardEntry, RoomStateSnapshot } from "@/features/multiplayer/types";

type HttpOptions = UseMultiplayerOptions & {
  enabled?: boolean;
  sessionId?: string;
};

export function useHttpMultiplayer(options: HttpOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomStateSnapshot | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [myAnswerResult, setMyAnswerResult] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    speedBonus: number;
    streakBonus: number;
  } | null>(null);

  const guestTokenRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(options.sessionId || null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySnapshot = useCallback((snapshot: RoomStateSnapshot | null) => {
    if (!snapshot) return;
    setRoomState(snapshot);
    sessionIdRef.current = snapshot.roomId;
    if (snapshot.roundEndsAt) {
      const end = new Date(snapshot.roundEndsAt).getTime();
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
    }
  }, []);

  useEffect(() => {
    if (options.enabled === false) return;
    if (!options.roomCode) return;
    let cancelled = false;

    async function boot() {
      setConnectionStatus("connecting");
      try {
        const joinRes = await fetch("/api/live/guest/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            joinCode: options.roomCode,
            displayName: (options.displayName || "Player").slice(0, 30),
          }),
        });
        const joinData = await joinRes.json().catch(() => null);
        if (!joinRes.ok) {
          throw new Error(joinData?.error?.message || "Could not join live room");
        }
        if (cancelled) return;
        guestTokenRef.current = joinData.guestToken;
        sessionIdRef.current = joinData.session?.roomId || joinData.session?.id || options.sessionId || null;
        applySnapshot(joinData.session);
        setConnectionStatus("connected");
        setErrorMessage(null);
      } catch (err: any) {
        if (cancelled) return;
        setConnectionStatus("error");
        setErrorMessage(err?.message || "Could not join live room");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [options.enabled, options.roomCode, options.displayName, options.sessionId, applySnapshot]);

  useEffect(() => {
    if (options.enabled === false) return;
    if (connectionStatus !== "connected") return;
    const tick = async () => {
      const token = guestTokenRef.current;
      if (!token) return;
      try {
        const res = await fetch("/api/live/guest/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestToken: token }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const snapshot = data.snapshot || data.session;
        if (snapshot) applySnapshot(snapshot);
      } catch {
        /* keep last snapshot */
      }
    };
    const id = setInterval(tick, 2000);
    tick();
    return () => clearInterval(id);
  }, [options.enabled, connectionStatus, applySnapshot]);

  useEffect(() => {
    if (!roomState?.roundEndsAt) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(roomState.roundEndsAt!).getTime() - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
    }, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomState?.roundEndsAt]);

  const startMatch = useCallback(async () => {
    const id = sessionIdRef.current || options.sessionId;
    if (!id) return;
    setCountdownSeconds(3);
    const res = await fetch(`/api/live/sessions/${id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countdownSeconds: 3 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setErrorMessage(err?.error?.message || "Could not start the room");
      setCountdownSeconds(null);
      return;
    }
    setTimeout(() => setCountdownSeconds(null), 3000);
  }, [options.sessionId]);

  const submitAnswer = useCallback(
    async (answer: any) => {
      const token = guestTokenRef.current;
      const snapshot = roomState;
      if (!token || !snapshot || snapshot.hasSubmittedAnswer || isSubmitting) return;
      setIsSubmitting(true);
      setSelectedAnswer(answer);
      try {
        const res = await fetch("/api/live/guest/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestToken: token,
            roundId: snapshot.activeQuestion?.id || `round-${snapshot.currentRound}`,
            answer: typeof answer === "number" ? answer : 0,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message || "Answer rejected");
        setMyAnswerResult({
          isCorrect: Boolean(data.isCorrect),
          pointsAwarded: data.pointsAwarded || 0,
          speedBonus: data.speedBonus || 0,
          streakBonus: 0,
        });
        setRoomState((prev) => (prev ? { ...prev, hasSubmittedAnswer: true } : prev));
      } catch (err: any) {
        setErrorMessage(err?.message || "Could not submit answer");
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomState, isSubmitting],
  );

  const nextQuestion = useCallback(async () => {
    const id = sessionIdRef.current || options.sessionId;
    if (!id) return;
    await fetch(`/api/live/sessions/${id}/next-round`, { method: "POST" });
  }, [options.sessionId]);

  const toggleReady = useCallback((_ready: boolean) => {}, []);
  const leaveRoom = useCallback(() => {
    setRoomState(null);
    setConnectionStatus("disconnected");
  }, []);
  const joinRoom = useCallback((_code: string) => {}, []);
  const requestState = useCallback(() => {}, []);
  const resolveHeist = useCallback((_action: "save" | "invest" | "steal") => {}, []);
  const upgradeEmpire = useCallback(() => {}, []);

  return {
    socket: null,
    connectionStatus,
    errorMessage,
    roomState,
    countdownSeconds,
    timeRemainingSeconds,
    isSubmitting,
    selectedAnswer,
    myAnswerResult,
    joinRoom,
    toggleReady,
    startMatch,
    submitAnswer,
    nextQuestion,
    leaveRoom,
    requestState,
    resolveHeist,
    upgradeEmpire,
    onGameFinished: (_board: LeaderboardEntry[]) => {},
  };
}
