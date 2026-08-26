"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Compass, GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  const t = useTranslations("landing.finalCta");

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-card border-b border-border/60" id="final-cta-section">
      {/* Background subtle radial structure */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />

      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
          <GraduationCap className="h-4 w-4" />
          <span>{t("badge")}</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-balance max-w-3xl mx-auto leading-tight">
          {t("title")}
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
          {t("subtitle")}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button size="lg" asChild className="h-12 px-8 text-base font-semibold shadow-sm gap-2" id="final-cta-get-started">
            <Link href="/register">
              <span>{t("getStarted")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base font-medium" id="final-cta-explore">
            <Link href="/discover">
              <Compass className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{t("exploreDiscover")}</span>
            </Link>
          </Button>
        </div>

        {/* Reassurance pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {t("pill1")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {t("pill2")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {t("pill3")}
          </span>
        </div>

      </div>
    </section>
  );
}
