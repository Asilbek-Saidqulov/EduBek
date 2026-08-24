-- Add sessionTokenHash to UserSession for secure session token storage
ALTER TABLE "UserSession" ADD COLUMN "sessionTokenHash" TEXT;
CREATE UNIQUE INDEX "UserSession_sessionTokenHash_key" ON "UserSession"("sessionTokenHash");
CREATE INDEX "UserSession_sessionTokenHash_idx" ON "UserSession"("sessionTokenHash");
