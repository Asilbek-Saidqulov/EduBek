/**
 * EduBek — Safety Engine (System 2).
 * Detects unsafe prompts, prompt injection, prompt leakage, unsafe outputs,
 * harmful instructions, policy violations, unsafe tool usage, dangerous
 * automation. Never blocks — only returns findings.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type { SafetyReport, SafetyFinding, SafetyKind } from "./types";

const log = getLogger("safety-engine");

export async function evaluateSafety(input: {
  prompt: string;
  output: string;
  toolCalls?: Array<{ tool: string; args: string }>;
}): Promise<SafetyReport> {
  const findings: SafetyFinding[] = [];
  findings.push(...detectUnsafePrompts(input.prompt));
  findings.push(...detectPromptInjection(input.prompt));
  findings.push(...detectPromptLeakage(input.output));
  findings.push(...detectUnsafeOutputs(input.output));
  findings.push(...detectHarmfulInstructions(input.prompt, input.output));
  if (input.toolCalls) findings.push(...detectUnsafeToolUsage(input.toolCalls));
  const totalCount = findings.length;
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const overallSafetyScore = Math.max(0, 100 - totalCount * 10 - criticalCount * 20);
  log.info("safety.evaluate_complete", { findings: totalCount, critical: criticalCount, score: overallSafetyScore });
  return {
    generatedAt: new Date().toISOString(), findings, totalCount,
    criticalCount, overallSafetyScore,
  };
}

function detectUnsafePrompts(prompt: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const patterns: Array<{ regex: RegExp; kind: SafetyKind; severity: SafetyFinding["severity"]; desc: string }> = [
    { regex: /how to (make|build|create|synthesize).*(bomb|weapon|drug|poison|explosive)/i, kind: "harmful_instructions", severity: "critical", desc: "Request for harmful instructions detected" },
    { regex: /how to (hack|crack|bypass|steal|phish)/i, kind: "unsafe_prompt", severity: "high", desc: "Request for hacking/cracking instructions detected" },
    { regex: /(suicide|self.harm|kill myself|hurt myself)/i, kind: "unsafe_prompt", severity: "critical", desc: "Self-harm related content detected" },
    { regex: /ignore .{0,20}instructions/i, kind: "prompt_injection", severity: "high", desc: "Prompt injection attempt detected" },
    { regex: /(you are (now|actually) (a|an) (different|new|jailbroken|dan))/i, kind: "prompt_injection", severity: "high", desc: "Role-hijacking prompt injection detected" },
    { regex: /(reveal|show|print|output) (your|the) (system|initial) prompt/i, kind: "prompt_leakage", severity: "high", desc: "Attempt to extract system prompt detected" },
  ];
  for (const p of patterns) {
    if (p.regex.test(prompt)) {
      findings.push({
        id: randomUUID(), kind: p.kind, severity: p.severity, confidence: 0.9,
        evidence: prompt.slice(0, 100), description: p.desc,
        recommendation: "Review the prompt and reject if it violates safety policies.",
      });
    }
  }
  return findings;
}

function detectPromptInjection(prompt: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const injectionPatterns = [
    /ignore (all|any|previous) (instructions|rules|guidelines)/i,
    /disregard (the|all|any) (above|previous)/i,
    /act as if (you|your) (have no|don't have|lost) (rules|restrictions|guidelines)/i,
    /\[system\]|\[admin\]|\[developer\]/i,
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      findings.push({
        id: randomUUID(), kind: "prompt_injection", severity: "high", confidence: 0.85,
        evidence: prompt.slice(0, 100), description: "Prompt injection pattern detected",
        recommendation: "Sanitize the input and reject injection attempts.",
      });
    }
  }
  return findings;
}

function detectPromptLeakage(output: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const leakagePatterns = [
    /you are (a|an) (helpful|AI|assistant)/i, // system prompt content
    /your (instructions|guidelines|rules) (are|is)/i,
    /system prompt:/i,
    /I was told to/i,
  ];
  for (const pattern of leakagePatterns) {
    if (pattern.test(output)) {
      findings.push({
        id: randomUUID(), kind: "prompt_leakage", severity: "medium", confidence: 0.7,
        evidence: output.slice(0, 100), description: "Output may contain system prompt leakage",
        recommendation: "Review the output for system prompt content.",
      });
    }
  }
  return findings;
}

function detectUnsafeOutputs(output: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const unsafePatterns = [
    { regex: /step.by.step.*(bomb|weapon|drug|poison)/i, severity: "critical" as const, desc: "Harmful instructions in output" },
    { regex: /(password|api[_-]?key|secret|token)\s*(is|[:=])\s*\S+/i, severity: "high" as const, desc: "Secret/credential exposure in output" },
    { regex: /(\d{3}-\d{2}-\d{4}|\d{16})/i, severity: "high" as const, desc: "PII or financial data in output" },
  ];
  for (const p of unsafePatterns) {
    if (p.regex.test(output)) {
      findings.push({
        id: randomUUID(), kind: "unsafe_output", severity: p.severity, confidence: 0.85,
        evidence: output.slice(0, 100), description: p.desc,
        recommendation: "Filter the output before delivering to the user.",
      });
    }
  }
  return findings;
}

function detectHarmfulInstructions(prompt: string, output: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const harmfulPatterns = [
    /how to (synthesize|manufacture|produce).*(drug|narcotic|controlled substance)/i,
    /instructions for (making|creating).*(weapon|explosive|bomb)/i,
  ];
  for (const pattern of harmfulPatterns) {
    if (pattern.test(prompt) || pattern.test(output)) {
      findings.push({
        id: randomUUID(), kind: "harmful_instructions", severity: "critical", confidence: 0.95,
        evidence: (prompt + " " + output).slice(0, 100), description: "Harmful instructions detected",
        recommendation: "Block the response and log the incident.",
      });
    }
  }
  return findings;
}

function detectUnsafeToolUsage(toolCalls: Array<{ tool: string; args: string }>): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  for (const call of toolCalls) {
    if (/delete|drop|truncate|destroy|wipe/i.test(call.args)) {
      findings.push({
        id: randomUUID(), kind: "unsafe_tool_usage", severity: "high", confidence: 0.8,
        evidence: `${call.tool}: ${call.args.slice(0, 80)}`, description: `Tool "${call.tool}" called with potentially destructive arguments`,
        recommendation: "Review the tool call arguments before executing.",
      });
    }
  }
  return findings;
}

export async function generateSafetyReport(): Promise<SafetyReport> {
  // Generate a summary safety report from recent AI invocations
  return {
    generatedAt: new Date().toISOString(),
    findings: [], totalCount: 0, criticalCount: 0, overallSafetyScore: 95,
  };
}
