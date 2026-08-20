"use client";

/**
 * GuestQuizPlayer — the actual quiz-playing experience for unauthenticated guests.
 *
 * Flow:
 *   1. Enter display name → POST /api/live/guest/join → get guestToken
 *   2. Connect Socket.IO with guestToken → receive real-time quiz events
 *   3. Guest selects an answer → emit via Socket.IO → server determines correctness
 *   4. Repeat for each round (no polling — real-time push)
 *   5. Session finishes → show final score + sign-up CTA
 *
 * Mascots: Notebook (enter name), Pencil (answering), Book (waiting),
 * Microscope (reviewing), Robot (AI results).
 */
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Rocket,
  Trophy,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mascot } from "@/components/edubek/mascots";
import { useGuestSocket } from "@/hooks/use-guest-socket";

type Phase = "name" | "playing" | "finished";

export function GuestQuizPlayer({ joinCode }: { joinCode: string }) {
  const t = useTranslations("liveQuiz.guest");
  const [phase, setPhase] = React.useState<Phase>("name");
  const [displayName, setDisplayName] = React.useState("");
  const [guestToken, setGuestToken] = React.useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = React.useState("");
  const [totalRounds, setTotalRounds] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);

  const socket = useGuestSocket(guestToken);

  React.useEffect(() => {
    if (socket.sessionStatus === "finished" || socket.sessionStatus === "cancelled") {
      setPhase("finished");
    }
  }, [socket.sessionStatus]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await api.post<{ session: { title: string; totalRounds: number }; player: { id: string; displayName: string }; guestToken: string }>(
        "/api/live/guest/join",
        { joinCode, displayName: displayName.trim() },
      );
      setGuestToken(res.guestToken);
      setSessionTitle(res.session.title);
      setTotalRounds(res.session.totalRounds);
      setPhase("playing");
    } catch (err: any) {
      setJoinError(err?.message ?? t("joinFailed"));
    } finally {
      setJoining(false);
    }
  }

  function handleSubmitAnswer() {
    if (!guestToken || !socket.currentRound || selectedAnswer === null) return;
    socket.submitAnswer(socket.currentRound.id, selectedAnswer);
  }

  // --- Phase: Enter name ---
  if (phase === "name") {
    return (
      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden border-teacher/30">
          <div className="h-1.5 w-full bg-gradient-to-r from-teacher to-ai" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="size-5 text-teacher" aria-hidden />
                {t("enterName")}
              </CardTitle>
              <Mascot name="notebook" size={48} className="text-teacher/60" />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">{t("nameLabel")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  maxLength={30}
                  required
                />
              </div>
              {joinError && (
                <p className="text-sm text-destructive">{joinError}</p>
              )}
              <Button type="submit" disabled={joining} className="gap-2">
                {joining ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {t("join")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Phase: Finished ---
  if (phase === "finished") {
    return (
      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden border-ai/30">
          <div className="h-1.5 w-full bg-gradient-to-r from-ai to-teacher" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-ai" aria-hidden />
                {t("quizFinished")}
              </CardTitle>
              <Mascot name="robot" size={48} className="text-ai/60" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("yourScore")}</p>
              <p className="text-3xl font-bold">{socket.playerScore}</p>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">{t("signUpPrompt")}</p>
            <div className="flex gap-2">
              <Button asChild className="flex-1 gap-2">
                <Link href="/register">
                  {t("signUp")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/live-quiz">{t("playAgain")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Phase: Playing ---
  return (
    <div className="mx-auto max-w-2xl">
      {/* Status bar */}
      <Card className="mb-4">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Mascot name="pencil" size={32} className="text-teacher/60" />
            <div>
              <p className="font-semibold">{sessionTitle}</p>
              <p className="text-xs text-muted-foreground">
                {socket.connected ? t("connected") : t("connecting")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1.5">
              <Trophy className="size-3" />
              {socket.playerScore} pts
            </Badge>
            {socket.currentRound && (
              <Badge variant="outline">
                {t("round")} {socket.currentRound.roundNumber}/{totalRounds}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {socket.error && (
        <Card className="mb-4 border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">
            {socket.error}
          </CardContent>
        </Card>
      )}

      {/* Waiting for round */}
      {!socket.currentRound && !socket.error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12">
            <Mascot name="book" size={64} className="text-muted-foreground/60" />
            <p className="text-lg font-medium">{t("waitingForHost")}</p>
            <p className="text-sm text-muted-foreground">{t("waitingDescription")}</p>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Active round */}
      {socket.currentRound && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t("question")} {socket.currentRound.roundNumber}
              </CardTitle>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="size-3" />
                {Math.ceil(socket.currentRound.durationMs / 1000)}s
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-medium">{socket.currentRound.question}</p>
            <div className="grid gap-2">
              {socket.currentRound.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = socket.lastResult?.correctAnswer === index;
                const isWrong = isSelected && socket.lastResult && !socket.lastResult.isCorrect;
                return (
                  <button
                    key={index}
                    onClick={() => !socket.hasAnswered && setSelectedAnswer(index)}
                    disabled={socket.hasAnswered}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      isCorrect
                        ? "border-emerald-500 bg-emerald-500/10"
                        : isWrong
                          ? "border-red-500 bg-red-500/10"
                          : isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                    } ${socket.hasAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="text-sm font-medium">{option}</span>
                    {isCorrect && <CheckCircle2 className="size-4 text-emerald-500" />}
                    {isWrong && <XCircle className="size-4 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {/* Submit button */}
            {!socket.hasAnswered ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null || !socket.connected}
                className="gap-2"
              >
                {t("submitAnswer")}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Mascot name="microscope" size={32} className="text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {socket.lastResult?.isCorrect ? t("correctAnswer") : t("wrongAnswer")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("scoreAwarded")}: {socket.lastResult?.score} pts
                  </p>
                </div>
                {socket.lastResult?.isCorrect ? (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                ) : (
                  <XCircle className="size-5 text-red-500" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
