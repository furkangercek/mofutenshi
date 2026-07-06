-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kdvRatePercent" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "kdvRatePercent" INTEGER NOT NULL DEFAULT 20;
