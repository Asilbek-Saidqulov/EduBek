import { db } from "@/lib/db";
import type { PrintPack } from "@/features/print-tests/engine";

export async function savePrintPack(teacherId: string, pack: PrintPack) {
  return db.printPack.create({
    data: {
      id: pack.id,
      teacherId,
      title: pack.title,
      subject: pack.subject || null,
      grade: pack.grade || null,
      locale: pack.locale,
      sourceName: pack.sourceName || null,
      studentCount: pack.studentCount,
      questionCount: pack.questionCount,
      skills: JSON.stringify(pack.skills || []),
      payload: JSON.stringify(pack),
    },
    select: { id: true, createdAt: true },
  });
}

export async function listPrintPacks(teacherId: string) {
  const rows = await db.printPack.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      title: true,
      subject: true,
      grade: true,
      studentCount: true,
      questionCount: true,
      sourceName: true,
      createdAt: true,
    },
  });
  return rows;
}

export async function getPrintPack(teacherId: string, id: string): Promise<PrintPack | null> {
  const row = await db.printPack.findFirst({
    where: { id, teacherId },
    select: { payload: true },
  });
  if (!row?.payload) return null;
  return JSON.parse(row.payload) as PrintPack;
}
