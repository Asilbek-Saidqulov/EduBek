"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { RoomStateSnapshot, PlayerAnswerSubmission, LeaderboardEntry, QuestionResultView, SanitizedQuestion, AuthoritativeQuestion } from "@/features/multiplayer/types";

export interface UseMultiplayerOptions {
  roomCode?: string;
  roomId?: string;
  displayName?: string;
  avatarUrl?: string;
  isHost?: boolean;
  title?: string;
  gameMode?: string;
  questions?: AuthoritativeQuestion[];
  enabled?: boolean;
  realtimeUrl?: string;
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
    if (options.enabled === false) return;
    let socketInstance: Socket;

    try {
      setConnectionStatus("connecting");

      const explicitUrl = options.realtimeUrl || process.env.NEXT_PUBLIC_REALTIME_URL || undefined;
      const onVercel = !explicitUrl;
      socketInstance = io(explicitUrl, {
        path: onVercel ? "/api/socket-io/socket.io" : "/api/socket/io",
        transports: onVercel ? ["websocket"] : ["websocket", "polling"],
        withCredentials: true,
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

        if (options.isHost) {
          if (options.roomCode && options.roomCode.length >= 4) {
            socketInstance.emit("teacher:join", { code: options.roomCode });
          } else {
            socketInstance.emit("teacher:create", {
              title: options.title || "Live quiz",
              mode: options.gameMode || "classic",
            });
          }
          return;
        }

        if (!options.roomCode) return;
        socketInstance.emit("player:join", {
          code: options.roomCode,
          name: options.displayName || "Player",
        });
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

      socketInstance.on("teacher:joined", (data: any) => {
        setRoomState({
          roomId: data.code,
          code: data.code,
          hostId: "host",
          title: options.title || "Live quiz",
          gameMode: (options.gameMode || "classic") as any,
          status: "lobby",
          currentRound: 0,
          totalRounds: data.questions_count || 4,
          durationMs: 20000,
          roundStartedAt: null,
          roundEndsAt: null,
          serverTime: new Date().toISOString(),
          activeQuestion: null,
          lastQuestionResult: null,
          leaderboard: (data.players || []).map((p: any, i: number) => ({
            playerId: p.id || `p${i}`,
            displayName: p.name,
            role: "player",
            score: p.score || 0,
            rank: i + 1,
            correctCount: p.correct || 0,
            currentStreak: 0,
            lastPointsEarned: 0,
            change: 0,
            isReady: true,
            status: "active",
            hasAnsweredCurrentRound: false,
          })),
          isHost: true,
          hasSubmittedAnswer: false,
          canStart: true,
        });
      });

      socketInstance.on("player:joined", (data: any) => {
        setRoomState((prev) => ({
          roomId: data.code || options.roomCode || prev?.roomId || "",
          code: data.code || options.roomCode || prev?.code || "",
          hostId: prev?.hostId || "host",
          title: prev?.title || "Live quiz",
          gameMode: prev?.gameMode || "classic",
          status: "lobby",
          currentRound: 0,
          totalRounds: prev?.totalRounds || 4,
          durationMs: 20000,
          roundStartedAt: null,
          roundEndsAt: null,
          serverTime: new Date().toISOString(),
          activeQuestion: null,
          lastQuestionResult: null,
          leaderboard: prev?.leaderboard || [],
          myPlayerId: data.player_id,
          isHost: false,
          hasSubmittedAnswer: false,
          canStart: false,
        }));
      });

      socketInstance.on("player:new", (data: any) => {
        setRoomState((prev) => {
          if (!prev) return prev;
          if (prev.leaderboard.some((p) => p.displayName === data.name)) return prev;
          return {
            ...prev,
            leaderboard: [
              ...prev.leaderboard,
              {
                playerId: `new_${data.name}`,
                displayName: data.name,
                role: "player",
                score: 0,
                rank: prev.leaderboard.length + 1,
                correctCount: 0,
                currentStreak: 0,
                lastPointsEarned: 0,
                change: 0,
                isReady: true,
                status: "active",
                hasAnsweredCurrentRound: false,
              },
            ],
          };
        });
      });

      socketInstance.on("game:question", (data: any) => {
        setSelectedAnswer(null);
        setMyAnswerResult(null);
        setIsSubmitting(false);
        setCountdownSeconds(null);
        setTimeRemainingSeconds(data.time || 20);
        setRoomState((prev) => ({
          ...(prev || {
            roomId: options.roomCode || "LIVE",
            code: options.roomCode || "LIVE",
            hostId: "host",
            title: "Live quiz",
            gameMode: "classic" as any,
            leaderboard: [],
            isHost: Boolean(options.isHost),
            durationMs: 20000,
            roundStartedAt: null,
            roundEndsAt: null,
            serverTime: new Date().toISOString(),
            lastQuestionResult: null,
            canStart: false,
          }),
          status: "in_progress",
          currentRound: (data.index || 0) + 1,
          totalRounds: data.total || prev?.totalRounds || 4,
          hasSubmittedAnswer: false,
          activeQuestion: {
            id: `q_${data.index}`,
            prompt: data.question,
            type: "multiple_choice",
            options: data.options || [],
            points: 100,
            durationMs: (data.time || 20) * 1000,
            roundNumber: (data.index || 0) + 1,
            totalRounds: data.total || 4,
          },
        }));
      });

      socketInstance.on("game:timer", (data: { time: number }) => {
        setTimeRemainingSeconds(data.time);
      });

      socketInstance.on("player:answer_result", (data: any) => {
        setIsSubmitting(false);
        setMyAnswerResult({
          isCorrect: Boolean(data.is_correct),
          pointsAwarded: data.points || 0,
          speedBonus: 0,
          streakBonus: 0,
        });
        setRoomState((prev) => (prev ? { ...prev, hasSubmittedAnswer: true } : prev));
      });

      socketInstance.on("game:end", (data: any) => {
        setRoomState((prev) =>
          prev
            ? {
                ...prev,
                status: "finished",
                leaderboard: (data.leaderboard || []).map((row: any) => ({
                  playerId: row.name,
                  displayName: row.name,
                  role: "player" as const,
                  score: row.score,
                  rank: row.rank,
                  correctCount: row.correct || 0,
                  currentStreak: 0,
                  lastPointsEarned: 0,
                  change: 0,
                  isReady: true,
                  status: "active" as const,
                  hasAnsweredCurrentRound: true,
                })),
              }
            : prev,
        );
      });

      socketInstance.on("error", (message: any) => {
        const text = typeof message === "string" ? message : message?.message;
        if (text) {
          setErrorMessage(text);
          options.onError?.(text);
        }
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
  }, [options.roomCode, options.displayName, options.isHost, options.title, options.gameMode, options.questions, options.enabled, options.realtimeUrl]);

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
    const code = roomState?.code || options.roomCode;
    socket.emit("teacher:start", { code });
  }, [socket, roomState?.code, options.roomCode]);

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

      socket.emit("player:answer", {
        code: roomState.code,
        answer_index: typeof answer === "number" ? answer : Number(answer),
      });
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
    socket.emit("teacher:next", { code: roomState?.code || options.roomCode });
    socket.emit("question:next", {}, (res: any) => {
      if (res?.error) setErrorMessage(res.error);
    });
  }, [socket, roomState?.code, options.roomCode]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("room:leave");
    setRoomState(null);
  }, [socket]);

  const requestState = useCallback(() => {
    if (!socket) return;
    socket.emit("room:state:request");
  }, [socket]);

  const resolveHeist = useCallback((action: "save" | "invest" | "steal") => {
    socket?.emit("heist:action", { action }, () => {
      socket?.emit("room:state:request");
    });
  }, [socket]);

  const upgradeEmpire = useCallback(() => {
    socket?.emit("empire:upgrade", {}, () => {
      socket?.emit("room:state:request");
    });
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
    resolveHeist,
    upgradeEmpire,
  };
}
