-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "communityId" TEXT;

-- CreateIndex
CREATE INDEX "Event_communityId_idx" ON "Event"("communityId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
