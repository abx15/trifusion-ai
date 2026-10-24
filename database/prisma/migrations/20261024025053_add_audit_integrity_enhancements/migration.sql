-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorType" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "chainHash" TEXT,
ADD COLUMN     "grantId" TEXT,
ADD COLUMN     "outcome" TEXT NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "AuditLog_chainHash_idx" ON "AuditLog"("chainHash");

-- CreateIndex
CREATE INDEX "AuditLog_grantId_idx" ON "AuditLog"("grantId");
