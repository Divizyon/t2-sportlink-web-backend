/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `AdminProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AdminProfile" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_username_key" ON "AdminProfile"("username");
