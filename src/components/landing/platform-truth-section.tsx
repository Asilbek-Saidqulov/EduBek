"use client";

import * as React from "react";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Cpu,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PlatformTruthSection() {
  const highlights = [
    {
      icon: Zap,
      title: "Real-Time Game Synchronization",
      color: "text-amber-500",
      description: "Live pin joins, sub-second answer evaluations, and synchronous multi-student classroom arenas.",
    },
    {
      icon: Globe2,
      title: "Full Multilingual Engine",
      color: "text-blue-500",
      description: "Complete first-class localization across English, Uzbek (Latin & Cyrillic), and Russian.",
    },
    {
      icon: Cpu,
      title: "Contextual Gemini 3.7 AI",
      color: "text-violet-500",
      description: "Embedded directly into lessons and quizzes for step-by-step problem explanations and auto-generation.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Educational Content",
      color: "text-emerald-500",
      description: "Curated syllabi with transparent author attributions, quality ratings, and syllabus alignment.",
    },
    {
      icon: Lock,
      title: "Privacy & Classroom Control",
      color: "text-rose-500",
      description: "Strict educator role boundaries, student progress privacy, and secure session management.",
    },
    {
      icon: Layers,
      title: "Accessible Everywhere",
      color: "text-cyan-500",
      description: "Optimized for mobile phones, tablets, smartboards, and desktop browsers with dark and light themes.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-b border-border/60" id="platform-architecture-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Engineered for high reliability in active classrooms
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            Every feature on EduBek is built with intentional engineering to ensure zero distraction during tests and seamless lesson delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all space-y-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border/70">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
