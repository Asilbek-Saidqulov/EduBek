"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { RoomStateSnapshot, PlayerAnswerSubmission, LeaderboardEntry, QuestionResultView, SanitizedQuestion } from "@/features/multiplayer/types";

export interface UseMultiplayerOptions {
  roomCode?: string;
  roomId?: string;
  displayName?: string;
  avatarUrl?: string;
  isHost?: boolean;
  onGameFinished?: (finalLeaderboard: LeaderboardEntry[]) => void;
  onError?: (error: string) => void;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export function useMultiplayer(options: UseMultiplayerOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomStateSnapshot | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [myAnswerResult, setMyAnswerResult] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    speedBonus: number;
    streakBonus: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    let socketInstance: Socket;

    try {
      setConnectionStatus("connecting");

      socketInstance = io({
        path: "/api/socket/io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
          displayName: options.displayName,
        },
      });

      socketInstance.on("connect", () => {
        setConnectionStatus("connected");
        setErrorMessage(null);

        // Auto-join room if code provided
        if (options.roomCode) {
          socketInstance.emit(
            "room:join",
            {
              code: options.roomCode,
              displayName: options.displayName,
              avatarUrl: options.avatarUrl,
            },
            (res: any) => {
              if (res?.success && res.data) {
                setRoomState(res.data);
              } else if (res?.error) {
                setErrorMessage(res.error);
                options.onError?.(res.error);
              }
            }
          );
        }
      });

      socketInstance.on("disconnect", (reason) => {
        setConnectionStatus("disconnected");
        if (reason === "io server disconnect") {
          socketInstance.connect();
        }
      });

      socketInstance.on("connect_error", () => {
        setConnectionStatus("reconnecting");
      });

      // -----------------------------------------------------------------------
      // Real-time Event Listeners
      // -----------------------------------------------------------------------
      socketInstance.on("room:state", (snapshot: RoomStateSnapshot) => {
        setRoomState(snapshot);
      });

      socketInstance.on("player:joined", (data: any) => {
        setRoomState((prev) => (prev ? { ...prev, leaderboard: data.leaderboard } : prev));
      });

      socketInstance.on("player:left", (data: any) => {
        setRoomState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            leaderboard: prev.leaderboard.filter((p) => p.playerId !== data.playerId),
          };
        });
      });

      socketInstance.on("player:ready", (data: any) => {
        setRoomState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            canStart: data.canStart ?? prev.canStart,
            leaderboard: data.leaderboard || prev.leaderboard,
          };
        });
      });

      socketInstance.on("game:countdown", (data: { durationSeconds: number }) => {
        setCountdownSeconds(data.durationSeconds || 3);
        let current = data.durationSeconds || 3;

        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
          current--;
          if (current <= 0) {
            clearInterval(countdownTimerRef.current!);
            countdownTimerRef.current = null;
            setCountdownSeconds(null);
          } else {
            setCountdownSeconds(current);
          }
        }, 1000);
      });

      socketInstance.on("question:active", (data: {
        question: SanitizedQuestion;
        roundNumber: number;
        totalRounds: number;
        durationMs: number;
        endsAt: string;
      }) => {
        setSelectedAnswer(null);
        setMyAnswerResult(null);
        setIsSubmitting(false);
        setCountdownSeconds(null);

        setRoomState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "in_progress",
            currentRound: data.roundNumber,
            totalRounds: data.totalRounds,
            activeQuestion: data.question,
            lastQuestionResult: null,
            hasSubmittedAnswer: false,
            roundEndsAt: data.endsAt,
          };
        });

        // Start local client countdown aligned with server endsAt
        const endTime = new Date(data.endsAt).getTime();
        if (timerRef.current) clearInterval(timerRef.current);

        const updateTimer = () => {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
          setTimeRemainingSeconds(remaining);
          if (remaining <= 0 && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 200);
      });

      socketInstance.on("question:answer:ack", (data: any) => {
        setIsSubmitting(false);
        if (data.success && data.record) {
          setMyAnswerResult(data.record);
          setRoomState((prev) => (prev ? { ...prev, hasSubmittedAnswer: true } : prev));
        }
      });

      socketInstance.on("question:result", (data: {
        result: QuestionResultView;
        leaderboard: LeaderboardEntry[];
      }) => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        setRoomState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "question_results",
            lastQuestionResult: data.result,
            leaderboard: data.leaderboard,
          };
        });
      });

      socketInstance.on("game:finished", (data: {
        finalLeaderboard: LeaderboardEntry[];
        totalRounds: number;
      }) => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        setRoomState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "finished",
            leaderboard: data.finalLeaderboard,
          };
        });
        options.onGameFinished?.(data.finalLeaderboard);
      });

      socketInstance.on("error", (err: { message: string }) => {
        setErrorMessage(err.message || "An unexpected error occurred");
        options.onError?.(err.message);
      });

      setSocket(socketInstance);
    } catch (err: any) {
      setConnectionStatus("error");
      setErrorMessage(err.message);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [options.roomCode, options.displayName]);

  // Actions
  const joinRoom = useCallback(
    (code: string, name?: string, avatar?: string) => {
      if (!socket) return;
      socket.emit("room:join", { code, displayName: name, avatarUrl: avatar }, (res: any) => {
        if (res?.success && res.data) {
          setRoomState(res.data);
          setErrorMessage(null);
        } else if (res?.error) {
          setErrorMessage(res.error);
        }
      });
    },
    [socket]
  );

  const toggleReady = useCallback(
    (ready: boolean) => {
      if (!socket) return;
      socket.emit("room:ready", { ready });
    },
    [socket]
  );

  const startMatch = useCallback(() => {
    if (!socket) return;
    socket.emit("room:start", {}, (res: any) => {
      if (res?.error) setErrorMessage(res.error);
    });
  }, [socket]);

  const submitAnswer = useCallback(
    (answer: any) => {
      if (!socket || !roomState || roomState.hasSubmittedAnswer || isSubmitting) return;

      setIsSubmitting(true);
      setSelectedAnswer(answer);

      const submission: PlayerAnswerSubmission = {
        roundNumber: roomState.currentRound,
        answer,
        clientTimestamp: Date.now(),
        submissionId: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      socket.emit("question:answer", submission, (res: any) => {
        setIsSubmitting(false);
        if (res?.error) {
          setErrorMessage(res.error);
        }
      });
    },
    [socket, roomState, isSubmitting]
  );

  const nextQuestion = useCallback(() => {
    if (!socket) return;
    socket.emit("question:next", {}, (res: any) => {
      if (res?.error) setErrorMessage(res.error);
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("room:leave");
    setRoomState(null);
  }, [socket]);

  const requestState = useCallback(() => {
    if (!socket) return;
    socket.emit("room:state:request");
  }, [socket]);

  return {
    socket,
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
  };
}
