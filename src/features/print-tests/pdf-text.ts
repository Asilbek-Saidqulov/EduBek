import { inflateSync } from "node:zlib";

function latin1(bytes: Uint8Array): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return out;
}

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function stringsFromContent(content: string): string[] {
  const found: string[] = [];
  const tj = /\[(.*?)\]\s*TJ|<(?:[0-9A-Fa-f\s]+)>|\((?:\\.|[^\\)])*\)\s*Tj/gs;
  let match: RegExpExecArray | null;
  while ((match = tj.exec(content))) {
    const block = match[0];
    if (block.endsWith("TJ")) {
      const inner = block.replace(/\]\s*TJ$/, "").replace(/^\[/, "");
      const parts = inner.match(/\((?:\\.|[^\\)])*\)|<(?:[0-9A-Fa-f\s]+)>/g) || [];
      const line = parts.map(decodeToken).join("");
      if (line.trim()) found.push(line);
    } else {
      found.push(decodeToken(block.replace(/\s*Tj$/, "")));
    }
  }
  if (found.length) return found;
  const loose = content.match(/\((?:\\.|[^\\)]){2,200}\)/g) || [];
  return loose.map((token) => decodePdfLiteral(token.slice(1, -1)));
}

function decodeToken(token: string): string {
  if (token.startsWith("(")) return decodePdfLiteral(token.slice(1, -1));
  const hex = token.replace(/[<>\s]/g, "");
  if (hex.length < 4 || hex.length % 2) return "";
  let text = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code >= 32 && code < 127) text += String.fromCharCode(code);
    else if (code > 127) text += " ";
  }
  return text;
}

function inflate(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(inflateSync(bytes));
  } catch {
    try {
      return new TextDecoder("latin1").decode(inflateSync(bytes));
    } catch {
      return null;
    }
  }
}

export function extractPdfText(bytes: Uint8Array): string {
  const raw = latin1(bytes);
  const pieces: string[] = [];
  const stream = /stream\r?\n([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;
  while ((match = stream.exec(raw))) {
    const start = match.index;
    const header = raw.slice(Math.max(0, start - 240), start);
    const body = match[1];
    const bodyBytes = Uint8Array.from(body, (ch) => ch.charCodeAt(0) & 0xff);
    const content = /FlateDecode/.test(header) ? inflate(bodyBytes) : body;
    if (!content) continue;
    pieces.push(...stringsFromContent(content));
  }
  const text = pieces
    .join("\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return readableText(text);
}

export function readableText(text: string): string {
  const clean = text.replace(/\u0000/g, " ").replace(/[^\S\n]+/g, " ").trim();
  const letters = (clean.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/g) || []).length;
  if (letters < 40 || letters / Math.max(clean.length, 1) < 0.25) return "";
  return clean.slice(0, 40000);
}

export function vocabEntries(text: string): Array<{ word: string; meaning: string }> {
  const entries: Array<{ word: string; meaning: string }> = [];
  const seen = new Set<string>();
  for (const line of text.split(/\n+/)) {
    const match = line.match(/^([A-Za-z][A-Za-z'’-]{2,24})\s*(?:[-–—:|]| means )\s+(.{4,160})$/);
    if (!match) continue;
    const word = match[1].trim();
    const meaning = match[2].trim();
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ word, meaning });
    if (entries.length >= 80) break;
  }
  return entries;
}
