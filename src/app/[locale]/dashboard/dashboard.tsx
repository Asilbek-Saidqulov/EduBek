"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Brain, CheckCircle2, Circle, Compass, Flame, Gamepad2, Play, Send, Sparkles, Users } from "lucide-react";

import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";

const T = {
  uz: {
    greet: (n: string) => `Salom, ${n}!`,
    sub: "Bugun nimani o'rganamiz?",
    resume: "Davom ettirish",
    quiz: "Test ishlash",
    today: "Bugungi reja",
    weak: "Qiyin mavzular",
    weakHint: "Testlardagi xatolarga asoslangan",
    tutor: "AI o'qituvchi",
    placeholder: "Savol bering yoki misol so'rang...",
    empty: "Hozircha reja yo'q. Dars boshlang yoki o'qituvchidan vazifa so'rang.",
    progress: "bajarildi",
  },
  ru: {
    greet: (n: string) => `Привет, ${n}!`,
    sub: "Что изучаем сегодня?",
    resume: "Продолжить",
    quiz: "Пройти тест",
    today: "План на сегодня",
    weak: "Сложные темы",
    weakHint: "На основе ошибок в тестах",
    tutor: "AI-наставник",
    placeholder: "Задайте вопрос или попросите пример...",
    empty: "Плана пока нет. Начните урок или попросите задание у учителя.",
    progress: "выполнено",
  },
  en: {
    greet: (n: string) => `Hi, ${n}!`,
    sub: "What are we learning today?",
    resume: "Resume",
    quiz: "Quiz me",
    today: "Today's plan",
    weak: "Needs practice",
    weakHint: "Based on your quiz mistakes",
    tutor: "AI Tutor",
    placeholder: "Ask a question or request an example...",
    empty: "No plan yet. Start a lesson or ask your teacher for tasks.",
    progress: "done",
  },
};

export function DashboardView({ initialUser }: { initialUser: any }) {
  const { user } = useCurrentUser();
  const locale = useLocale() as keyof typeof T;
  const t = T[locale] || T.en;
  const currentUser = user ?? initialUser;
  const name = currentUser?.name || currentUser?.username || "Student";

  const { data: home, isLoading } = useQuery({
    queryKey: ["home-aggregate"],
    queryFn: () => api.get("/api/home"),
    enabled: !!currentUser?.id,
  });

  return (
    <div className="min-h-[80vh] bg-background text-foreground">
      <header className="px-2 pt-2 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.greet(name)}</h1>
          <p className="text-muted-foreground mt-1">{t.sub}</p>
        </div>
        {home?.streak > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-sm font-medium text-amber-700">
            <Flame className="size-4" /> {home.streak}
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <main className="space-y-6">
          <ContinueCard item={home?.continueItem} t={t} loading={isLoading} />
          <TodayPlan items={home?.todayPlan ?? []} t={t} />
          <WeakTopics topics={home?.weakTopics ?? []} t={t} />

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/classrooms"><Users className="size-3.5 mr-1" /> Class</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/live-quiz?tab=create"><Gamepad2 className="size-3.5 mr-1" /> Create Quiz</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/discover"><Compass className="size-3.5 mr-1" /> Discover</Link>
            </Button>
          </div>
        </main>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <TutorPanel t={t} locale={locale} context={home} />
        </aside>
      </div>
    </div>
  );
}

function ContinueCard({ item, t, loading }: any) {
  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  if (!item) return null;
  const done = Number(item.done) || 0;
  const total = Number(item.total) || 1;
  const pct = Math.min(100, Math.round((done / total) * 100));

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.subject}</p>
      <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{done}/{total} {t.progress}</p>
      <div className="mt-5 flex gap-3">
        <Button asChild>
          <Link href="/tutor"><Play className="size-4" /> {t.resume}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/live-quiz"><Brain className="size-4" /> {t.quiz}</Link>
        </Button>
      </div>
    </section>
  );
}

function TodayPlan({ items, t }: any) {
  const [list, setList] = React.useState(items);
  React.useEffect(() => setList(items), [items]);

  const toggle = (id: string) => {
    setList((prev: any[]) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h3 className="font-semibold">{t.today}</h3>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {list.map((i: any) => (
            <li key={i.id}>
              <button onClick={() => toggle(i.id)} className="flex w-full items-center gap-3 py-3 text-left">
                {i.done ? <CheckCircle2 className="text-primary size-5" /> : <Circle className="text-muted-foreground size-5" />}
                <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WeakTopics({ topics, t }: any) {
  if (!topics?.length) return null;
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h3 className="font-semibold">{t.weak}</h3>
      <p className="text-xs text-muted-foreground">{t.weakHint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {topics.map((topic: any) => (
          <span key={topic.id} className="rounded-full bg-rose-50 dark:bg-rose-950/40 px-3 py-1 text-sm text-rose-700">
            {topic.name} · {topic.errorRate}%
          </span>
        ))}
      </div>
    </section>
  );
}

function TutorPanel({ t, locale, context }: any) {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  const suggestions = [
    context?.continueItem ? `Explain the next part of ${context.continueItem.title}` : null,
    context?.weakTopics?.[0] ? `Give me 3 practice problems on ${context.weakTopics[0].name}` : null,
    "Quiz me on what I learned today",
  ].filter(Boolean);

  React.useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "..." }]);

    try {
      const res = await api.post("/api/tutor/chat", { message: msg, locale, context });
      const reply = res?.reply || res?.text || "I'm here to help!";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: reply };
        return copy;
      });
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, tutor is temporarily unavailable." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Sparkles className="text-primary size-4" />
        <span className="text-sm font-semibold uppercase tracking-wide">{t.tutor}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl bg-muted p-4 text-sm">
            {locale === "uz" ? "Assalomu alaykum! Qaysi mavzuda yordam kerak?" :
             locale === "ru" ? "Здравствуйте! С какой темой нужна помощь?" :
             "Hi! What do you want help with?"}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <span className={`inline-block max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              {m.content}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted">
              {s}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}