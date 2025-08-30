/*
  Warnings:

  - You are about to drop the column `userId` on the `PC` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PC" DROP CONSTRAINT "PC_userId_fkey";

-- DropIndex
DROP INDEX "public"."PC_userId_idx";

-- AlterTable
ALTER TABLE "public"."PC" DROP COLUMN "userId",
ADD COLUMN     "userName" TEXT;
