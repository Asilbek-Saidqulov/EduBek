"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, GamepadIcon, Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mascot } from "@/components/edubek/mascots";
import { GuestQuizPlayer } from "@/components/edubek/guest-quiz-player";

export function LiveQuizClient({ t }: { t: any }) {
  // Landing page's quick-join PIN panel deep-links here as
  // `/live-quiz?code=XXXXXX` — when present, skip straight to the
  // guest player instead of making the person retype the PIN.
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim().toUpperCase() ?? "";

  const [joinCode, setJoinCode] = React.useState(codeFromUrl);
  const [mode, setMode] = React.useState<"choose" | "play">(
    codeFromUrl.length >= 4 ? "play" : "choose",
  );

  if (mode === "play" && joinCode) {
    return <GuestQuizPlayer joinCode={joinCode} />;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Mascot name="pencil" size={80} className="text-teacher" />
        </div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join a quiz */}
        <Card className="group">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radio className="size-5 text-teacher" />
                {t("joinQuiz")}
              </CardTitle>
              <Mascot name="notebook" size={40} className="text-teacher/60" />
            </div>
            <CardDescription>{t("joinDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (joinCode.trim().length >= 4) setMode("play");
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="joinCode">{t("joinCode")}</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  maxLength={20}
                  required
                  className="font-mono text-center text-lg uppercase"
                />
              </div>
              <Button type="submit" disabled={joinCode.trim().length < 4} className="gap-2">
                {t("join")}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Host a quiz */}
        <Card className="group">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-ai" />
                {t("hostQuiz")}
              </CardTitle>
              <Mascot name="robot" size={40} className="text-ai/60" />
            </div>
            <CardDescription>{t("hostDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t("hostFeatures")}</p>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <GamepadIcon className="size-4 text-teacher" />
                {t("featureRealTime")}
              </li>
              <li className="flex items-center gap-2">
                <GamepadIcon className="size-4 text-ai" />
                {t("featureLeaderboard")}
              </li>
              <li className="flex items-center gap-2">
                <GamepadIcon className="size-4 text-creator" />
                {t("featureRewards")}
              </li>
            </ul>
            <Button asChild variant="outline" className="gap-2">
              <a href="/ai-workspace">
                {t("createQuizFirst")}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mascot name="book" size={32} className="text-muted-foreground" />
            {t("howItWorks")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: 1, mascot: "notebook" as const, text: t("step1") },
              { step: 2, mascot: "pencil" as const, text: t("step2") },
              { step: 3, mascot: "robot" as const, text: t("step3") },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-2 flex size-16 items-center justify-center rounded-full border-2 border-primary/20 bg-background">
                  <Mascot name={item.mascot} size={36} className="text-primary/60" />
                </div>
                <span className="text-xs font-bold text-primary">{t("stepLabel")} {item.step}</span>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
