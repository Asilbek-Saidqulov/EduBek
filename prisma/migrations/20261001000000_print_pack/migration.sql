-- Teacher print packs. One row = one class print run (sheets + answer key as JSON text).
CREATE TABLE IF NOT EXISTS "PrintPack" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "classroomId" TEXT,
  "title" TEXT NOT NULL,
  "subject" TEXT,
  "grade" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "studentCount" INTEGER NOT NULL,
  "questionCount" INTEGER NOT NULL,
  "sourceName" TEXT,
  "skills" TEXT NOT NULL DEFAULT '[]',
  "payload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrintPack_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrintPack_teacherId_createdAt_idx" ON "PrintPack"("teacherId", "createdAt");

ALTER TABLE "PrintPack"
  ADD CONSTRAINT "PrintPack_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
