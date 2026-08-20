"use client";

/**
 * QuickJoinPanel — the landing page's primary action: join a live quiz
 * with a 6-digit PIN, Kahoot-style. No copy, no explanation — the PIN
 * boxes *are* the UI.
 *
 * Lobby join codes are always a 6-digit number (see
 * `generateJoinCode()` in `@/features/lobby/service.ts`), so the input
 * is a fixed 6-slot numeric OTP field. Submitting routes to
 * `/live-quiz?code=XXXXXX`, which auto-launches straight into the
 * `GuestQuizPlayer` (see `live-quiz/view.tsx`) — no account required.
 */
import * as React from "react";
import { ArrowRight } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const JOIN_CODE_LENGTH = 6;

// Minimal, locale-aware microcopy. Kept local instead of next-intl's
// `messages/{locale}.json` catalog since the join panel is brand new
// and only needs a couple of words — no reason to touch the shared
// catalog for this.
const COPY: Record<string, { placeholder: string; join: string }> = {
  en: { placeholder: "Game PIN", join: "Join" },
  uz: { placeholder: "O'yin kodi", join: "Kirish" },
  ru: { placeholder: "PIN игры", join: "Войти" },
};

export function QuickJoinPanel({ locale }: { locale: string }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const t = COPY[locale] ?? COPY.en;

  function join(value: string) {
    if (value.length !== JOIN_CODE_LENGTH || submitting) return;
    setSubmitting(true);
    router.push(`/live-quiz?code=${value}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        join(code);
      }}
      className="flex flex-col items-center gap-4"
    >
      <InputOTP
        maxLength={JOIN_CODE_LENGTH}
        value={code}
        onChange={(value) => setCode(value.replace(/\D/g, ""))}
        onComplete={join}
        inputMode="numeric"
        pattern="^[0-9]*$"
        aria-label={t.placeholder}
        disabled={submitting}
      >
        <InputOTPGroup>
          {Array.from({ length: JOIN_CODE_LENGTH }).map((_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="size-12 text-xl font-bold sm:size-14 sm:text-2xl"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <Button
        type="submit"
        size="lg"
        disabled={code.length !== JOIN_CODE_LENGTH || submitting}
        className="w-full max-w-[280px] gap-2 bg-gradient-to-r from-teacher to-ai text-teacher-foreground hover:opacity-90"
      >
        {t.join}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
