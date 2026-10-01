import { NextResponse } from "next/server";
import { extractPdfText, readableText } from "@/features/print-tests/pdf-text";
import { readImageText } from "@/features/print-tests/ai-bank";

const IMAGE = /\.(png|jpe?g|webp)$/i;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { code: "NO_FILE", message: "Choose a file." } }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
    const text = readableText(await file.text());
    if (!text) {
      return NextResponse.json({ error: { code: "EMPTY", message: "That file has no readable text." } }, { status: 422 });
    }
    return NextResponse.json({ success: true, text, sourceName: file.name });
  }
  if (IMAGE.test(name)) {
    if (file.size > 1_500_000) {
      return NextResponse.json({ error: { code: "TOO_LARGE", message: "Use an image under 1.5 MB. One page is enough." } }, { status: 413 });
    }
    try {
      const text = await readImageText(new Uint8Array(await file.arrayBuffer()), file.type || "image/png");
      return NextResponse.json({ success: true, text, sourceName: file.name, aiUsed: true });
    } catch (error) {
      return NextResponse.json(
        { error: { code: "IMAGE_READ_FAILED", message: error instanceof Error ? error.message : "Could not read that image." } },
        { status: 422 }
      );
    }
  }
  if (!name.endsWith(".pdf")) {
    return NextResponse.json({ error: { code: "UNSUPPORTED", message: "Upload a .pdf, .png, .jpg, .txt, or .md file." } }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = extractPdfText(bytes);
  if (!text) {
    return NextResponse.json(
      { error: { code: "UNREADABLE_PDF", message: "This PDF has no copyable text. Upload a page image, or paste the word list." } },
      { status: 422 }
    );
  }
  return NextResponse.json({ success: true, text, sourceName: file.name });
}

