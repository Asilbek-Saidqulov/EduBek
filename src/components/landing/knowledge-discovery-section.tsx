"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import {
  Compass,
  Layers,
  Search,
  BookOpen,
  Swords,
  ArrowRight,
  Sparkles,
  Network,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function KnowledgeDiscoverySection() {
  const [selectedSubject, setSelectedSubject] = React.useState<string>("physics");

  const subjects = [
    { id: "physics", name: "Physics", icon: "⚡", topics: ["Electromagnetism", "Quantum Mechanics", "Thermodynamics", "Wave Optics"] },
    { id: "math", name: "Mathematics", icon: "📐", topics: ["Calculus & Integrals", "Linear Algebra", "Probability & Stats", "Trigonometry"] },
    { id: "cs", name: "Computer Science", icon: "💻", topics: ["Algorithms & Data Structures", "Relational Databases", "Computer Networks", "Cybersecurity"] },
    { id: "biology", name: "Biology", icon: "🧬", topics: ["Cellular Respiration", "Genetics & DNA", "Ecosystem Dynamics", "Human Anatomy"] },
  ];

  const current = subjects.find((s) => s.id === selectedSubject) || subjects[0];

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-b border-border/60" id="knowledge-discovery-section">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Real Knowledge Discovery Visual Map */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-lg space-y-6">
              
              {/* Subject pill selectors */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-border/80">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubject(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selectedSubject === sub.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                    id={`subject-btn-${sub.id}`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>

              {/* Topic Hub node representation */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Curriculum Hub
                    </Badge>
                    <span className="text-xs text-primary font-semibold flex items-center gap-1">
                      <Network className="h-3.5 w-3.5" />
                      <span>Connected Knowledge Hub</span>
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    {current.name} • Master Curriculum Standard
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Structured learning path with prerequisites, verified educator lesson plans, and aligned practice banks.
                  </p>
                </div>

                {/* Subtopic network branches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {current.topics.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground truncate">{topic}</span>
                        <Share2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Swords className="h-3 w-3 text-amber-500" />
                          <span>8 Quizzes</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-blue-500" />
                          <span>4 Guides</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Cross-linked with National Standards</span>
                </span>
                <Link href="/discover" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  <span>Browse all topics</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

            </div>
          </div>

          {/* Right Column: Narrative Copy */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-semibold text-primary border-primary/20 bg-primary/5">
              <Compass className="h-3.5 w-3.5" />
              <span>Structured Knowledge Discovery</span>
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
              Explore interconnected knowledge, not just isolated files.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              EduBek organizes learning around connected subjects and curriculum topics. Discovering a topic links you directly to teacher-created study guides, practice quizzes, and prerequisite roadmaps.
            </p>

            <div className="space-y-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                  ✓
                </div>
                <div>
                  <strong className="text-foreground">Syllabus-Aligned Paths:</strong> Follow sequenced chapter tracks with clear milestones and concept checkpoints.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                  ✓
                </div>
                <div>
                  <strong className="text-foreground">Cross-Topic Links:</strong> Instantly see how calculus connects to physics mechanics, or how chemistry relates to cellular biology.
                </div>
              </div>
            </div>

            <div className="pt-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/discover">
                  <Search className="h-4 w-4" />
                  <span>Start Discovering Topics</span>
                </Link>
              </Button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
