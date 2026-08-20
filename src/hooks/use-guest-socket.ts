"use client";

/**
 * useGuestSocket — client-side Socket.IO hook for guest quiz participation.
 *
 * Connects to the /session namespace with the guest JWT.
 * Receives real-time quiz events (round:started, round:reveal, etc.)
 * instead of polling.
 *
 * Replaces the 2-second polling approach with real-time push.
 */
import * as React from "react";
import { io, type Socket } from "socket.io-client";

export interface GuestSocketState {
  connected: boolean;
  currentRound: {
    id: string;
    roundNumber: number;
    question: string;
    options: string[];
    mediaSearch?: string;
    durationMs: number;
  } | null;
  hasAnswered: boolean;
  lastResult: { isCorrect: boolean; score: number; correctAnswer?: number } | null;
  sessionStatus: string;
  playerScore: number;
  error: string | null;
}

export function useGuestSocket(guestToken: string | null) {
  const [state, setState] = React.useState<GuestSocketState>({
    connected: false,
    currentRound: null,
    hasAnswered: false,
    lastResult: null,
    sessionStatus: "lobby",
    playerScore: 0,
    error: null,
  });
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    if (!guestToken) return;

    const socket = io("/session", {
      path: "/api/realtime",
      auth: { guestToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setState((s) => ({ ...s, connected: true, error: null }));
      // Auto-join the session room on connect
      socket.emit("session:join", { sessionId: "" }, () => {
        // sessionId is derived from the guest token on the server
      });
    });

    socket.on("disconnect", () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on("connect_error", (err: Error) => {
      setState((s) => ({ ...s, error: err.message }));
    });

    // Session lifecycle events
    socket.on("session:started", () => {
      setState((s) => ({ ...s, sessionStatus: "in_progress" }));
    });

    socket.on("session:finished", () => {
      setState((s) => ({ ...s, sessionStatus: "finished" }));
    });

    socket.on("session:cancelled", (payload: { reason: string }) => {
      setState((s) => ({ ...s, sessionStatus: "cancelled", error: payload.reason }));
    });

    // Round events
    socket.on("round:started", (payload: {
      roundId: string;
      roundNumber: number;
      questionSnapshot: { question: string; options: string[]; media?: { required: boolean; search?: string } } | null;
      durationMs: number;
      answerLockAt: string;
    }) => {
      const snap = payload.questionSnapshot;
      setState((s) => ({
        ...s,
        currentRound: snap ? {
          id: payload.roundId,
          roundNumber: payload.roundNumber,
          question: snap.question,
          options: snap.options,
          mediaSearch: snap.media?.search,
          durationMs: payload.durationMs,
        } : null,
        hasAnswered: false,
        lastResult: null,
      }));
    });

    socket.on("round:reveal", (payload: { correctAnswer: unknown; explanation: string | null }) => {
      setState((s) => ({
        ...s,
        lastResult: s.lastResult
          ? { ...s.lastResult, correctAnswer: payload.correctAnswer as number }
          : { isCorrect: false, score: 0, correctAnswer: payload.correctAnswer as number },
      }));
    });

    socket.on("session:answer_result", (payload: { isCorrect: boolean; score: number; correctAnswer?: unknown }) => {
      setState((s) => ({
        ...s,
        hasAnswered: true,
        lastResult: {
          isCorrect: payload.isCorrect,
          score: payload.score,
          correctAnswer: payload.correctAnswer as number | undefined,
        },
        playerScore: s.playerScore + payload.score,
      }));
    });

    socket.on("error", (payload: { code: string; message: string }) => {
      setState((s) => ({ ...s, error: payload.message }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [guestToken]);

  const submitAnswer = React.useCallback((roundId: string, answer: number) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    socket.emit("session:submit_answer", {
      sessionId: "", // derived from guest token on server
      roundId,
      answer,
      responseMs: 0, // server tracks timing
    }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) {
        setState((s) => ({ ...s, error: res.error ?? "Answer submission failed" }));
      }
    });
  }, []);

  return { ...state, submitAnswer };
}
