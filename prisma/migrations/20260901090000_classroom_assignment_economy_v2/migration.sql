-- Incremental only. Does not replay 20260819 / 20260821 migrations.
-- Safe to apply on a DB that already has those migrations.

-- Classroom fields used by classroom.ts
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "grade" TEXT;
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "joinCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Classroom_joinCode_key" ON "Classroom"("joinCode");
CREATE INDEX IF NOT EXISTS "Classroom_joinCode_idx" ON "Classroom"("joinCode");

-- Assignment fields used by assignment.ts
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "assessmentId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "opensAt" TIMESTAMP(3);
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

ALTER TABLE "Assignment" ALTER COLUMN "resourceId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Assignment_assessmentId_idx" ON "Assignment"("assessmentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_assessmentId_fkey'
  ) THEN
    ALTER TABLE "Assignment"
      ADD CONSTRAINT "Assignment_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Economy V2 durable rails
CREATE TABLE IF NOT EXISTS "EconomyJournalEntry" (
    "id" TEXT NOT NULL,
    "journalCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyJournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EconomyJournalEntry_journalCode_idx" ON "EconomyJournalEntry"("journalCode");
CREATE INDEX IF NOT EXISTS "EconomyJournalEntry_referenceType_referenceId_idx" ON "EconomyJournalEntry"("referenceType", "referenceId");

CREATE TABLE IF NOT EXISTS "EconomyJournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "subAccount" TEXT,
    "currency" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyJournalLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EconomyJournalLine_entryId_idx" ON "EconomyJournalLine"("entryId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EconomyJournalLine_entryId_fkey'
  ) THEN
    ALTER TABLE "EconomyJournalLine"
      ADD CONSTRAINT "EconomyJournalLine_entryId_fkey"
      FOREIGN KEY ("entryId") REFERENCES "EconomyJournalEntry"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "EconomyOrder" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "amountUzs" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "snapshot" TEXT NOT NULL DEFAULT '{}',
    "provider" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EconomyOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EconomyOrder_idempotencyKey_key" ON "EconomyOrder"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "EconomyOrder_buyerId_idx" ON "EconomyOrder"("buyerId");
CREATE INDEX IF NOT EXISTS "EconomyOrder_status_idx" ON "EconomyOrder"("status");

CREATE TABLE IF NOT EXISTS "EconomyPaymentIntent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "amountUzs" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EconomyPaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EconomyPaymentIntent_orderId_idx" ON "EconomyPaymentIntent"("orderId");

CREATE TABLE IF NOT EXISTS "EconomyPaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyPaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EconomyPaymentEvent_provider_eventId_key" ON "EconomyPaymentEvent"("provider", "eventId");

CREATE TABLE IF NOT EXISTS "EconomyCreatorBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pendingUzs" BIGINT NOT NULL DEFAULT 0,
    "availableUzs" BIGINT NOT NULL DEFAULT 0,
    "payoutLockedUzs" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EconomyCreatorBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EconomyCreatorBalance_userId_key" ON "EconomyCreatorBalance"("userId");

CREATE TABLE IF NOT EXISTS "EconomyEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EconomyEntitlement_userId_listingId_key" ON "EconomyEntitlement"("userId", "listingId");
