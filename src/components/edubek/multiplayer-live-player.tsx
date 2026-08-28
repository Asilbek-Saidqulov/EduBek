"use client";

import React, { useState } from "react";
import {
  Users,
  Trophy,
  Crown,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Castle,
  Coins,
  Shield,
  Copy,
  Check,
  Flame,
  ArrowRight,
  WifiOff,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useMultiplayer } from "@/hooks/use-multiplayer";

export interface MultiplayerLivePlayerProps {
  initialCode: string;
  initialDisplayName?: string;
  isHost?: boolean;
  onExit?: () => void;
}

export function MultiplayerLivePlayer({
  initialCode,
  initialDisplayName,
  isHost = false,
  onExit,
}: MultiplayerLivePlayerProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");

  const {
    connectionStatus,
    errorMessage,
    roomState,
    countdownSeconds,
    timeRemainingSeconds,
    isSubmitting,
    selectedAnswer,
    myAnswerResult,
    toggleReady,
    startMatch,
    submitAnswer,
    nextQuestion,
    leaveRoom,
  } = useMultiplayer({
    roomCode: initialCode,
    displayName: initialDisplayName || "Player",
    isHost,
  });

  const handleCopyCode = () => {
    if (roomState?.code) {
      navigator.clipboard.writeText(roomState.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    onExit?.();
  };

  // If disconnected or error
  if (connectionStatus === "error" || (connectionStatus === "disconnected" && !roomState)) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Connection Error</h2>
        <p className="text-sm text-muted-foreground">
          {errorMessage || "Unable to connect to live multiplayer game server."}
        </p>
        <Button onClick={handleLeave} variant="outline" className="w-full">
          Back to Hub
        </Button>
      </div>
    );
  }

  // Waiting for initial snapshot
  if (!roomState) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Entering game room {initialCode}...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 1. COUNTDOWN OVERLAY
  // ---------------------------------------------------------------------------
  if (countdownSeconds !== null && countdownSeconds > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-indigo-950/95 flex flex-col items-center justify-center text-white p-4">
        <div className="text-9xl font-black tracking-tight animate-bounce text-amber-400">
          {countdownSeconds}
        </div>
        <p className="mt-6 text-xl font-semibold tracking-wide text-indigo-200">
          Get ready! Question 1 starting...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. LOBBY VIEW
  // ---------------------------------------------------------------------------
  if (roomState.status === "lobby") {
    const isPlayerHost = roomState.isHost;
    const me = roomState.leaderboard.find((p) => p.playerId === roomState.myPlayerId);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lobby Header */}
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border-indigo-200">
                    {roomState.gameMode.toUpperCase()} MODE
                  </Badge>
                  <Badge variant="secondary">
                    {roomState.totalRounds} Questions
                  </Badge>
                </div>
                <CardTitle className="text-2xl mt-1">{roomState.title}</CardTitle>
                {roomState.description && (
                  <CardDescription>{roomState.description}</CardDescription>
                )}
              </div>

              {/* Join Code Display */}
              <div className="flex items-center gap-3 bg-muted p-3 rounded-xl border">
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Join PIN</div>
                  <div className="text-3xl font-black tracking-widest text-indigo-600 dark:text-indigo-400">{roomState.code}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={handleCopyCode} title="Copy PIN">
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* Player Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Players in Lobby ({roomState.leaderboard.length})
                </div>
                {isPlayerHost && (
                  <span className="text-xs text-muted-foreground">
                    You are the Host
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roomState.leaderboard.map((p) => (
                  <div
                    key={p.playerId}
                    className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all ${
                      p.playerId === roomState.myPlayerId
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1">
                        {p.displayName}
                        {p.role === "host" && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.role === "host" ? "Host" : p.isReady ? "Ready" : "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button variant="ghost" onClick={handleLeave} className="text-muted-foreground hover:text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Leave Lobby
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isPlayerHost && (
                  <Button
                    variant={me?.isReady ? "secondary" : "default"}
                    onClick={() => toggleReady(!me?.isReady)}
                    className="w-full sm:w-auto"
                  >
                    {me?.isReady ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Ready
                      </>
                    ) : (
                      "Set Ready"
                    )}
                  </Button>
                )}

                {isPlayerHost && (
                  <Button
                    onClick={startMatch}
                    size="lg"
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Match
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. ACTIVE QUESTION VIEW (Live Gameplay)
  // ---------------------------------------------------------------------------
  if (roomState.status === "in_progress" && roomState.activeQuestion) {
    const q = roomState.activeQuestion;
    const hasSubmitted = roomState.hasSubmittedAnswer;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Game Bar */}
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
              Round {roomState.currentRound} of {roomState.totalRounds}
            </Badge>
            <div className="text-sm font-medium text-muted-foreground">
              {q.points * 1000} pts
            </div>
          </div>

          {/* Real-Time Countdown Timer */}
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${timeRemainingSeconds <= 5 ? "text-red-500 animate-pulse" : "text-indigo-600"}`} />
            <span className={`text-2xl font-black tabular-nums ${timeRemainingSeconds <= 5 ? "text-red-600" : "text-foreground"}`}>
              {timeRemainingSeconds}s
            </span>
          </div>
        </div>

        {/* Question Prompt Card */}
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl sm:text-3xl leading-snug font-bold text-center">
              {q.prompt}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Multiple Choice & True/False Options */}
            {(q.type === "multiple_choice" || q.type === "true_false") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx || selectedAnswer === opt;
                  const optColors = [
                    "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200",
                    "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
                    "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
                    "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200",
                  ];
                  const colorClass = optColors[idx % optColors.length];

                  return (
                    <button
                      key={idx}
                      disabled={hasSubmitted || isSubmitting}
                      onClick={() => submitAnswer(idx)}
                      className={`p-6 rounded-xl border-2 text-left font-semibold text-lg transition-all duration-150 transform active:scale-95 disabled:cursor-not-allowed ${colorClass} ${
                        isSelected ? "ring-4 ring-indigo-500 scale-[1.02] shadow-lg" : "hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-black">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer Input */}
            {q.type === "short_answer" && (
              <div className="space-y-4">
                <Input
                  disabled={hasSubmitted || isSubmitting}
                  placeholder="Type your answer here..."
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  className="text-lg py-6"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && shortAnswerInput.trim()) {
                      submitAnswer(shortAnswerInput.trim());
                    }
                  }}
                />
                <Button
                  disabled={hasSubmitted || isSubmitting || !shortAnswerInput.trim()}
                  onClick={() => submitAnswer(shortAnswerInput.trim())}
                  className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Answer
                </Button>
              </div>
            )}

            {/* Submitted Feedback Banner */}
            {hasSubmitted && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1 animate-fade-in">
                <div className="flex items-center justify-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Answer Locked In!
                </div>
                <p className="text-xs text-muted-foreground">
                  Waiting for round timer or other players to finish...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. QUESTION RESULTS VIEW
  // ---------------------------------------------------------------------------
  if (roomState.status === "question_results") {
    const res = roomState.lastQuestionResult;
    const isPlayerHost = roomState.isHost;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Results Header Card */}
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <CardHeader className="text-center pb-4">
            <Badge variant="outline" className="mx-auto mb-2">
              Round {roomState.currentRound} Complete
            </Badge>
            <CardTitle className="text-2xl font-bold">{res?.prompt}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Correct Answer Reveal */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Correct Answer
              </div>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                {res?.correctAnswer || (res?.correctIndex !== undefined ? `Option ${String.fromCharCode(65 + res.correctIndex)}` : "Verified")}
              </div>
              {res?.explanation && (
                <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                  {res.explanation}
                </p>
              )}
            </div>

            {/* Live Leaderboard */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Current Standings
                </span>
                <span>Scores</span>
              </div>

              <div className="space-y-2">
                {roomState.leaderboard.map((player) => (
                  <div
                    key={player.playerId}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      player.playerId === roomState.myPlayerId
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 font-semibold"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                        player.rank === 1
                          ? "bg-amber-400 text-amber-950"
                          : player.rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : player.rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {player.rank}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{player.displayName}</div>
                        {player.currentStreak >= 2 && (
                          <div className="text-xs text-amber-600 flex items-center gap-0.5">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" /> {player.currentStreak} in a row
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold tabular-nums">{player.score.toLocaleString()} pts</div>
                      {player.lastPointsEarned > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">+{player.lastPointsEarned}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Round Button (Host only) */}
            {isPlayerHost && (
              <Button
                onClick={nextQuestion}
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg"
              >
                {roomState.currentRound >= roomState.totalRounds ? "View Final Results" : "Next Question"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. FINISHED VIEW (Final Podium)
  // ---------------------------------------------------------------------------
  if (roomState.status === "finished") {
    const top3 = roomState.leaderboard.slice(0, 3);

    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Match Complete!</h2>
          <p className="text-muted-foreground text-sm">Congratulations to the champions!</p>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-900 font-bold flex items-center justify-center text-lg mb-2">
                2
              </div>
              <div className="font-bold text-sm truncate max-w-full">{top3[1].displayName}</div>
              <div className="text-xs text-muted-foreground mt-1">{top3[1].score.toLocaleString()} pts</div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 rounded-2xl flex flex-col items-center shadow-lg -mt-4">
              <Crown className="w-8 h-8 text-amber-500 mb-1 animate-bounce" />
              <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xl mb-2">
                1
              </div>
              <div className="font-black text-base truncate max-w-full text-amber-900 dark:text-amber-200">
                {top3[0].displayName}
              </div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-1">
                {top3[0].score.toLocaleString()} pts
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="p-4 bg-amber-900/10 rounded-2xl border flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-lg mb-2">
                3
              </div>
              <div className="font-bold text-sm truncate max-w-full">{top3[2].displayName}</div>
              <div className="text-xs text-muted-foreground mt-1">{top3[2].score.toLocaleString()} pts</div>
            </div>
          )}
        </div>

        {/* Full Leaderboard Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Final Scoreboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roomState.leaderboard.map((p) => (
              <div
                key={p.playerId}
                className="p-3 rounded-lg border flex items-center justify-between text-left text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">#{p.rank}</span>
                  <span className="font-medium">{p.displayName}</span>
                </div>
                <div className="font-bold tabular-nums">{p.score.toLocaleString()} pts</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleLeave} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
          <RotateCcw className="w-4 h-4 mr-2" /> Return to Game Hub
        </Button>
      </div>
    );
  }

  return null;
}
