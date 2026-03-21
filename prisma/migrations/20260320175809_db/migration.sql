/*
  Warnings:

  - Added the required column `password_hash` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `coaches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "password_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "password_hash" TEXT NOT NULL;
