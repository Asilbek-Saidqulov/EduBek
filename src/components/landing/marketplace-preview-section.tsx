"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  Star,
  Download,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MarketplacePreviewSection() {
  const t = useTranslations("landing.marketplacePreview");

  const materials = [
    {
      id: "mat-1",
      category: t("materials.mat1.category"),
      title: t("materials.mat1.title"),
      author: t("materials.mat1.author"),
      authorRole: t("materials.mat1.authorRole"),
      rating: 4.9,
      downloads: 480,
      price: "35 EDU",
      usdPrice: "$7.00",
      description: t("materials.mat1.description"),
      badge: t("materials.mat1.badge"),
    },
    {
      id: "mat-2",
      category: t("materials.mat2.category"),
      title: t("materials.mat2.title"),
      author: t("materials.mat2.author"),
      authorRole: t("materials.mat2.authorRole"),
      rating: 5.0,
      downloads: 320,
      price: "45 EDU",
      usdPrice: "$9.00",
      description: t("materials.mat2.description"),
      badge: t("materials.mat2.badge"),
    },
    {
      id: "mat-3",
      category: t("materials.mat3.category"),
      title: t("materials.mat3.title"),
      author: t("materials.mat3.author"),
      authorRole: t("materials.mat3.authorRole"),
      rating: 4.9,
      downloads: 650,
      price: "30 EDU",
      usdPrice: "$6.00",
      description: t("materials.mat3.description"),
      badge: t("materials.mat3.badge"),
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b border-border/60" id="marketplace-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-semibold text-primary border-primary/20 bg-primary/5">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{t("badge")}</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
              {t("title")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              {t("subtitle")}
            </p>
          </div>

          <Button size="lg" variant="outline" asChild className="shrink-0 gap-2">
            <Link href="/marketplace">
              <span>{t("browseAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* 3 Premium Material Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {materials.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">{item.category}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {item.badge}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    {item.author.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      {item.author}
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    </span>
                    <span className="text-[10px] text-muted-foreground block">{item.authorRole}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Rating, Price, Action */}
              <div className="pt-5 mt-4 border-t border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{item.rating}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">({item.downloads})</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-foreground">{item.price}</span>
                    <span className="text-[10px] text-muted-foreground block">{item.usdPrice}</span>
                  </div>
                  <Button size="sm" asChild className="h-8 px-3 text-xs">
                    <Link href="/marketplace">{t("previewBtn")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
