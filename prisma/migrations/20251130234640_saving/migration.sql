/*
  Warnings:

  - You are about to drop the column `value` on the `assets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `purchasePrice` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalValue` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assets" DROP COLUMN "value",
ADD COLUMN     "currentPrice" DOUBLE PRECISION,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "purchasePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "symbol" TEXT,
ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "incomes" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "savings" ADD COLUMN     "category" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "goalAmount" DOUBLE PRECISION,
ADD COLUMN     "isEmergency" BOOLEAN DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT DEFAULT 'deposit',
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "asset_price_history" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");

-- AddForeignKey
ALTER TABLE "asset_price_history" ADD CONSTRAINT "asset_price_history_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
