"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Gamepad2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function QuickJoinPanel({ t: propT }: { t?: any }) {
  const router = useRouter();
  const tLive = useTranslations("liveQuiz");
  const [pin, setPin] = React.useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().toUpperCase();
    if (cleanPin) {
      router.push(`/live-quiz?code=${encodeURIComponent(cleanPin)}`);
    }
  };

  const title = propT ? propT('quickJoin.title') : tLive('joinLiveQuiz');
  const placeholder = propT ? propT('quickJoin.placeholder') : "PIN (masalan: 849201)";

  return (
    <Card className="w-full max-w-md border-2 border-primary/20 bg-card/90 shadow-xl backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Gamepad2 className="h-5 w-5" />
            <span>{title}</span>
          </div>

          <div className="flex gap-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder={placeholder}
              maxLength={12}
              className="text-center font-mono text-lg font-bold tracking-widest uppercase h-12"
            />
            <Button type="submit" size="lg" className="h-12 px-6" disabled={!pin.trim()}>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

