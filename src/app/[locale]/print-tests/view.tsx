"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  Printer,
  Upload,
  Users,
  ListOrdered,
  FileText,
  KeyRound,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildPrintHtml,
  extractPlainText,
  generatePrintPack,
  type LocaleCode,
  type PrintPack,
} from "@/features/print-tests/engine";

function openPrintWindow(html: string) {
  const frame = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!frame) return;
  frame.document.open();
  frame.document.write(html);
  frame.document.close();
  frame.focus();
  setTimeout(() => frame.print(), 250);
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function PrintTestsView() {
  const locale = (useLocale() as LocaleCode) || "en";
  const [title, setTitle] = React.useState("Algebra checkpoint");
  const [subject, setSubject] = React.useState("Mathematics");
  const [grade, setGrade] = React.useState("Grade 8");
  const [studentCount, setStudentCount] = React.useState(12);
  const [questionCount, setQuestionCount] = React.useState(8);
  const [namesText, setNamesText] = React.useState("");
  const [materialText, setMaterialText] = React.useState("");
  const [sourceName, setSourceName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pack, setPack] = React.useState<PrintPack | null>(null);
  const [previewIndex, setPreviewIndex] = React.useState(0);
  const [savedNote, setSavedNote] = React.useState<string | null>(null);
  const [savedPacks, setSavedPacks] = React.useState<
    Array<{ id: string; title: string; studentCount: number; questionCount: number; createdAt: string }>
  >([]);

  const loadSaved = React.useCallback(async () => {
    const res = await fetch("/api/print-tests").catch(() => null);
    if (!res?.ok) return;
    const json = await res.json().catch(() => null);
    if (Array.isArray(json?.packs)) setSavedPacks(json.packs);
  }, []);

  React.useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const onFile = async (file: File) => {
    setSourceName(file.name);
    const raw = await file.text();
    const extracted = extractPlainText(file.name, raw);
    setMaterialText(extracted || raw.slice(0, 40000));
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    const payload = {
      title,
      subject,
      grade,
      locale,
      studentCount: clamp(studentCount, 1, 40),
      questionCount: clamp(questionCount, 3, 35),
      materialText,
      sourceName,
      studentNames: namesText
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch("/api/print-tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.pack) throw new Error(json?.error?.message || "Generate failed");
      setPack(json.pack);
      setPreviewIndex(0);
      setSavedNote(json.saved ? "Saved. You can reopen this pack later." : "Printed in this session only. Sign in and run the database migration to save it.");
      void loadSaved();
    } catch {
      const local = generatePrintPack(payload);
      setPack(local);
      setPreviewIndex(0);
    } finally {
      setBusy(false);
    }
  };

  const openSaved = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/print-tests/${id}`);
      const json = await res.json();
      if (!res.ok || !json.pack) throw new Error("Could not open that pack");
      setPack(json.pack);
      setPreviewIndex(0);
      setSavedNote("Opened the saved pack. Version codes are unchanged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that pack");
    } finally {
      setBusy(false);
    }
  };

  const downloadHtml = (mode: "students" | "key") => {
    if (!pack) return;
    const blob = new Blob([buildPrintHtml(pack, mode)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pack.title.replace(/[^\w-]+/g, "-")}-${mode}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sheet = pack?.sheets[previewIndex];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="eb-lift relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-16 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
            <Printer className="h-3.5 w-3.5" />
            Teacher print desk
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Different paper for every student
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Upload a chapter or notes, choose how many students and questions, then print unique versions.
            Same skills on every sheet — different numbers so the next desk is not a copy.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="eb-lift rounded-3xl border border-border/80 bg-card/90 p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Build a pack</h2>
            <p className="text-sm text-muted-foreground">File, pasted text, or the built-in math bank.</p>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Test title</span>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span>Subject</span>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span>Grade</span>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Students
                </span>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={studentCount}
                  onChange={(e) => setStudentCount(clamp(Number(e.target.value), 1, 40))}
                />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="inline-flex items-center gap-1">
                  <ListOrdered className="h-3.5 w-3.5" /> Questions (3–35)
                </span>
                <Input
                  type="number"
                  min={3}
                  max={35}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(clamp(Number(e.target.value), 3, 35))}
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span>Student names (optional, one per line)</span>
              <textarea
                className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={"Malika Karimova\nJavohir Tursunov"}
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Material
                </span>
                <label className="inline-flex cursor-pointer items-center gap-1 text-primary">
                  <Upload className="h-3.5 w-3.5" />
                  Upload .txt / .md / .pdf
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.text"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onFile(file);
                    }}
                  />
                </label>
              </div>
              <textarea
                className="min-h-36 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={materialText}
                onChange={(e) => setMaterialText(e.target.value)}
                placeholder="Paste a chapter, worksheet, or worked examples. Numbers in math problems will be regenerated per student."
              />
              {sourceName ? <p className="text-xs text-muted-foreground">Source: {sourceName}</p> : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {savedNote ? <p className="text-sm text-primary">{savedNote}</p> : null}

            <Button className="w-full h-11 shadow-sm" onClick={() => void generate()} disabled={busy}>
              <Sparkles className="mr-2 h-4 w-4" />
              {busy ? "Building versions…" : "Create unique tests"}
            </Button>
          </div>
        </section>

        <section className="eb-lift rounded-3xl border border-border/80 bg-card/90 p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Preview & print</h2>
            <p className="text-sm text-muted-foreground">
              {pack
                ? `${pack.studentCount} versions · ${pack.questionCount} questions · ${pack.skills.join(", ")}`
                : "Generate a pack to preview one student sheet at a time."}
            </p>
          </div>

          {!pack || !sheet ? (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-8 text-center text-sm text-muted-foreground">
              No pack yet. Twelve students and eight questions is a good first print run.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                >
                  Previous
                </Button>
                <span className="rounded-full border bg-background px-3 py-1 text-sm">
                  {sheet.studentName} · {sheet.code}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewIndex((i) => Math.min(pack.sheets.length - 1, i + 1))}
                  disabled={previewIndex >= pack.sheets.length - 1}
                >
                  Next
                </Button>
              </div>

              <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-2xl border bg-background/70 p-4">
                {sheet.questions.map((q, i) => (
                  <div key={q.id} className="space-y-1 border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0">
                    <div className="font-medium whitespace-pre-wrap">
                      {i + 1}. {q.prompt}
                    </div>
                    {q.options ? (
                      <ul className="ml-4 list-disc text-muted-foreground">
                        {q.options.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-xs text-primary">
                      Answer: {q.answer}
                      {q.work ? ` · ${q.work}` : ""}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="shadow-sm" onClick={() => openPrintWindow(buildPrintHtml(pack, "students"))}>
                  <FileText className="mr-2 h-4 w-4" />
                  Print student sheets
                </Button>
                <Button variant="outline" onClick={() => openPrintWindow(buildPrintHtml(pack, "key"))}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Print answer key
                </Button>
                <Button variant="outline" onClick={() => downloadHtml("students")}>
                  Download HTML
                </Button>
              </div>
            </div>
          )}
          {savedPacks.length > 0 ? (
            <div className="mt-5 space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Saved packs</p>
              {savedPacks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openSaved(item.id)}
                  className="flex w-full items-center justify-between rounded-xl border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
                >
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.studentCount} students · {item.questionCount} questions
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
