"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Brain,
  CheckCircle2,
  Loader2,
  PenTool,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mascot } from "@/components/edubek/mascots";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface GeneratedQuiz {
  title: string;
  description?: string;
  questions: GeneratedQuestion[];
}

export function AiWorkspaceClient({ t }: { t: any }) {
  const { toast } = useToast();
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState(5);
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("medium");
  const [language, setLanguage] = React.useState<"en" | "uz" | "ru">("en");
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<GeneratedQuiz | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const result = await api.post<GeneratedQuiz>("/api/quiz/generate", {
        topic: topic.trim(),
        questionCount: count,
        difficulty,
        language,
      });
      setGenerated(result);
      toast({ title: t("generated"), description: result.title });
    } catch (err: any) {
      setError(err?.message ?? t("generateFailed"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!generated) return;
    setSaving(true);
    try {
      await api.post("/api/quiz", {
        title: generated.title,
        description: generated.description ?? "",
        questions: generated.questions,
      });
      toast({ title: t("saved"), description: generated.title });
      setGenerated(null);
      setTopic("");
    } catch (err: any) {
      toast({ title: t("saveFailed"), description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Mascot name="robot" size={56} className="text-ai" />
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-ai" />
              {t("generate")}
            </CardTitle>
            <CardDescription>{t("generateDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="topic">{t("topic")}</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("topicPlaceholder")}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t("questionCount")}</Label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={count === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCount(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t("difficulty")}</Label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <Button
                      key={d}
                      type="button"
                      variant={difficulty === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(d)}
                    >
                      {t(`difficulty_${d}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t("language")}</Label>
                <div className="flex gap-2">
                  {(["en", "uz", "ru"] as const).map((l) => (
                    <Button
                      key={l}
                      type="button"
                      variant={language === l ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage(l)}
                    >
                      {l.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={generating || !topic.trim()} className="gap-2">
                {generating ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
                {generating ? t("generating") : t("generate")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview / empty state */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PenTool className="size-5 text-creator" />
                {t("preview")}
              </CardTitle>
              {generated && (
                <Mascot name="pencil" size={32} className="text-creator/60" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Mascot name="robot" size={64} className="text-ai/60" />
                <p className="text-sm text-muted-foreground">{t("generating")}</p>
                <Loader2 className="size-5 animate-spin text-ai" />
              </div>
            ) : !generated ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Mascot name="book" size={64} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-semibold">{generated.title}</h3>
                  {generated.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{generated.description}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Brain className="size-3" />
                      {generated.questions.length} {t("questions")}
                    </Badge>
                    <Badge variant="outline">{t(`difficulty_${difficulty}`)}</Badge>
                  </div>
                </div>
                <Separator />
                {/* Questions preview */}
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                  {generated.questions.map((q, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">
                        {i + 1}. {q.question}
                      </p>
                      <div className="mt-2 flex flex-col gap-1">
                        {q.options.map((opt, j) => (
                          <div
                            key={j}
                            className={`flex items-center gap-2 rounded p-1 text-xs ${
                              j === q.correctIndex ? "bg-emerald-500/10 text-emerald-600" : ""
                            }`}
                          >
                            {j === q.correctIndex && <CheckCircle2 className="size-3" />}
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {t("save")}
                  </Button>
                  <Button variant="outline" onClick={() => setGenerated(null)} className="gap-2">
                    <X className="size-4" />
                    {t("discard")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
