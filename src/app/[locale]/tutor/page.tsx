import { setRequestLocale } from "next-intl/server";
import { TutorView } from "./view";

export const dynamic = "force-dynamic";

export default async function TutorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    subject?: string;
    topic?: string;
    sessionId?: string;
    q?: string;
    your?: string;
    correct?: string;
    exp?: string;
    quizTitle?: string;
    difficulty?: string;
  }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  return (
    <TutorView
      initialSubject={search.subject}
      initialTopic={search.topic}
      initialSessionId={search.sessionId}
      mistakeQuestion={search.q}
      mistakeYourAnswer={search.your}
      mistakeCorrectAnswer={search.correct}
      mistakeExplanation={search.exp}
      quizTitle={search.quizTitle}
      difficulty={search.difficulty}
    />
  );
}
