/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
