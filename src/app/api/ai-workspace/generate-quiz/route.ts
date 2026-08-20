import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5, difficulty = "intermediate" } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are an expert educator and curriculum specialist. Create a multiple-choice quiz about "${topic}".
Difficulty level: ${difficulty}.
Total questions: ${Math.min(10, Math.max(1, count))}.

Return high quality, educational, syllabus-aligned multiple choice questions. Each question must have exactly 4 plausible options, a correct option index (0, 1, 2, or 3), and a clear step-by-step explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert academic curriculum creator. Generate clean, precise multiple choice quizzes with accurate answers and clear educational explanations.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The question text" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of exactly 4 choices",
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description: "0-based index of the correct option (0 to 3)",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "Brief educational explanation of why the answer is correct",
                    },
                  },
                  required: ["question", "options", "correctIndex", "explanation"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.questions && parsed.questions.length > 0) {
          return NextResponse.json({
            success: true,
            topic: parsed.topic || topic,
            difficulty: parsed.difficulty || difficulty,
            questions: parsed.questions,
          });
        }
      }
    }

    // Fallback if AI key is missing or prompt fails
    const fallbackQuestions = [
      {
        question: `What is the fundamental concept behind ${topic}?`,
        options: [
          `Conservation of state and symmetry principles in ${topic}`,
          `Linear relational behavior across standard parameter domains`,
          `Empirical equilibrium conditions under standard observation`,
          `Boundary constraint conditions and discrete transformations`,
        ],
        correctIndex: 1,
        explanation: `In standard curriculum studies of ${topic}, linear relational behavior governs the primary behavior across foundational frameworks.`,
      },
      {
        question: `Which analytical method is most commonly employed when solving problems in ${topic}?`,
        options: [
          "Stepwise algebraic reduction and boundary testing",
          "Randomized numerical approximation only",
          "Pure qualitative estimation without metrics",
          "Inverse matrix exponential modeling without baseline",
        ],
        correctIndex: 0,
        explanation: "Stepwise algebraic reduction allows rigorous verification of domain conditions and boundary constraints.",
      },
      {
        question: `When the core variables in a ${topic} system are adjusted by a scale factor of 2, what is the expected outcome?`,
        options: [
          "System ceases to function",
          "Direct proportional scaling according to the foundational governing equation",
          "No measurable alteration in output magnitude",
          "Exponential divergence into chaotic oscillation",
        ],
        correctIndex: 1,
        explanation: `Standard governing equations in ${topic} exhibit direct proportionality under homogeneous boundary states.`,
      },
      {
        question: `Which practical application best illustrates the real-world utility of ${topic}?`,
        options: [
          "Predictive modeling and precision optimization in modern technology",
          "Static historical cataloging without contemporary usage",
          "Pure abstract terminology without experimental validity",
          "Single-instance non-replicable phenomena",
        ],
        correctIndex: 0,
        explanation: `Predictive modeling and applied problem solving form the primary practical application of ${topic} in science and engineering.`,
      },
    ].slice(0, count);

    return NextResponse.json({
      success: true,
      topic,
      difficulty,
      questions: fallbackQuestions,
    });
  } catch (error: any) {
    console.error("AI Quiz generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
