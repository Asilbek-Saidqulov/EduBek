import { z } from "zod";
import { generateStructuredJson } from "@/lib/ai";
import { compactSource, type BankItem } from "@/features/print-tests/engine";

const bankSchema = z.object({
  items: z.array(
    z.object({
      skill: z.string().min(2).max(40),
      prompt: z.string().min(8).max(400),
      options: z.array(z.string().min(1).max(180)).min(4).max(4),
      answer: z.string().min(1).max(180),
    })
  ).min(3).max(12),
});

const extractSchema = z.object({
  text: z.string().min(20).max(1800),
});

function visionModel() {
  return process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash";
}

export async function buildItemBank(input: {
  title: string;
  subject: string;
  locale: string;
  materialText: string;
  questionCount: number;
}): Promise<BankItem[] | null> {
  const source = compactSource(input.materialText);
  if (source.length < 40) return null;
  const count = Math.min(12, Math.max(4, input.questionCount));
  const result = await generateStructuredJson({
    temperature: 0.3,
    maxTokens: 1400,
    schema: bankSchema,
    systemPrompt: [
      "You write school-safe printable test items for EduBek.",
      "Use only the supplied extract. Do not invent a different subject.",
      "Return one shared item bank. Student papers will shuffle these options locally.",
      "Each item has exactly 4 options. The answer must be one of the options.",
      input.locale === "uz"
        ? "Write in Uzbek Latin."
        : input.locale === "ru"
          ? "Write in Russian."
          : "Write in English.",
    ].join("\n"),
    prompt: `Subject: ${input.subject || "General"}
Title: ${input.title || "Class test"}
Make ${count} multiple-choice items from this extract only:
${source}`,
  });
  return result.data.items;
}

export async function readImageText(bytes: Uint8Array, mime: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://edubek.app",
      "X-Title": "EduBek print tests",
    },
    body: JSON.stringify({
      model: visionModel(),
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Read the school page. Return JSON {\"text\":\"...\"} with only the words, definitions, and facts a teacher would test. Max 1500 characters. School-safe.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the testable text from this page." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Image read failed (${response.status})`);
  const payload = await response.json();
  const raw = payload.choices?.[0]?.message?.content || "";
  const parsed = extractSchema.parse(JSON.parse(raw.replace(/```json|```/g, "").trim()));
  return parsed.text;
}
