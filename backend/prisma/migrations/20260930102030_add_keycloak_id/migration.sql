-- AlterTable
ALTER TABLE "User" ADD COLUMN     "keycloakId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_keycloakId_key" ON "User"("keycloakId");
