-- CreateEnum
CREATE TYPE "PostMediaType" AS ENUM ('IMAGE', 'VIDEO', 'LINK');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "mediaType" "PostMediaType",
ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "portfolioLinks" JSONB,
ADD COLUMN     "profession" TEXT;
