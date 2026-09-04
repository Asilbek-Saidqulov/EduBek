"use client";

import React, { useState } from "react";
import {
  Users,
  Trophy,
  Crown,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Copy,
  Check,
  Flame,
  ArrowRight,
  WifiOff,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMultiplayer } from "@/hooks/use-multiplayer";
import { MODE_SKIN, type GameModeType } from "@/components/edubek/game-modes";
import { ModePlayHud, HeistActionBar, EmpireUpgradeBar } from "@/components/edubek/mode-play-hud";

export interface MultiplayerLivePlayerProps {
  initialCode: string;
  initialDisplayName?: string;
  isHost?: boolean;
  onExit?: () => void;
}

function useModeHud(roomState: any) {
  const mode = ((roomState?.gameMode || "classic") as GameModeType);
  const hud = roomState?.modeHud || {};
  return { mode, hud, skin: MODE_SKIN[mode] || MODE_SKIN.classic };
}

export function MultiplayerLivePlayer({
  initialCode,
  initialDisplayName,
  isHost = false,
  onExit,
}: MultiplayerLivePlayerProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");

  const mp = useMultiplayer({
    roomCode: initialCode,
    displayName: initialDisplayName || "Player",
    isHost,
  }) as any;

  const {
    connectionStatus,
    errorMessage,
    roomState,
    countdownSeconds,
    timeRemainingSeconds,
    isSubmitting,
    selectedAnswer,
    toggleReady,
    startMatch,
    submitAnswer,
    nextQuestion,
    leaveRoom,
  } = mp;

  const resolveHeist = mp.resolveHeist || (() => {});
  const upgradeEmpire = mp.upgradeEmpire || (() => {});

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

  if (!roomState) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Entering game room {initialCode}...</p>
      </div>
    );
  }

  const { mode, hud, skin } = useModeHud(roomState);

  if (countdownSeconds !== null && countdownSeconds > 0) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-white p-4 ${skin.card}`}>
        <div className="text-9xl font-black tracking-tight mode-urgent text-amber-400">
          {countdownSeconds}
        </div>
        <p className="mt-6 text-xl font-semibold tracking-wide opacity-80">
          Get ready! {mode.toUpperCase()} starting...
        </p>
      </div>
    );
  }

  if (roomState.status === "lobby") {
    const isPlayerHost = roomState.isHost;
    const me = roomState.leaderboard.find((p: any) => p.playerId === roomState.myPlayerId);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className={`shadow-sm ${skin.card}`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-bold">
                    {roomState.gameMode.toUpperCase()} MODE
                  </Badge>
                  <Badge variant="secondary">{roomState.totalRounds} Questions</Badge>
                </div>
                <CardTitle className="text-2xl mt-1">{roomState.title}</CardTitle>
                {roomState.description && <CardDescription>{roomState.description}</CardDescription>}
              </div>
              <div className="flex items-center gap-3 bg-muted p-3 rounded-xl border">
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Join PIN</div>
                  <div className="text-3xl font-black tracking-widest">{roomState.code}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={handleCopyCode} title="Copy PIN">
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Players in Lobby ({roomState.leaderboard.length})
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roomState.leaderboard.map((p: any) => (
                  <div
                    key={p.playerId}
                    className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                      p.playerId === roomState.myPlayerId ? "ring-2 ring-primary/40" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted font-bold flex items-center justify-center text-sm">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button variant="ghost" onClick={handleLeave} className="text-muted-foreground hover:text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Leave Lobby
              </Button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isPlayerHost && (
                  <Button variant={me?.isReady ? "secondary" : "default"} onClick={() => toggleReady(!me?.isReady)}>
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
                  <Button onClick={startMatch} size="lg" className="w-full sm:w-auto font-semibold">
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

  if (roomState.status === "in_progress" && roomState.activeQuestion) {
    const q = roomState.activeQuestion;
    const hasSubmitted = roomState.hasSubmittedAnswer;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
              Round {roomState.currentRound} of {roomState.totalRounds}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${timeRemainingSeconds <= 5 ? "text-red-500 animate-pulse" : ""}`} />
            <span className={`text-2xl font-black tabular-nums ${timeRemainingSeconds <= 5 ? "text-red-600 mode-urgent" : ""}`}>
              {timeRemainingSeconds}s
            </span>
          </div>
        </div>
        <ModePlayHud
          mode={mode}
          gold={hud.gold ?? 0}
          pendingGold={hud.pendingGold ?? 0}
          hearts={hud.hearts ?? 3}
          hasShield={!!hud.shield}
          classicPoints={roomState.leaderboard.find((p: any) => p.playerId === roomState.myPlayerId)?.score ?? 0}
          empireTier={["Hut", "Village", "Town", "City", "Empire"][hud.empireTier ?? 0]}
          wood={hud.resources?.wood}
          stone={hud.resources?.stone}
          food={hud.resources?.food}
          empireGold={hud.resources?.gold}
        />
        <Card className="shadow-md">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl sm:text-3xl leading-snug font-bold text-center">{q.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(q.type === "multiple_choice" || q.type === "true_false") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswer === idx || selectedAnswer === opt;
                  return (
                    <button
                      key={idx}
                      disabled={hasSubmitted || isSubmitting}
                      onClick={() => submitAnswer(idx)}
                      className={`p-6 rounded-xl border-2 text-left font-semibold text-lg transition-all ${
                        isSelected ? "ring-4 ring-primary scale-[1.02]" : "hover:shadow-md"
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
            {q.type === "short_answer" && (
              <div className="space-y-4">
                <Input
                  disabled={hasSubmitted || isSubmitting}
                  placeholder="Type your answer here..."
                  value={shortAnswerInput}
                  onChange={(e) => setShortAnswerInput(e.target.value)}
                  className="text-lg py-6"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && shortAnswerInput.trim()) submitAnswer(shortAnswerInput.trim());
                  }}
                />
                <Button
                  disabled={hasSubmitted || isSubmitting || !shortAnswerInput.trim()}
                  onClick={() => submitAnswer(shortAnswerInput.trim())}
                  className="w-full py-6 text-lg font-bold"
                >
                  Submit Answer
                </Button>
              </div>
            )}
            {hasSubmitted && (
              <div className="p-4 rounded-xl border text-center space-y-1">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Answer Locked In!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roomState.status === "question_results") {
    const res = roomState.lastQuestionResult;
    const isPlayerHost = roomState.isHost;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <ModePlayHud
          mode={mode}
          gold={hud.gold ?? 0}
          pendingGold={hud.pendingGold ?? 0}
          hearts={hud.hearts ?? 3}
          hasShield={!!hud.shield}
          classicPoints={roomState.leaderboard.find((p: any) => p.playerId === roomState.myPlayerId)?.score ?? 0}
          empireTier={["Hut", "Village", "Town", "City", "Empire"][hud.empireTier ?? 0]}
          wood={hud.resources?.wood}
          stone={hud.resources?.stone}
          food={hud.resources?.food}
          empireGold={hud.resources?.gold}
        />
        <HeistActionBar pendingGold={hud.pendingGold ?? 0} onAction={(a) => resolveHeist(a)} />
        <EmpireUpgradeBar canUpgrade={mode === "empire"} onUpgrade={() => upgradeEmpire()} />
        <Card className="shadow-md">
          <CardHeader className="text-center pb-4">
            <Badge variant="outline" className="mx-auto mb-2">
              Round {roomState.currentRound} Complete
            </Badge>
            <CardTitle className="text-2xl font-bold">{res?.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Correct Answer
              </div>
              <div className="text-xl font-bold">
                {res?.correctAnswer ||
                  (res?.correctIndex !== undefined ? `Option ${String.fromCharCode(65 + res.correctIndex)}` : "Verified")}
              </div>
              {res?.explanation && <p className="mt-2 text-sm opacity-80">{res.explanation}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Current Standings
                </span>
              </div>
              <div className="space-y-2">
                {roomState.leaderboard.map((player: any) => (
                  <div
                    key={player.playerId}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      player.playerId === roomState.myPlayerId ? "ring-2 ring-primary/30 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {player.rank}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{player.displayName}</div>
                        {player.currentStreak >= 2 && (
                          <div className="text-xs text-amber-600 flex items-center gap-0.5">
                            <Flame className="w-3 h-3 fill-amber-500" /> {player.currentStreak}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold tabular-nums">{player.score.toLocaleString()}</div>
                      {player.lastPointsEarned > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">+{player.lastPointsEarned}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {isPlayerHost && (
              <Button onClick={nextQuestion} size="lg" className="w-full font-bold py-6 text-lg">
                {roomState.currentRound >= roomState.totalRounds ? "View Final Results" : "Next Question"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roomState.status === "finished") {
    const top3 = roomState.leaderboard.slice(0, 3);
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Match Complete!</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4">
          {top3[1] && (
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-300 font-bold flex items-center justify-center text-lg mb-2">2</div>
              <div className="font-bold text-sm truncate max-w-full">{top3[1].displayName}</div>
              <div className="text-xs text-muted-foreground mt-1">{top3[1].score.toLocaleString()}</div>
            </div>
          )}
          {top3[0] && (
            <div className="p-6 border-2 border-amber-400 rounded-2xl flex flex-col items-center -mt-4">
              <Crown className="w-8 h-8 text-amber-500 mb-1" />
              <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xl mb-2">1</div>
              <div className="font-black text-base truncate max-w-full">{top3[0].displayName}</div>
              <div className="text-sm font-bold mt-1">{top3[0].score.toLocaleString()}</div>
            </div>
          )}
          {top3[2] && (
            <div className="p-4 rounded-2xl border flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-lg mb-2">3</div>
              <div className="font-bold text-sm truncate max-w-full">{top3[2].displayName}</div>
              <div className="text-xs text-muted-foreground mt-1">{top3[2].score.toLocaleString()}</div>
            </div>
          )}
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Final Scoreboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roomState.leaderboard.map((p: any) => (
              <div key={p.playerId} className="p-3 rounded-lg border flex items-center justify-between text-left text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">#{p.rank}</span>
                  <span className="font-medium">{p.displayName}</span>
                </div>
                <div className="font-bold tabular-nums">{p.score.toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button onClick={handleLeave} size="lg" className="w-full font-bold">
          <RotateCcw className="w-4 h-4 mr-2" /> Return to Game Hub
        </Button>
      </div>
    );
  }

  return null;
}
