"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
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
  const materials = [
    {
      id: "mat-1",
      category: "National Examination Prep",
      title: "State University Entrance Exam (DTM) • Ultimate Physics 500",
      author: "Prof. Dilshod Karimov",
      authorRole: "Senior Physics Lecturer",
      rating: 4.9,
      downloads: 480,
      price: "35 EDU",
      usdPrice: "$7.00",
      description: "500 high-yield physics questions with detailed step-by-step vector mechanics and thermodynamics solutions.",
      badge: "Best Seller",
    },
    {
      id: "mat-2",
      category: "High School Olympiad",
      title: "Advanced Organic Chemistry & Synthesis Reaction Maps",
      author: "Dr. Elena Volkova",
      authorRole: "Olympiad Coach",
      rating: 5.0,
      downloads: 320,
      price: "45 EDU",
      usdPrice: "$9.00",
      description: "Color-coded reaction flowcharts, resonance mechanism cards, and 12 interactive mock quiz simulations.",
      badge: "Verified Expert",
    },
    {
      id: "mat-3",
      category: "Computer Science",
      title: "Data Structures & Algorithms Interview Mastery Deck",
      author: "Azizbek Turgunov",
      authorRole: "Software Engineer & Educator",
      rating: 4.9,
      downloads: 650,
      price: "30 EDU",
      usdPrice: "$6.00",
      description: "200 flashcards on Big-O, Trees, DP patterns, plus 8 timed speed-coding quiz modules.",
      badge: "Top Rated",
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
              <span>Verified Creator Marketplace</span>
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
              Find materials worth learning from.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              Curated, peer-reviewed study packages, flashcards, and quiz banks crafted by subject educators who teach the curriculum every day.
            </p>
          </div>

          <Button size="lg" variant="outline" asChild className="shrink-0 gap-2">
            <Link href="/marketplace">
              <span>Browse All Materials</span>
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
                    <Link href="/marketplace">Preview</Link>
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
