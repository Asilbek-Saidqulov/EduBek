/**
 * EduBek — Privacy Engine (System 3).
 * Detects PII, student/teacher identifiers, emails, phones, government IDs,
 * API keys, tokens, secret leakage. Recommends masking, redaction, encryption,
 * retention policy. Never modifies stored data automatically.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type { PrivacyReport, PrivacyFinding, PrivacyKind } from "./types";

const log = getLogger("privacy-engine");

export async function evaluatePrivacy(input: {
  text: string;
  context?: string;
}): Promise<PrivacyReport> {
  const findings: PrivacyFinding[] = [];
  findings.push(...detectPII(input.text));
  findings.push(...detectEmails(input.text));
  findings.push(...detectPhones(input.text));
  findings.push(...detectGovernmentIDs(input.text));
  findings.push(...detectAPIKeys(input.text));
  findings.push(...detectTokens(input.text));
  findings.push(...detectSecretLeakage(input.text));
  const totalCount = findings.length;
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const privacyScore = Math.max(0, 100 - totalCount * 10 - criticalCount * 20);
  const recommendations = generateRecommendations(findings);
  log.info("privacy.evaluate_complete", { findings: totalCount, critical: criticalCount, score: privacyScore });
  return {
    generatedAt: new Date().toISOString(), findings, totalCount,
    criticalCount, privacyScore, recommendations,
  };
}

function detectPII(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  // Student/teacher identifiers — common patterns
  const idPatterns: Array<{ regex: RegExp; kind: PrivacyKind; desc: string }> = [
    { regex: /student[_\s-]?id\s*[:=]?\s*\w+/gi, kind: "student_identifier", desc: "Student identifier detected" },
    { regex: /teacher[_\s-]?id\s*[:=]?\s*\w+/gi, kind: "teacher_identifier", desc: "Teacher identifier detected" },
    { regex: /\b\d{3}-\d{2}-\d{4}\b/g, kind: "government_id", desc: "Social Security Number detected" },
  ];
  for (const p of idPatterns) {
    const matches = text.matchAll(p.regex);
    for (const m of matches) {
      findings.push({
        id: randomUUID(), kind: p.kind, severity: p.kind === "government_id" ? "critical" : "high",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: p.kind === "government_id" ? "redact" : "mask",
        description: p.desc,
      });
    }
  }
  return findings;
}

function detectEmails(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  for (const m of text.matchAll(emailRegex)) {
    findings.push({
      id: randomUUID(), kind: "email", severity: "medium",
      detectedText: m[0], maskedText: maskEmail(m[0]),
      recommendation: "mask", description: "Email address detected",
    });
  }
  return findings;
}

function detectPhones(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  for (const m of text.matchAll(phoneRegex)) {
    if (m[0].length >= 10) {
      findings.push({
        id: randomUUID(), kind: "phone", severity: "medium",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: "mask", description: "Phone number detected",
      });
    }
  }
  return findings;
}

function detectGovernmentIDs(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  // Passport, driver's license patterns
  const patterns = [
    { regex: /\b[A-Z]{2}\d{7}\b/g, desc: "Passport number detected" },
    { regex: /\b[A-Z]\d{8}\b/g, desc: "Driver's license detected" },
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p.regex)) {
      findings.push({
        id: randomUUID(), kind: "government_id", severity: "critical",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: "redact", description: p.desc,
      });
    }
  }
  return findings;
}

function detectAPIKeys(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const patterns = [
    { regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/gi, desc: "API key detected" },
    { regex: /\bsk-[A-Za-z0-9]{20,}\b/g, desc: "OpenAI-style API key detected" },
    { regex: /\bAKIA[A-Z0-9]{16}\b/g, desc: "AWS access key detected" },
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p.regex)) {
      findings.push({
        id: randomUUID(), kind: "api_key", severity: "critical",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: "encrypt", description: p.desc,
      });
    }
  }
  return findings;
}

function detectTokens(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const patterns = [
    { regex: /(?:bearer|token)\s+[A-Za-z0-9_\-\.]{20,}/gi, desc: "Bearer token detected" },
    { regex: /\beyJ[A-Za-z0-9_\-\.]{20,}\b/g, desc: "JWT token detected" },
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p.regex)) {
      findings.push({
        id: randomUUID(), kind: "token", severity: "critical",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: "encrypt", description: p.desc,
      });
    }
  }
  return findings;
}

function detectSecretLeakage(text: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const patterns = [
    { regex: /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi, desc: "Password detected in text" },
    { regex: /(?:secret|private[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-]{10,}["']?/gi, desc: "Secret/private key detected" },
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p.regex)) {
      findings.push({
        id: randomUUID(), kind: "secret_leakage", severity: "critical",
        detectedText: m[0], maskedText: maskText(m[0]),
        recommendation: "redact", description: p.desc,
      });
    }
  }
  return findings;
}

function maskText(text: string): string {
  if (text.length <= 4) return "****";
  return text.slice(0, 2) + "*".repeat(text.length - 4) + text.slice(-2);
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "****";
  return user.slice(0, 2) + "***@" + domain;
}

function generateRecommendations(findings: PrivacyFinding[]): string[] {
  const recs: string[] = [];
  const maskCount = findings.filter(f => f.recommendation === "mask").length;
  const redactCount = findings.filter(f => f.recommendation === "redact").length;
  const encryptCount = findings.filter(f => f.recommendation === "encrypt").length;
  if (maskCount > 0) recs.push(`Mask ${maskCount} sensitive field(s) before storing or transmitting.`);
  if (redactCount > 0) recs.push(`Redact ${redactCount} critical field(s) — do not store or transmit.`);
  if (encryptCount > 0) recs.push(`Encrypt ${encryptCount} secret(s) at rest using AES-256.`);
  if (findings.some(f => f.kind === "student_identifier")) recs.push("Review FERPA compliance for student identifier exposure.");
  if (findings.some(f => f.kind === "government_id")) recs.push("Review GDPR Article 9 compliance for government ID processing.");
  return recs;
}
