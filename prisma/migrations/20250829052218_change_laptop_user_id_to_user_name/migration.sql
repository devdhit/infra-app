/*
  Warnings:

  - You are about to drop the column `userId` on the `Laptop` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Laptop" DROP CONSTRAINT "Laptop_userId_fkey";

-- DropIndex
DROP INDEX "public"."Laptop_userId_idx";

-- AlterTable
ALTER TABLE "public"."Laptop" DROP COLUMN "userId",
ADD COLUMN     "userName" TEXT;
